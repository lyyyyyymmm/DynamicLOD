import test from "node:test";
import assert from "node:assert/strict";

import {
  PI_BASELINE_POLICY,
  createMethodController,
  tilesetOptionsForMethod,
} from "../lod-methods.mjs";

const high = (timestampMs) => ({
  timestampMs,
  frameTimeP95Ms: 36,
  pendingRequests: 0,
  processingTiles: 0,
  interacting: false,
});

test("fixed baselines never change SSE", () => {
  const fixed8 = createMethodController("fixed8", { warmupMs: 0 });
  assert.equal(fixed8.update(high(0)).sse, 8);
  assert.equal(fixed8.update(high(5000)).sse, 8);
});

test("reactive baseline waits for dwell before degrading one ladder step", () => {
  const reactive = createMethodController("reactive", { warmupMs: 0 });
  assert.equal(reactive.update(high(0)).sse, 16);
  const decision = reactive.update(high(1000));
  assert.equal(decision.sse, 24);
  assert.equal(decision.action, "DOWNGRADE_REACTIVE");
});

test("PI baseline uses only tail-frame error and caps one action at two levels", () => {
  assert.equal(PI_BASELINE_POLICY.parameterStatus, "frozen");
  assert.equal(PI_BASELINE_POLICY.kp, 0.4);
  assert.equal(PI_BASELINE_POLICY.ki, 0.05);
  const pi = createMethodController("pi", {
    warmupMs: 0,
    controlIntervalMs: 500,
    kp: 1,
    ki: 0,
  });
  const decision = pi.update({
    timestampMs: 0,
    frameTimeP95Ms: 45,
    pendingRequests: 999,
    processingTiles: 999,
    interacting: true,
  });
  assert.equal(decision.sse, 32);
  assert.equal(decision.action, "DOWNGRADE_PI");
  assert.equal(decision.predictedFrameTimeP95Ms, 45);
  assert.equal(decision.requestPressureHigh, false);
});

test("PI baseline upgrades for sustained headroom and respects SSE bounds", () => {
  const pi = createMethodController("pi", {
    warmupMs: 0,
    controlIntervalMs: 500,
    kp: 1,
    ki: 0,
    initialSse: 6,
  });
  assert.equal(pi.update({ ...high(0), frameTimeP95Ms: 10 }).sse, 4);
  assert.equal(pi.update({ ...high(500), frameTimeP95Ms: 10 }).sse, 4);
});

test("PI baseline clamps integral accumulation and resets deterministically", () => {
  const options = {
    warmupMs: 0,
    controlIntervalMs: 500,
    kp: 0,
    ki: 1,
    integralLimitMsSec: 2,
  };
  const pi = createMethodController("pi", options);
  pi.update({ ...high(0), frameTimeP95Ms: 34 });
  pi.update({ ...high(5000), frameTimeP95Ms: 34 });
  assert.equal(pi.integralErrorMsSec, 2);
  pi.reset();
  assert.equal(pi.integralErrorMsSec, 0);
  assert.equal(pi.sse, 16);
});

test("Cesium dynamic baseline enables only Cesium built-in dynamic SSE", () => {
  assert.deepEqual(tilesetOptionsForMethod("cesiumDynamic"), {
    maximumScreenSpaceError: 16,
    dynamicScreenSpaceError: true,
  });
  assert.equal(tilesetOptionsForMethod("proposed").dynamicScreenSpaceError, false);
});

test("ablation identifiers disable exactly one proposed component", () => {
  assert.equal(createMethodController("noPrediction").policy.predictionEnabled, false);
  assert.equal(createMethodController("noRequest").policy.requestPressureEnabled, false);
  assert.equal(createMethodController("noInteraction").policy.interactionAware, false);
  assert.equal(createMethodController("noStability").policy.stabilityEnabled, false);
});
