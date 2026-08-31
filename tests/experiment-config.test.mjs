import test from "node:test";
import assert from "node:assert/strict";

import {
  DATASETS,
  FROZEN_PROTOCOL,
  buildAblationQueue,
  buildD1S2PressureProbeQueue,
  buildD1S2PilotQueue,
  buildMainExperimentQueue,
  buildPiCalibrationQueue,
  buildScenarioTimeline,
  createRunManifest,
  seededShuffle,
} from "../experiment-config.mjs";

test("burst scenario contains four interaction and four recovery phases", () => {
  const timeline = buildScenarioTimeline("burst");
  assert.equal(timeline.filter((phase) => phase.interacting).length, 4);
  assert.equal(timeline.filter((phase) => !phase.interacting).length, 4);
  assert.equal(timeline[0].endMs - timeline[0].startMs, 6000);
  assert.equal(timeline[1].endMs - timeline[1].startMs, 4000);
  assert.equal(timeline.at(-1).endMs, 40000);
});

test("seeded shuffle is deterministic", () => {
  const input = ["fixed8", "fixed16", "cesiumDynamic", "reactive", "pi", "proposed"];
  assert.deepEqual(seededShuffle(input, 20260823), seededShuffle(input, 20260823));
  assert.notDeepEqual(seededShuffle(input, 20260823), seededShuffle(input, 20260824));
});

test("manifest records protocol v2 provenance, device and network fields", () => {
  const manifest = createRunManifest({
    method: "proposed",
    dataset: "dragon",
    scenario: "steady",
    repeat: 2,
    seed: 42,
    runId: "run-42",
    userAgent: "test-agent",
    deviceId: "pc-a",
    networkProfile: "lan",
    browserVersion: "Chrome 140",
    gpuRenderer: "Test GPU",
    studyPhase: "pilot",
  });

  assert.equal(manifest.schemaVersion, 2);
  assert.equal(manifest.protocolVersion, "2.3.5");
  assert.equal(manifest.renderWidth, 960);
  assert.equal(manifest.renderHeight, 540);
  assert.equal(manifest.warmupMs, 10000);
  assert.equal(manifest.measurementMs, 40000);
  assert.equal(manifest.initialContentTimeoutMs, 60000);
  assert.equal(manifest.readinessWindowMs, 2000);
  assert.equal(manifest.readinessRequiredStableWindows, 2);
  assert.equal(manifest.readinessP95ThresholdMs, 25);
  assert.equal(manifest.readinessTimeoutMs, 60000);
  assert.equal(manifest.drawingBufferTolerancePx, 1);
  assert.equal(manifest.deviceId, "pc-a");
  assert.equal(manifest.networkProfile, "lan");
  assert.equal(manifest.browserVersion, "Chrome 140");
  assert.equal(manifest.gpuRenderer, "Test GPU");
  assert.equal(manifest.studyPhase, "pilot");
  assert.equal(manifest.pilotPurpose, "none");
  assert.equal(manifest.datasetVersion, DATASETS.dragon.version);
  assert.equal(manifest.sourceLicense, DATASETS.dragon.license);
  assert.throws(
    () => createRunManifest({ ...manifest, method: "unknown" }),
    /Unknown method/,
  );
});

test("protocol v2 separates calibration, main and restricted datasets", () => {
  assert.deepEqual(FROZEN_PROTOCOL.methods, [
    "fixed8", "fixed16", "cesiumDynamic", "reactive", "pi", "proposed",
  ]);
  assert.equal(DATASETS.dragon.studyRole, "calibration");
  assert.equal(DATASETS.publicStress.studyRole, "diagnostic");
  assert.equal(DATASETS.bagAmsterdam.studyRole, "main");
  assert.equal(DATASETS.bagRotterdam.studyRole, "externalValidation");
  assert.equal(DATASETS.helsinkiKalasatama.allowedForMainStudy, false);
  assert.equal(DATASETS.taipei101.accessRoute, "thirdPartyRestricted");
  assert.equal(DATASETS.taipei101.allowedForMainStudy, false);
});

test("protocol waits up to one minute for first content before warmup", () => {
  assert.equal(FROZEN_PROTOCOL.initialContentTimeoutMs, 60000);
  assert.equal(FROZEN_PROTOCOL.windowMs, 2000);
  assert.equal(FROZEN_PROTOCOL.controlIntervalMs, 500);
  assert.equal(FROZEN_PROTOCOL.drawingBufferTolerancePx, 1);
});

test("main queue schedules 216 confirmatory runs per device", () => {
  const queue = buildMainExperimentQueue();
  assert.equal(queue.length, 216);
  assert.equal(queue.filter((run) => run.dataset === "bagAmsterdam" && run.scenario === "burst").length, 72);
  assert.ok(queue.every((run) => ["bagAmsterdam", "bagRotterdam"].includes(run.dataset)));
});

test("ablation queue contains four variants on D1 burst", () => {
  const queue = buildAblationQueue();
  assert.equal(queue.length, 32);
  assert.ok(queue.every((run) => run.dataset === "bagAmsterdam"));
  assert.ok(queue.every((run) => run.scenario === "burst"));
  assert.ok(queue.every((run) => run.method.startsWith("no")));
});

test("D1/S2 pilot queue schedules four paired six-method blocks outside confirmation", () => {
  const queue = buildD1S2PilotQueue();
  assert.equal(queue.length, 24);
  assert.ok(queue.every((run) => run.dataset === "bagAmsterdam"));
  assert.ok(queue.every((run) => run.scenario === "burst"));
  assert.ok(queue.every((run) => run.networkProfile === "lan"));
  assert.ok(queue.every((run) => run.studyPhase === "pilot"));
  for (let repeat = 1; repeat <= 4; repeat += 1) {
    assert.deepEqual(
      queue.filter((run) => run.repeat === repeat).map((run) => run.method).sort(),
      [...FROZEN_PROTOCOL.methods].sort(),
    );
  }
});

test("D1/S2 pressure probe schedules one auditable six-method pilot block", () => {
  const queue = buildD1S2PressureProbeQueue();
  assert.equal(queue.length, 6);
  assert.ok(queue.every((run) => run.dataset === "bagAmsterdam"));
  assert.ok(queue.every((run) => run.scenario === "burst"));
  assert.ok(queue.every((run) => run.studyPhase === "pilot"));
  assert.ok(queue.every((run) => run.pilotPurpose === "request-peak-probe"));
  assert.deepEqual(queue.map((run) => run.method).sort(), [...FROZEN_PROTOCOL.methods].sort());
});

test("PI calibration queue covers the frozen 4 by 4 gain grid", () => {
  const queue = buildPiCalibrationQueue({ repeats: 4 });
  assert.equal(queue.length, 64);
  assert.ok(queue.every((run) => run.dataset === "publicStress"));
  assert.ok(queue.every((run) => run.scenario === "burst"));
  assert.ok(queue.every((run) => run.method === "pi"));
  assert.deepEqual(
    [...new Set(queue.map((run) => run.methodParameters.kp))],
    [0.05, 0.1, 0.2, 0.4],
  );
  assert.deepEqual(
    [...new Set(queue.map((run) => run.methodParameters.ki))],
    [0.01, 0.02, 0.05, 0.1],
  );
});
