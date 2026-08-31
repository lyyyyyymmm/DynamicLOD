import test from "node:test";
import assert from "node:assert/strict";

import { buildControllerSample } from "../controller-sample.mjs";

test("forwards the interval request peak into the controller sample", () => {
  const sample = buildControllerSample({
    elapsed: 12500,
    frameStats: { p95Ms: 30.5 },
    tileStats: {
      pendingRequests: 0,
      processingTiles: 0,
      requestQueue: 44,
    },
    interacting: false,
  });

  assert.deepEqual(sample, {
    timestampMs: 12500,
    frameTimeP95Ms: 30.5,
    pendingRequests: 0,
    processingTiles: 0,
    requestQueue: 44,
    interacting: false,
  });
});
