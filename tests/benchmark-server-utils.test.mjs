import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import {
  networkDelayMs,
  parseBenchmarkAssetPath,
  resolveInside,
  sanitizeRunId,
} from "../benchmark-server-utils.mjs";

test("benchmark route extracts run, dataset and relative asset path", () => {
  assert.deepEqual(
    parseBenchmarkAssetPath("/bench-assets/run-42/delay40/publicStress/tileset.json"),
    {
      runId: "run-42",
      networkProfile: "delay40",
      dataset: "publicStress",
      relativePath: "tileset.json",
    },
  );
});

test("legacy benchmark route defaults to the LAN profile", () => {
  assert.deepEqual(
    parseBenchmarkAssetPath("/bench-assets/run-42/publicStress/tileset.json"),
    {
      runId: "run-42",
      networkProfile: "lan",
      dataset: "publicStress",
      relativePath: "tileset.json",
    },
  );
});

test("artificial delay is restricted to calibration and diagnostic datasets", () => {
  assert.equal(networkDelayMs("lan", { studyRole: "main" }), 0);
  assert.equal(networkDelayMs("delay40", { studyRole: "diagnostic" }), 40);
  assert.equal(networkDelayMs("delay80", { studyRole: "calibration" }), 80);
  assert.throws(
    () => networkDelayMs("delay40", { studyRole: "main" }),
    /only allowed for calibration or diagnostic datasets/,
  );
  assert.throws(() => networkDelayMs("unknown", { studyRole: "diagnostic" }), /Unknown network profile/);
});

test("path resolver rejects traversal outside an allowlisted root", () => {
  const root = path.resolve("C:/benchmark/assets");
  assert.throws(() => resolveInside(root, "../secret.txt"), /outside allowed root/);
  assert.equal(resolveInside(root, "tiles/0.b3dm"), path.join(root, "tiles", "0.b3dm"));
});

test("result file run IDs are strictly sanitized", () => {
  assert.equal(sanitizeRunId("pc-dragon-01"), "pc-dragon-01");
  assert.throws(() => sanitizeRunId("../escape"), /Invalid runId/);
});
