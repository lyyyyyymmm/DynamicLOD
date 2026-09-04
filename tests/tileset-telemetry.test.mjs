import test from "node:test";
import assert from "node:assert/strict";

import {
  TilesetTelemetry,
  summarizeResourceEntries,
  summarizeResourceCompletionBins,
  summarizeStreamingTemporalStructure,
} from "../tileset-telemetry.mjs";

test("tileset telemetry records public load and visibility events", () => {
  const telemetry = new TilesetTelemetry();
  telemetry.recordLoadProgress(5, 2, 100);
  telemetry.recordTileLoad({ geometricError: 16 }, 120);
  telemetry.recordTileVisible({ geometricError: 16 });
  telemetry.recordTileVisible({ geometricError: 8 });

  const snapshot = telemetry.snapshotInterval(500);
  assert.equal(snapshot.pendingRequests, 5);
  assert.equal(snapshot.processingTiles, 2);
  assert.equal(snapshot.tilesLoadedTotal, 1);
  assert.equal(snapshot.visibleTileEvents, 2);
  assert.equal(snapshot.visibleGeometricErrorMean, 12);
  assert.equal(snapshot.visibleGeometricErrorMax, 16);
  assert.deepEqual(telemetry.tileLoadEvents, [{ timestampMs: 120, geometricError: 16 }]);
  assert.equal(telemetry.loadProgressEvents[0].requestQueue, 7);
});

test("tileset telemetry preserves a transient load-progress peak until the next control snapshot", () => {
  const telemetry = new TilesetTelemetry();
  telemetry.recordLoadProgress(12, 5, 100);
  telemetry.recordLoadProgress(0, 0, 200);

  const snapshot = telemetry.snapshotInterval(500);
  assert.equal(snapshot.requestQueue, 17);
  assert.equal(snapshot.requestQueueEnd, 0);
  assert.equal(snapshot.loadProgressEventsInterval, 2);
  assert.equal(telemetry.snapshotInterval(1000).requestQueue, 0);
});

test("resource completion bins expose temporal arrival peaks", () => {
  const summary = summarizeResourceCompletionBins(
    [
      {
        name: "http://x/bench-assets/r/d/a.b3dm",
        startTime: 0,
        responseEnd: 110,
        transferSize: 100,
        encodedBodySize: 80,
      },
      {
        name: "http://x/bench-assets/r/d/b.b3dm",
        startTime: 0,
        responseEnd: 170,
        transferSize: 200,
        encodedBodySize: 150,
      },
      {
        name: "http://x/Build/Cesium.js",
        startTime: 0,
        responseEnd: 120,
        transferSize: 999,
        encodedBodySize: 999,
      },
    ],
    "/bench-assets/r/",
    100,
  );
  assert.equal(summary.binMs, 100);
  assert.equal(summary.bins.length, 1);
  assert.equal(summary.bins[0].eventCount, 2);
  assert.equal(summary.bins[0].transferBytes, 300);
});

test("streaming temporal structure reports resource, tile and load-progress peaks", () => {
  const summary = summarizeStreamingTemporalStructure({
    resourceEntries: [
      {
        name: "http://x/bench-assets/r/d/a.b3dm",
        startTime: 0,
        responseEnd: 110,
        transferSize: 100,
        encodedBodySize: 80,
      },
      {
        name: "http://x/bench-assets/r/d/b.b3dm",
        startTime: 0,
        responseEnd: 170,
        transferSize: 200,
        encodedBodySize: 150,
      },
    ],
    pathPrefix: "/bench-assets/r/",
    tileLoadEvents: [{ timestampMs: 10 }, { timestampMs: 40 }, { timestampMs: 160 }],
    loadProgressEvents: [
      { timestampMs: 20, requestQueue: 3 },
      { timestampMs: 50, requestQueue: 8 },
      { timestampMs: 180, requestQueue: 4 },
    ],
    binSizesMs: [100],
  });
  assert.equal(summary.metrics.resourceCompletionPeak100Ms, 2);
  assert.equal(summary.metrics.resourceCompletionTransferBytesPeak100Ms, 300);
  assert.equal(summary.metrics.tileLoadPeak100Ms, 2);
  assert.equal(summary.metrics.loadProgressEventPeak100Ms, 2);
  assert.equal(summary.metrics.loadProgressQueuePeak100Ms, 8);
  assert.equal(summary.summaries.tileLoadBins100Ms.bins.length, 2);
});

test("first stable display requires loaded content and one second of empty queue", () => {
  const telemetry = new TilesetTelemetry();
  telemetry.recordTileLoad({ geometricError: 0 }, 100);
  telemetry.recordLoadProgress(0, 0, 200);
  assert.equal(telemetry.updateFirstStableDisplay(1000), null);
  assert.equal(telemetry.updateFirstStableDisplay(1200), 1200);
});

test("resource summary ignores unrelated entries and never emits NaN", () => {
  const summary = summarizeResourceEntries(
    [
      { name: "http://x/bench-assets/r/d/a.b3dm", transferSize: 100, encodedBodySize: 80 },
      { name: "http://x/Build/Cesium.js", transferSize: 999, encodedBodySize: 999 },
      { name: "http://x/bench-assets/r/d/b.b3dm", transferSize: 0, encodedBodySize: 50 },
    ],
    "/bench-assets/r/",
  );
  assert.deepEqual(summary, {
    resourceCount: 2,
    transferBytes: 100,
    encodedBodyBytes: 130,
  });
});
