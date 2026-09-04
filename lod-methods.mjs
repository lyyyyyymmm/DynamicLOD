import { LodController } from "./lod-controller.mjs";
import { controllerOverridesForMethod } from "./experiment-config.mjs";

const SSE_LADDER = [4, 6, 8, 12, 16, 24, 32, 48, 64];

export const PI_BASELINE_POLICY = Object.freeze({
  parameterStatus: "frozen",
  frameBudgetMs: 1000 / 30,
  warmupMs: 10000,
  controlIntervalMs: 500,
  kp: 0.4,
  ki: 0.05,
  integralLimitMsSec: 60,
  initialSse: 16,
  maxLevelsPerAction: 2,
  sseLadder: Object.freeze([...SSE_LADDER]),
});

function decision(state, action, reason, sse, sample) {
  return Object.freeze({
    state,
    action,
    reason,
    sse,
    levelFrameTimeP95Ms: sample.frameTimeP95Ms,
    predictedFrameTimeP95Ms: sample.frameTimeP95Ms,
    requestQueue:
      Math.max(0, sample.pendingRequests ?? 0) +
      Math.max(0, sample.processingTiles ?? 0),
    requestPressureHigh: false,
  });
}

class FixedController {
  constructor(sse) {
    this.sse = sse;
  }

  update(sample) {
    return decision("STABLE", "HOLD", "fixed-baseline", this.sse, sample);
  }
}

class ReactiveController {
  constructor(options = {}) {
    this.policy = {
      frameBudgetMs: 1000 / 30,
      warmupMs: 10000,
      dwellMs: 800,
      cooldownMs: 1500,
      postInteractionHoldMs: 500,
      upgradeMarginMs: 4,
      ...options,
    };
    this.sse = 16;
    this.startedAtMs = null;
    this.highSinceMs = null;
    this.lowSinceMs = null;
    this.lastActionAtMs = Number.NEGATIVE_INFINITY;
    this.lastInteractionAtMs = Number.NEGATIVE_INFINITY;
  }

  update(sample) {
    const timestampMs = Number(sample.timestampMs);
    const p95 = Number(sample.frameTimeP95Ms);
    if (this.startedAtMs === null) this.startedAtMs = timestampMs;
    if (sample.interacting) this.lastInteractionAtMs = timestampMs;
    if (timestampMs - this.startedAtMs < this.policy.warmupMs) {
      return decision("WARMUP", "HOLD", "warmup", this.sse, sample);
    }
    if (sample.interacting) {
      this.highSinceMs = null;
      this.lowSinceMs = null;
      return decision("INTERACTING", "HOLD", "reactive-interaction-freeze", this.sse, sample);
    }

    const cooldownReady = timestampMs - this.lastActionAtMs >= this.policy.cooldownMs;
    if (p95 > this.policy.frameBudgetMs) {
      if (this.highSinceMs === null) this.highSinceMs = timestampMs;
      this.lowSinceMs = null;
      if (timestampMs - this.highSinceMs >= this.policy.dwellMs && cooldownReady) {
        const index = SSE_LADDER.indexOf(this.sse);
        this.sse = SSE_LADDER[Math.min(SSE_LADDER.length - 1, index + 1)];
        this.lastActionAtMs = timestampMs;
        this.highSinceMs = null;
        return decision("PRESSURE", "DOWNGRADE_REACTIVE", "current-p95-dwell", this.sse, sample);
      }
      return decision("PRESSURE", "HOLD", "reactive-downgrade-dwell", this.sse, sample);
    }

    const interactionReleased =
      timestampMs - this.lastInteractionAtMs >= this.policy.postInteractionHoldMs;
    if (p95 < this.policy.frameBudgetMs - this.policy.upgradeMarginMs && interactionReleased) {
      if (this.lowSinceMs === null) this.lowSinceMs = timestampMs;
      this.highSinceMs = null;
      if (timestampMs - this.lowSinceMs >= this.policy.dwellMs && cooldownReady) {
        const index = SSE_LADDER.indexOf(this.sse);
        this.sse = SSE_LADDER[Math.max(0, index - 1)];
        this.lastActionAtMs = timestampMs;
        this.lowSinceMs = null;
        return decision("RECOVERY", "UPGRADE_REACTIVE", "current-p95-headroom", this.sse, sample);
      }
    } else {
      this.highSinceMs = null;
      this.lowSinceMs = null;
    }
    return decision("STABLE", "HOLD", "reactive-deadband", this.sse, sample);
  }
}

