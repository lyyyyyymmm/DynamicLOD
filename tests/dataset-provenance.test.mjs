import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  buildProvenanceRecord,
  inspectDatasetReadiness,
  validateProvenanceRecord,
} from "../dataset-provenance.mjs";

const HASH = "a".repeat(64);

test("main-study provenance requires an explicit license and valid file hashes", () => {
  const result = validateProvenanceRecord({
    schemaVersion: 1,
    datasetId: "bagAmsterdam",
    sourceUrl: "https://example.test/tileset.json",
    sourceVersion: "v1",
    license: "NOASSERTION",
    accessRoute: "publicRepository",
    generatedAt: "2026-08-23T00:00:00.000Z",
    files: [{ path: "tileset.json", bytes: 12, sha256: "bad" }],
  }, { allowedForMainStudy: true });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("main-study-license-unresolved"));
  assert.ok(result.errors.includes("invalid-sha256:tileset.json"));
});

test("provenance rejects absolute and traversing file paths", () => {
  const base = {
    schemaVersion: 1,
    datasetId: "d",
    sourceUrl: "https://example.test/d",
    sourceVersion: "v1",
    license: "CC-BY-4.0",
    accessRoute: "publicRepository",
    generatedAt: "2026-08-23T00:00:00.000Z",
  };
  assert.equal(validateProvenanceRecord({ ...base, files: [{ path: "../x", bytes: 1, sha256: HASH }] }).valid, false);
  assert.equal(validateProvenanceRecord({ ...base, files: [{ path: "C:/x", bytes: 1, sha256: HASH }] }).valid, false);
});

test("dataset readiness verifies every recorded file hash", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "lod-provenance-"));
  await fs.writeFile(path.join(root, "tileset.json"), "{}", "utf8");
  const provenance = await buildProvenanceRecord(root, {
    datasetId: "testDataset",
    sourceUrl: "https://example.test/tileset.json",
    sourceVersion: "v1",
    license: "CC-BY-4.0",
    accessRoute: "publicRepository",
  });
  await fs.writeFile(path.join(root, "provenance.json"), `${JSON.stringify(provenance)}\n`, "utf8");
  assert.equal((await inspectDatasetReadiness(root, { allowedForMainStudy: true })).ready, true);
  await fs.writeFile(path.join(root, "tileset.json"), "changed", "utf8");
  const changed = await inspectDatasetReadiness(root, { allowedForMainStudy: true });
  assert.equal(changed.ready, false);
  assert.ok(changed.errors.includes("hash-mismatch:tileset.json"));
});

test("dataset readiness verifies frozen provenance identity and metadata", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "lod-provenance-id-"));
  await fs.writeFile(path.join(root, "tileset.json"), "{}", "utf8");
  const provenance = await buildProvenanceRecord(root, {
    datasetId: "frozen",
    sourceUrl: "https://example.test/frozen.json",
    sourceVersion: "v2",
    license: "CC-BY-4.0",
    accessRoute: "publicRepository",
  });
  await fs.writeFile(path.join(root, "provenance.json"), `${JSON.stringify(provenance)}\n`, "utf8");
  const result = await inspectDatasetReadiness(root, {
    allowedForMainStudy: true,
    sourceSha256: "0".repeat(64),
    version: "wrong-version",
    license: "CC-BY-4.0",
  });
  assert.equal(result.ready, false);
  assert.ok(result.errors.includes("provenance-sha256-mismatch"));
  assert.ok(result.errors.includes("source-version-mismatch"));
});
