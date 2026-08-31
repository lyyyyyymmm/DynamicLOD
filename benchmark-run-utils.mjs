export class FrameReadinessGate {
  constructor({ p95ThresholdMs, requiredStableWindows, timeoutMs }) {
    this.p95ThresholdMs = Number(p95ThresholdMs);
    this.requiredStableWindows = Number(requiredStableWindows);
    this.timeoutMs = Number(timeoutMs);
    this.stableWindows = 0;
  }

  observe({ p95Ms, elapsedMs }) {
    if (Number.isFinite(p95Ms) && p95Ms <= this.p95ThresholdMs) {
      this.stableWindows += 1;
    } else {
      this.stableWindows = 0;
    }
    const ready = this.stableWindows >= this.requiredStableWindows;
    return {
      ready,
      timedOut: !ready && Number(elapsedMs) >= this.timeoutMs,
      stableWindows: this.stableWindows,
    };
  }
}

export function readinessInvalidReasons(readiness) {
  return readiness?.ready ? [] : ["pre-run-frame-instability"];
}

export function isControlWindowReady({
  elapsedMs,
  lastControlMs,
  windowMs,
  controlIntervalMs,
}) {
  return (
    Number(elapsedMs) >= Number(windowMs) &&
    Number(elapsedMs) - Number(lastControlMs) >= Number(controlIntervalMs)
  );
}

export async function runFrameReadinessCheck({ policy, measureWindow, onWindow }) {
  const gate = new FrameReadinessGate(policy);
  const windows = [];
  let elapsedMs = 0;
  while (true) {
    const observation = await measureWindow(policy.windowMs);
    const durationMs = Number.isFinite(observation?.durationMs)
      ? observation.durationMs
      : policy.windowMs;
    elapsedMs += durationMs;
    const state = gate.observe({ p95Ms: observation?.p95Ms, elapsedMs });
    const window = {
      index: windows.length + 1,
      p95Ms: observation?.p95Ms ?? null,
      durationMs,
      sampleCount: Number(observation?.sampleCount ?? 0),
      stableWindows: state.stableWindows,
      ready: state.ready,
    };
    windows.push(window);
    onWindow?.(window, state);
    if (state.ready || state.timedOut) {
      return {
        policy: { ...policy },
        ready: state.ready,
        timedOut: state.timedOut,
        waitMs: elapsedMs,
        p95Ms: window.p95Ms,
        checkCount: windows.length,
        stableWindows: state.stableWindows,
        windows,
      };
    }
  }
}

export function retryCondition(condition, result, maxRetries = 2) {
  if (result?.valid) return null;
  const retryAttempt = Number(condition.retryAttempt ?? 0);
  if (retryAttempt >= maxRetries) return null;
  return { ...condition, retryAttempt: retryAttempt + 1 };
}

export function unavailableDatasets(queue, statuses) {
  const required = [...new Set(queue.map((condition) => condition.dataset))];
  return required.filter((dataset) => statuses?.[dataset]?.ready !== true).sort();
}
