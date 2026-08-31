import test from "node:test";
import assert from "node:assert/strict";

import {
  FrameReadinessGate,
  isControlWindowReady,
  readinessInvalidReasons,
  retryCondition,
  runFrameReadinessCheck,
  unavailableDatasets,
} from "../benchmark-run-utils.mjs";

test("an invalid condition is retried at most twice", () => {
  const condition = { dataset: "d", method: "m" };
  const first = retryCondition(condition, { valid: false });
  const second = retryCondition(first, { valid: false });
  assert.equal(first.retryAttempt, 1);
  assert.equal(second.retryAttempt, 2);
  assert.equal(retryCondition(second, { valid: false }), null);
  assert.equal(retryCondition(condition, { valid: true }), null);
});

test("dataset readiness reports only required unavailable datasets", () => {
  const queue = [{ dataset: "ready" }, { dataset: "missing" }, { dataset: "missing" }];
  const statuses = { ready: { ready: true }, missing: { ready: false }, unused: { ready: false } };
  assert.deepEqual(unavailableDatasets(queue, statuses), ["missing"]);
});

test("control sampling waits for a full rolling frame-time window", () => {
  assert.equal(
    isControlWindowReady({
      elapsedMs: 500,
      lastControlMs: 0,
      windowMs: 2000,
      controlIntervalMs: 500,
    }),
    false,
  );
  assert.equal(
    isControlWindowReady({
      elapsedMs: 1999,
      lastControlMs: 1500,
      windowMs: 2000,
      controlIntervalMs: 500,
    }),
    false,
  );
  assert.equal(
    isControlWindowReady({
      elapsedMs: 2000,
      lastControlMs: 1500,
      windowMs: 2000,
      controlIntervalMs: 500,
    }),
    true,
  );
  assert.equal(
    isControlWindowReady({
      elapsedMs: 2200,
      lastControlMs: 2000,
      windowMs: 2000,
      controlIntervalMs: 500,
    }),
    false,
  );
});

test("frame readiness requires two consecutive P95 windows below threshold", () => {
  const gate = new FrameReadinessGate({
    p95ThresholdMs: 25,
    requiredStableWindows: 2,
    timeoutMs: 60000,
  });

  assert.deepEqual(gate.observe({ p95Ms: 16.8, elapsedMs: 2000 }), {
    ready: false,
    timedOut: false,
    stableWindows: 1,
  });
  assert.deepEqual(gate.observe({ p95Ms: 17.1, elapsedMs: 4000 }), {
    ready: true,
    timedOut: false,
    stableWindows: 2,
  });
});

test("frame readiness resets its stable streak after an over-threshold window", () => {
  const gate = new FrameReadinessGate({
    p95ThresholdMs: 25,
    requiredStableWindows: 2,
    timeoutMs: 60000,
  });

  gate.observe({ p95Ms: 16.8, elapsedMs: 2000 });
  assert.equal(gate.observe({ p95Ms: 33.4, elapsedMs: 4000 }).stableWindows, 0);
  assert.equal(gate.observe({ p95Ms: 16.9, elapsedMs: 6000 }).ready, false);
  assert.equal(gate.observe({ p95Ms: 16.9, elapsedMs: 8000 }).ready, true);
});

test("frame readiness times out and produces an auditable invalid reason", () => {
  const gate = new FrameReadinessGate({
    p95ThresholdMs: 25,
    requiredStableWindows: 2,
    timeoutMs: 60000,
  });

  const result = gate.observe({ p95Ms: 33.4, elapsedMs: 60000 });
  assert.deepEqual(result, { ready: false, timedOut: true, stableWindows: 0 });
  assert.deepEqual(readinessInvalidReasons(result), ["pre-run-frame-instability"]);
  assert.deepEqual(readinessInvalidReasons({ ready: true, timedOut: false }), []);
});

test("frame readiness check returns an auditable trace after two stable windows", async () => {
  const observations = [
    { p95Ms: 16.8, durationMs: 2000, sampleCount: 120 },
    { p95Ms: 17.1, durationMs: 2000, sampleCount: 119 },
  ];
  const result = await runFrameReadinessCheck({
    policy: {
      windowMs: 2000,
      p95ThresholdMs: 25,
      requiredStableWindows: 2,
      timeoutMs: 60000,
    },
    measureWindow: async () => observations.shift(),
  });

  assert.equal(result.ready, true);
  assert.equal(result.timedOut, false);
  assert.equal(result.waitMs, 4000);
  assert.equal(result.p95Ms, 17.1);
  assert.equal(result.checkCount, 2);
  assert.deepEqual(result.policy, {
    windowMs: 2000,
    p95ThresholdMs: 25,
    requiredStableWindows: 2,
    timeoutMs: 60000,
  });
  assert.deepEqual(result.windows.map((window) => window.stableWindows), [1, 2]);
});

test("frame readiness check stops at timeout and preserves every failed window", async () => {
  let calls = 0;
  const result = await runFrameReadinessCheck({
    policy: {
      windowMs: 2000,
      p95ThresholdMs: 25,
      requiredStableWindows: 2,
      timeoutMs: 60000,
    },
    measureWindow: async () => {
      calls += 1;
      return { p95Ms: 33.4, durationMs: 2000, sampleCount: 60 };
    },
  });

  assert.equal(result.ready, false);
  assert.equal(result.timedOut, true);
  assert.equal(result.waitMs, 60000);
  assert.equal(result.checkCount, 30);
  assert.equal(result.windows.length, 30);
  assert.equal(calls, 30);
});
