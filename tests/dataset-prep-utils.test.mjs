import test from "node:test";
import assert from "node:assert/strict";

import {
  boxCenter,
  collectContentUris,
  collectExternalTilesetNodes,
  combineBoxes,
  fetchWithRetry,
  mapConcurrent,
  selectChunkRecords,
} from "../dataset-prep-utils.mjs";

const box = (x, y, z, half = 1) => [
  x, y, z,
  half, 0, 0,
  0, half, 0,
  0, 0, half,
];

test("box center reads the ECEF center from a 3D Tiles box", () => {
  assert.deepEqual(boxCenter({ box: box(1, 2, 3) }), [1, 2, 3]);
  assert.deepEqual(boxCenter({ sphere: [4, 5, 6, 10] }), [4, 5, 6]);
});

test("content URI collection walks content, contents and children", () => {
  const uris = collectContentUris({
    content: { uri: "a.glb" },
    contents: [{ uri: "b.glb" }],
    children: [{ content: { url: "legacy.b3dm" } }],
  });
  assert.deepEqual(uris, ["a.glb", "b.glb", "legacy.b3dm"]);
});

test("external tileset discovery walks nested root hierarchy", () => {
  const nested = {
    children: [{
      boundingVolume: { box: box(1, 2, 3) },
      children: [{
        boundingVolume: { box: box(4, 5, 6) },
        content: { uri: "tileset-5-416-576.json" },
      }],
    }],
  };
  assert.deepEqual(
    collectExternalTilesetNodes(nested).map((node) => node.content.uri),
    ["tileset-5-416-576.json"],
  );
});

test("chunk selection is nearest-first with a stable URI tie break", () => {
  const selected = selectChunkRecords([
    { uri: "b.json", distance: 1, bytes: 80, contentCount: 2 },
    { uri: "a.json", distance: 1, bytes: 70, contentCount: 2 },
    { uri: "c.json", distance: 2, bytes: 90, contentCount: 2 },
  ], { targetBytes: 140, maxBytes: 250, minContents: 4 });
  assert.deepEqual(selected.map((item) => item.uri), ["a.json", "b.json"]);
});

test("combined box encloses every source box", () => {
  const combined = combineBoxes([box(0, 0, 0, 1), box(4, 2, -2, 1)]);
  assert.deepEqual(combined, [2, 1, -1, 3, 0, 0, 0, 2, 0, 0, 0, 2]);
});

test("transient fetch failures are retried before succeeding", async () => {
  let attempts = 0;
  const response = await fetchWithRetry("https://example.test/a", {}, {
    attempts: 3,
    baseDelayMs: 0,
    fetchImpl: async () => {
      attempts += 1;
      if (attempts < 2) throw new Error("connect timeout");
      return { ok: true, status: 200 };
    },
  });
  assert.equal(response.status, 200);
  assert.equal(attempts, 2);
});

test("bounded concurrent mapping preserves input order", async () => {
  let active = 0;
  let peak = 0;
  const values = await mapConcurrent([1, 2, 3, 4], 2, async (value) => {
    active += 1;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active -= 1;
    return value * 2;
  });
  assert.deepEqual(values, [2, 4, 6, 8]);
  assert.equal(peak, 2);
});
