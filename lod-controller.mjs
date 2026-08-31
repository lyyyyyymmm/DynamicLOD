export const DEFAULT_LOD_POLICY = Object.freeze({
  frameBudgetMs: 1000 / 30,
  windowMs: 2000,
  controlIntervalMs: 500,
  predictionHorizonMs: 1000,
  ewmaAlpha: 0.4,
  trendSampleCount: 4,
  requestPersistenceMs: 1500,
  requestImpulseThreshold: 24,
  requestReleaseMs: 1000,
  interactionHoldMs: 1500,
  recoveryStableTicks: 4,
  downgradeCooldownMs: 500,
  upgradeCooldownMs: 1500,
  preemptiveRatio: 0.9,
  recoveryRatio: 0.8,
  criticalRatio: 1.2,
  warmupMs: 10000,
  initialSse: 16,
  sseLadder: Object.freeze([4, 6, 8, 12, 16, 24, 32, 48, 64]),
  predictionEnabled: true,
  requestPressureEnabled: true,
  interactionAware: true,
  stabilityEnabled: true,
});

function finiteNumber(value, name) {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
  return Number(value);
}

function nearestLadderIndex(ladder, value) {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < ladder.length; index += 1) {
    const distance = Math.abs(ladder[index] - value);
    if (distance < bestDistance) {
      bestIndex = index;
      bestDistance = distance;
    }
  }
  return bestIndex;
}

function linearSlope(samples) {
  if (samples.length < 2) return 0;
  const meanTime = samples.reduce((sum, item) => sum + item.timeSec, 0) / samples.length;
  const meanValue = samples.reduce((sum, item) => sum + item.value, 0) / samples.length;
  let numerator = 0;
  let denominator = 0;
  for (const item of samples) {
    const timeDelta = item.timeSec - meanTime;
    numerator += timeDelta * (item.value - meanValue);
    denominator += timeDelta * timeDelta;
  }
  return denominator > 0 ? numerator / denominator : 0;
}

export class LodController {
  constructor(overrides = {}) {
    this.policy = {
      ...DEFAULT_LOD_POLICY,
      ...overrides,
      sseLadder: [...(overrides.sseLadder ?? DEFAULT_LOD_POLICY.sseLadder)],
    };
    this.reset();
  }

  reset() {
    this.startedAtMs = null;
    this.sse = this.policy.initialSse;
    this.levelFrameTimeP95Ms = null;
    this.levelHistory = [];
    this.previousQueue = 0;
    this.queueRiseTicks = 0;
    this.queueNonzeroSinceMs = null;
    this.queueZeroSinceMs = null;
    this.requestPressureHigh = false;
    this.lastInteractionAtMs = Number.NEGATIVE_INFINITY;
    this.lastActionAtMs = Number.NEGATIVE_INFINITY;
    this.recoveryTicks = 0;
    this.state = "WARMUP";
  }

