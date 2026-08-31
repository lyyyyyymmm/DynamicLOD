import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_LOD_POLICY,
  LodController,
} from "../lod-controller.mjs";

function sample(timestampMs, frameTimeP95Ms, options = {}) {
  return {
    timestampMs,
    frameTimeP95Ms,
    pendingRequests: options.pendingRequests ?? 0,
    processingTiles: options.processingTiles ?? 0,
    requestQueue: options.requestQueue,
    interacting: options.interacting ?? false,
  };
}

test("predictor projects a rising P95 trend one second ahead", () => {
  const controller = new LodController({ warmupMs: 0 });

  let decision;
  for (const [index, p95] of [18, 20, 23, 26].entries()) {
    decision = controller.update(sample(index * 500, p95));
  }

  assert.ok(decision.predictedFrameTimeP95Ms > decision.levelFrameTimeP95Ms);
  assert.ok(decision.predictedFrameTimeP95Ms > 25);
});

test("forecast never lags below the current P95 during a sudden rise", () => {
  const controller = new LodController({ warmupMs: 0, initialSse: 16 });

  controller.update(sample(0, 17, { requestQueue: 1 }));
  controller.update(sample(500, 17, { requestQueue: 2 }));
  const decision = controller.update(sample(1000, 32, { requestQueue: 3 }));

  assert.equal(decision.requestPressureHigh, true);
  assert.ok(decision.predictedFrameTimeP95Ms >= 32);
  assert.equal(decision.action, "DOWNGRADE_PREEMPTIVE");
  assert.equal(decision.reason, "predicted-tail-plus-request-pressure");
});

test("an emergency tail-frame violation drops two SSE ladder levels", () => {
  const controller = new LodController({ warmupMs: 0, initialSse: 16 });

  const decision = controller.update(sample(0, 41));

  assert.equal(decision.sse, 32);
  assert.equal(decision.action, "DOWNGRADE_CRITICAL");
  assert.equal(decision.state, "PRESSURE");
  assert.equal(decision.reason, "tail-frame-critical");
});

test("tail violations at the coarsest SSE are reported as boundary holds", () => {
  const controller = new LodController({ warmupMs: 0, initialSse: 64 });

  const decision = controller.update(sample(0, 66));

  assert.equal(decision.sse, 64);
  assert.equal(decision.action, "HOLD");
  assert.equal(decision.state, "PRESSURE");
  assert.equal(decision.reason, "tail-frame-critical-sse-boundary");
});

test("rising request pressure triggers a preemptive downgrade near the budget", () => {
  const controller = new LodController({ warmupMs: 0, initialSse: 16 });

  controller.update(sample(0, 30.2, { pendingRequests: 1 }));
  const decision = controller.update(
    sample(500, 30.2, { pendingRequests: 2 }),
  );

  assert.equal(decision.requestPressureHigh, true);
  assert.equal(decision.sse, 24);
  assert.equal(decision.action, "DOWNGRADE_PREEMPTIVE");
  assert.equal(decision.reason, "predicted-tail-plus-request-pressure");
});

test("request-pressure control uses the control-interval queue peak after a transient request settles", () => {
  const controller = new LodController({ warmupMs: 0, initialSse: 16 });

  controller.update(sample(0, 30.2, { requestQueue: 1 }));
  const decision = controller.update(sample(500, 30.2, { requestQueue: 2 }));

  assert.equal(decision.requestQueue, 2);
  assert.equal(decision.requestPressureHigh, true);
  assert.equal(decision.action, "DOWNGRADE_PREEMPTIVE");
});

test("a large request-pressure impulse near the tail budget triggers a preemptive downgrade", () => {
  const controller = new LodController({ warmupMs: 0, initialSse: 6 });

  const decision = controller.update(sample(0, 33.14, { requestQueue: 29 }));

  assert.equal(decision.requestPressureHigh, true);
  assert.equal(decision.sse, 8);
  assert.equal(decision.action, "DOWNGRADE_PREEMPTIVE");
  assert.equal(decision.reason, "predicted-tail-plus-request-pressure");
});

test("interaction blocks recovery upgrades but still allows emergency downgrade", () => {
  const controller = new LodController({ warmupMs: 0, initialSse: 24 });

  for (let index = 0; index < 6; index += 1) {
    const decision = controller.update(
      sample(index * 500, 18, { interacting: true }),
    );
    assert.equal(decision.sse, 24);
    assert.equal(decision.state, "INTERACTING");
  }

  const emergency = controller.update(
    sample(3000, 41, { interacting: true }),
  );
  assert.equal(emergency.sse, 48);
  assert.equal(emergency.action, "DOWNGRADE_CRITICAL");
});

test("recovery requires four stable ticks and upgrades one level", () => {
  const controller = new LodController({
    warmupMs: 0,
    initialSse: 24,
    interactionHoldMs: 0,
  });

  let decision;
  for (let index = 0; index < 3; index += 1) {
    decision = controller.update(sample(index * 500, 18));
    assert.equal(decision.sse, 24);
  }

  decision = controller.update(sample(1500, 18));
  assert.equal(decision.sse, 16);
  assert.equal(decision.action, "UPGRADE_RECOVERY");
  assert.equal(decision.state, "RECOVERY");
});

test("policy constants match the frozen experiment protocol", () => {
  assert.equal(DEFAULT_LOD_POLICY.frameBudgetMs, 1000 / 30);
  assert.equal(DEFAULT_LOD_POLICY.windowMs, 2000);
  assert.equal(DEFAULT_LOD_POLICY.controlIntervalMs, 500);
  assert.equal(DEFAULT_LOD_POLICY.requestImpulseThreshold, 24);
  assert.deepEqual(DEFAULT_LOD_POLICY.sseLadder, [4, 6, 8, 12, 16, 24, 32, 48, 64]);
});