export class DiscretePiController {
  constructor(options = {}) {
    this.policy = {
      ...PI_BASELINE_POLICY,
      ...options,
      sseLadder: [...(options.sseLadder ?? PI_BASELINE_POLICY.sseLadder)],
    };
    this.reset();
  }

  reset() {
    this.sse = this.policy.initialSse;
    this.startedAtMs = null;
    this.previousTimestampMs = null;
    this.lastControlAtMs = Number.NEGATIVE_INFINITY;
    this.integralErrorMsSec = 0;
  }

  update(sample) {
    const timestampMs = Number(sample.timestampMs);
    const p95 = Number(sample.frameTimeP95Ms);
    if (!Number.isFinite(timestampMs) || !Number.isFinite(p95)) {
      throw new TypeError("PI sample timestampMs and frameTimeP95Ms must be finite");
    }
    if (this.startedAtMs === null) this.startedAtMs = timestampMs;
    const deltaSec = this.previousTimestampMs === null
      ? 0
      : Math.max(0, timestampMs - this.previousTimestampMs) / 1000;
    this.previousTimestampMs = timestampMs;
    const error = p95 - this.policy.frameBudgetMs;
    const limit = Math.max(0, this.policy.integralLimitMsSec);
    this.integralErrorMsSec = Math.max(
      -limit,
      Math.min(limit, this.integralErrorMsSec + error * deltaSec),
    );

    if (timestampMs - this.startedAtMs < this.policy.warmupMs) {
      return decision("WARMUP", "HOLD", "warmup", this.sse, sample);
    }
    if (timestampMs - this.lastControlAtMs < this.policy.controlIntervalMs) {
      return decision("STABLE", "HOLD", "pi-control-interval", this.sse, sample);
    }

    this.lastControlAtMs = timestampMs;
    const rawLevels = Math.round(
      this.policy.kp * error + this.policy.ki * this.integralErrorMsSec,
    );
    const levels = Math.max(
      -this.policy.maxLevelsPerAction,
      Math.min(this.policy.maxLevelsPerAction, rawLevels),
    );
    if (levels === 0) {
      return decision("STABLE", "HOLD", "pi-deadband", this.sse, sample);
    }

    const ladder = this.policy.sseLadder;
    const currentIndex = Math.max(0, ladder.indexOf(this.sse));
    const nextIndex = Math.max(0, Math.min(ladder.length - 1, currentIndex + levels));
    const nextSse = ladder[nextIndex];
    if (nextSse === this.sse) {
      return decision("STABLE", "HOLD", "pi-sse-boundary", this.sse, sample);
    }
    this.sse = nextSse;
    return decision(
      levels > 0 ? "PRESSURE" : "RECOVERY",
      levels > 0 ? "DOWNGRADE_PI" : "UPGRADE_PI",
      "pi-tail-error",
      this.sse,
      sample,
    );
  }
}

export function createMethodController(method, overrides = {}) {
  if (method === "fixed8") return new FixedController(8);
  if (method === "fixed16" || method === "cesiumDynamic") return new FixedController(16);
  if (method === "fixedDiagnostic") return new FixedController(Number(overrides.fixedSse ?? 4));
  if (method === "reactive") return new ReactiveController(overrides);
  if (method === "pi") return new DiscretePiController(overrides);
  return new LodController({
    ...controllerOverridesForMethod(method),
    ...overrides,
  });
}

export function tilesetOptionsForMethod(method) {
  return {
    maximumScreenSpaceError: method === "fixed8" ? 8 : method === "fixedDiagnostic" ? 4 : 16,
    dynamicScreenSpaceError: method === "cesiumDynamic",
  };
}
