import test from "node:test";
import assert from "node:assert/strict";

import {
  assertFiniteTelemetry,
  percentile,
  summarizeForecast,
  summarizeRun,
  validateRunEvidence,
} from "../lod-metrics.mjs";

test("percentile uses linear interpolation on finite values", () => {
  assert.equal(percentile([10, 20, 30, 40], 0.5), 25);
  assert.equal(percentile([10, Number.NaN, 30], 0.95), 29);
});

test("run summary uses windows as observations and reports weighted SSE", () => {
  const rows = [
    { elapsedMs: 500, frameTimeP95Ms: 20, sse: 8, requestQueue: 0 },
    { elapsedMs: 1000, frameTimeP95Ms: 40, sse: 16, requestQueue: 3 },
    { elapsedMs: 1500, frameTimeP95Ms: 35, sse: 24, requestQueue: 1 },
    { elapsedMs: 2000, frameTimeP95Ms: 25, sse: 16, requestQueue: 0 },
  ];

  const summary = summarizeRun(rows, { frameBudgetMs: 1000 / 30 });

  assert.equal(summary.validWindowCount, 4);
  assert.equal(summary.violationWindowCount, 2);
  assert.equal(summary.violationRate, 0.5);
  assert.equal(summary.timeWeightedMeanSse, 16);
  assert.equal(summary.requestQueuePeak, 3);
  assert.equal(summary.requestQueueAuc, 2000);
});

test("telemetry validation rejects NaN instead of silently exporting it", () => {
  assert.throws(
    () => assertFiniteTelemetry({ frameTimeP95Ms: Number.NaN, sse: 16 }),
    /frameTimeP95Ms/,
  );
});

test("run evidence is invalid when no tile content was loaded", () => {
  assert.deepEqual(
    validateRunEvidence({
      rowCount: 4,
      tilesLoadedTotal: 0,
      resourceCount: 1,
      tileFailureCount: 0,
      drawingBufferWidth: 960,
      drawingBufferHeight: 540,
    }),
    ["no-tile-content", "no-tile-resource-timing"],
  );
});

test("run evidence accepts one-pixel browser rounding at the fixed buffer target", () => {
  assert.deepEqual(
    validateRunEvidence({
      rowCount: 4,
      tilesLoadedTotal: 85,
      resourceCount: 86,
      tileFailureCount: 0,
      drawingBufferWidth: 959,
      drawingBufferHeight: 540,
      drawingBufferTolerancePx: 1,
    }),
    [],
  );
});

test("forecast summary compares the predictor with persistence over the next second", () => {
  const rows = [
    { elapsedMs: 0, frameTimeP95Ms: 20, predictedFrameTimeP95Ms: 35 },
    { elapsedMs: 500, frameTimeP95Ms: 25, predictedFrameTimeP95Ms: 38 },
    { elapsedMs: 1000, frameTimeP95Ms: 40, predictedFrameTimeP95Ms: 42 },
    { elapsedMs: 1500, frameTimeP95Ms: 30, predictedFrameTimeP95Ms: 30 },
  ];
  const summary = summarizeForecast(rows, { horizonMs: 1000, frameBudgetMs: 1000 / 30 });
  assert.equal(summary.forecastPairCount, 3);
  assert.ok(summary.predictionMaeMs < summary.persistenceMaeMs);
  assert.equal(summary.violationRecall, 1);
  assert.ok(summary.meanWarningLeadMs > 0);
});