  update(sample) {
    const timestampMs = finiteNumber(sample.timestampMs, "timestampMs");
    const frameTimeP95Ms = finiteNumber(sample.frameTimeP95Ms, "frameTimeP95Ms");
    const pendingRequests = finiteNumber(sample.pendingRequests ?? 0, "pendingRequests");
    const processingTiles = finiteNumber(sample.processingTiles ?? 0, "processingTiles");
    const observedRequestQueue = sample.requestQueue === undefined
      ? Math.max(0, pendingRequests) + Math.max(0, processingTiles)
      : Math.max(0, finiteNumber(sample.requestQueue, "requestQueue"));
    const interacting = Boolean(sample.interacting);

    if (this.startedAtMs === null) this.startedAtMs = timestampMs;
    this.#updatePrediction(timestampMs, frameTimeP95Ms);
    const requestQueue = observedRequestQueue;
    this.#updateRequestPressure(timestampMs, requestQueue);
    if (interacting) this.lastInteractionAtMs = timestampMs;

    const predictedFrameTimeP95Ms = this.policy.predictionEnabled
      ? this.#predictedFrameTime(frameTimeP95Ms)
      : frameTimeP95Ms;
    const effectivePressure = this.policy.requestPressureEnabled
      ? this.requestPressureHigh
      : false;
    const effectiveInteracting = this.policy.interactionAware ? interacting : false;

    if (timestampMs - this.startedAtMs < this.policy.warmupMs) {
      this.state = "WARMUP";
      this.recoveryTicks = 0;
      return this.#decision({
        action: "HOLD",
        reason: "warmup",
        predictedFrameTimeP95Ms,
        requestQueue,
      });
    }

    const budget = this.policy.frameBudgetMs;
    const worstTail = Math.max(frameTimeP95Ms, predictedFrameTimeP95Ms);
    const canDowngrade =
      !this.policy.stabilityEnabled ||
      timestampMs - this.lastActionAtMs >= this.policy.downgradeCooldownMs;

    if (worstTail > budget && canDowngrade) {
      const critical = worstTail > budget * this.policy.criticalRatio;
      this.recoveryTicks = 0;
      this.state = "PRESSURE";
      const changed = this.#moveDown(critical ? 2 : 1);
      if (!changed) {
        return this.#decision({
          action: "HOLD",
          reason: critical ? "tail-frame-critical-sse-boundary" : "tail-frame-sse-boundary",
          predictedFrameTimeP95Ms,
          requestQueue,
        });
      }
      this.lastActionAtMs = timestampMs;
      return this.#decision({
        action: critical ? "DOWNGRADE_CRITICAL" : "DOWNGRADE_TAIL",
        reason: critical ? "tail-frame-critical" : "tail-frame-violation",
        predictedFrameTimeP95Ms,
        requestQueue,
      });
    }

    if (
      effectivePressure &&
      predictedFrameTimeP95Ms > budget * this.policy.preemptiveRatio &&
      canDowngrade
    ) {
      this.#moveDown(1);
      this.lastActionAtMs = timestampMs;
      this.recoveryTicks = 0;
      this.state = "PRESSURE";
      return this.#decision({
        action: "DOWNGRADE_PREEMPTIVE",
        reason: "predicted-tail-plus-request-pressure",
        predictedFrameTimeP95Ms,
        requestQueue,
      });
    }

    if (effectiveInteracting) {
      this.recoveryTicks = 0;
      this.state = "INTERACTING";
      return this.#decision({
        action: "HOLD",
        reason: "interaction-upgrade-hold",
        predictedFrameTimeP95Ms,
        requestQueue,
      });
    }

    const interactionReleased =
      timestampMs - this.lastInteractionAtMs >= this.policy.interactionHoldMs;
    const recoveryEligible =
      frameTimeP95Ms < budget * this.policy.recoveryRatio &&
      predictedFrameTimeP95Ms < budget * this.policy.recoveryRatio &&
      !effectivePressure &&
      interactionReleased;

    if (recoveryEligible) {
      this.recoveryTicks += 1;
      const requiredTicks = this.policy.stabilityEnabled
        ? this.policy.recoveryStableTicks
        : 1;
      const upgradeCooldown = this.policy.stabilityEnabled
        ? this.policy.upgradeCooldownMs
        : 0;
      if (
        this.recoveryTicks >= requiredTicks &&
        timestampMs - this.lastActionAtMs >= upgradeCooldown
      ) {
        const changed = this.#moveUp(1);
        this.recoveryTicks = 0;
        if (changed) {
          this.lastActionAtMs = timestampMs;
          this.state = "RECOVERY";
          return this.#decision({
            action: "UPGRADE_RECOVERY",
            reason: "stable-tail-headroom",
            predictedFrameTimeP95Ms,
            requestQueue,
          });
        }
      }
    } else {
      this.recoveryTicks = 0;
    }

    this.state = effectivePressure ? "PRESSURE" : "STABLE";
    return this.#decision({
      action: "HOLD",
      reason: effectivePressure ? "request-pressure-hold" : "deadband-or-stable",
      predictedFrameTimeP95Ms,
      requestQueue,
    });
  }

  #updatePrediction(timestampMs, frameTimeP95Ms) {
    if (this.levelFrameTimeP95Ms === null) {
      this.levelFrameTimeP95Ms = frameTimeP95Ms;
    } else {
      const alpha = this.policy.ewmaAlpha;
      this.levelFrameTimeP95Ms =
        alpha * frameTimeP95Ms + (1 - alpha) * this.levelFrameTimeP95Ms;
    }
    this.levelHistory.push({
      timeSec: timestampMs / 1000,
      value: this.levelFrameTimeP95Ms,
    });
    if (this.levelHistory.length > this.policy.trendSampleCount) {
      this.levelHistory.shift();
    }
  }

  #predictedFrameTime(currentFrameTimeP95Ms) {
    const slopeMsPerSec = linearSlope(this.levelHistory);
    const projectedLevel = (
      this.levelFrameTimeP95Ms +
      Math.max(0, slopeMsPerSec) * (this.policy.predictionHorizonMs / 1000)
    );
    return Math.max(currentFrameTimeP95Ms, projectedLevel);
  }

  #updateRequestPressure(timestampMs, requestQueue) {
    if (requestQueue > this.previousQueue) {
      this.queueRiseTicks += 1;
    } else {
      this.queueRiseTicks = 0;
    }

    if (requestQueue > 0) {
      if (this.queueNonzeroSinceMs === null) this.queueNonzeroSinceMs = timestampMs;
      this.queueZeroSinceMs = null;
      const persistent =
        timestampMs - this.queueNonzeroSinceMs >= this.policy.requestPersistenceMs;
      const impulse = requestQueue >= this.policy.requestImpulseThreshold;
      if (this.queueRiseTicks >= 2 || persistent || impulse) {
        this.requestPressureHigh = true;
      }
    } else {
      this.queueNonzeroSinceMs = null;
      if (this.queueZeroSinceMs === null) this.queueZeroSinceMs = timestampMs;
      if (timestampMs - this.queueZeroSinceMs >= this.policy.requestReleaseMs) {
        this.requestPressureHigh = false;
      }
    }
    this.previousQueue = requestQueue;
  }

  #moveDown(levels) {
    const ladder = this.policy.sseLadder;
    const currentIndex = nearestLadderIndex(ladder, this.sse);
    const nextIndex = Math.min(ladder.length - 1, currentIndex + levels);
    const changed = ladder[nextIndex] !== this.sse;
    this.sse = ladder[nextIndex];
    return changed;
  }

  #moveUp(levels) {
    const ladder = this.policy.sseLadder;
    const currentIndex = nearestLadderIndex(ladder, this.sse);
    const nextIndex = Math.max(0, currentIndex - levels);
    const changed = ladder[nextIndex] !== this.sse;
    this.sse = ladder[nextIndex];
    return changed;
  }

  #decision({ action, reason, predictedFrameTimeP95Ms, requestQueue }) {
    return Object.freeze({
      state: this.state,
      action,
      reason,
      sse: this.sse,
      levelFrameTimeP95Ms: this.levelFrameTimeP95Ms,
      predictedFrameTimeP95Ms,
      requestQueue,
      requestPressureHigh: this.policy.requestPressureEnabled
        ? this.requestPressureHigh
        : false,
    });
  }
}
