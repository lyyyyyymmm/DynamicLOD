import test from "node:test";
import assert from "node:assert/strict";

import {
  TilesetTelemetry,
  summarizeResourceEntries,
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
