import test from "node:test";
import assert from "node:assert/strict";

import {
  DATASETS,
  D031_CONFIRMATORY_RELEASE,
  FROZEN_PROTOCOL,
  buildAblationQueue,
  buildDesktopS3ConfirmatoryQueue,
  buildD1S2PressureProbeQueue,
  buildD1S2PilotQueue,
  buildD2S3PilotQueue,
  buildAndroidIdentifiabilityDiagnosticQueue,
  buildServerTopologyDiagnosticQueue,
  buildMainExperimentQueue,
  buildPiCalibrationQueue,
  buildScenarioTimeline,
  createRunManifest,
  isLocalPageOrigin,
  seededShuffle,
  validateDesktopS3ConfirmatoryQueue,
} from "../experiment-config.mjs";

test("burst scenario contains four interaction and four recovery phases", () => {
  const timeline = buildScenarioTimeline("burst");
  assert.equal(timeline.filter((phase) => phase.interacting).length, 4);
  assert.equal(timeline.filter((phase) => !phase.interacting).length, 4);
  assert.equal(timeline[0].endMs - timeline[0].startMs, 6000);
  assert.equal(timeline[1].endMs - timeline[1].startMs, 4000);
  assert.equal(timeline.at(-1).endMs, 40000);
});

test("pressure burst scenario lengthens the near-view recovery workload", () => {
  const timeline = buildScenarioTimeline("pressureBurst");
  assert.equal(timeline.filter((phase) => phase.interacting).length, 4);
  assert.equal(timeline.filter((phase) => !phase.interacting).length, 4);
  assert.equal(timeline[0].endMs - timeline[0].startMs, 4000);
  assert.equal(timeline[1].endMs - timeline[1].startMs, 6000);
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
    serverTopology: "local",
    pageOrigin: "http://localhost:8088",
    pageHost: "localhost:8088",
  });

  assert.equal(manifest.schemaVersion, 2);
  assert.equal(manifest.protocolVersion, "2.3.6");
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
  assert.equal(manifest.serverTopology, "local");
  assert.equal(manifest.pageOrigin, "http://localhost:8088");
  assert.equal(manifest.pageHost, "localhost:8088");
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
  assert.deepEqual(FROZEN_PROTOCOL.scenarios, ["steady", "burst", "pressureBurst"]);
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

test("legacy main queue remains historical S1/S2 and is not the D-031 entry", () => {
  const queue = buildMainExperimentQueue();
  assert.equal(queue.length, 216);
  assert.equal(queue.filter((run) => run.dataset === "bagAmsterdam" && run.scenario === "burst").length, 72);
  assert.ok(queue.some((run) => run.scenario === "steady"));
  assert.ok(queue.some((run) => run.scenario === "burst"));
  assert.ok(queue.every((run) => run.legacyConfirmatory === true));
  assert.ok(queue.every((run) => run.confirmatoryRelease !== D031_CONFIRMATORY_RELEASE.decisionId));
  assert.ok(queue.every((run) => ["bagAmsterdam", "bagRotterdam"].includes(run.dataset)));
});

test("desktop S3 confirmatory queue freezes the D-031 matrix and method order", () => {
  const queue = buildDesktopS3ConfirmatoryQueue();
  const repeatKeys = [...new Set(queue.map((run) => `${run.dataset}:${run.repeat}:${run.seed}`))];

  assert.equal(queue.length, 120);
  assert.equal(queue.filter((run) => run.dataset === "bagAmsterdam").length, 72);
  assert.equal(queue.filter((run) => run.dataset === "bagRotterdam").length, 48);
  assert.equal(repeatKeys.length, 20);
  assert.ok(queue.every((run) => run.scenario === "pressureBurst"));
  assert.ok(queue.every((run) => run.networkProfile === "lan"));
  assert.ok(queue.every((run) => run.studyPhase === "confirmatory"));
  assert.ok(queue.every((run) => run.confirmatoryRelease === "D-031"));
  assert.ok(queue.every((run) => FROZEN_PROTOCOL.methods.includes(run.method)));
  assert.ok(queue.every((run) => !run.excludeFromFormalAggregation));

  assert.deepEqual(
    queue.filter((run) => run.dataset === "bagAmsterdam" && run.repeat === 1).map((run) => run.method),
    seededShuffle(FROZEN_PROTOCOL.methods, 20260823),
  );
  assert.deepEqual(
    queue.filter((run) => run.dataset === "bagRotterdam" && run.repeat === 1).map((run) => run.method),
    seededShuffle(FROZEN_PROTOCOL.methods, 20260835),
  );
  assert.deepEqual(buildDesktopS3ConfirmatoryQueue(), queue);
});

test("desktop S3 confirmatory queue validator fails closed for non-release conditions", () => {
  const queue = buildDesktopS3ConfirmatoryQueue();
  const context = {
    protocolVersion: "2.3.6",
    deviceId: "pc-a",
    serverTopology: "local",
    pageOrigin: "http://localhost:8088",
    pageHost: "localhost:8088",
  };

  assert.doesNotThrow(() => validateDesktopS3ConfirmatoryQueue(queue, context));
  assert.equal(isLocalPageOrigin("not-a-url", "[::1]:8088"), true);
  assert.throws(
    () => validateDesktopS3ConfirmatoryQueue(queue, { ...context, deviceId: "android-a" }),
    /approved desktop device/,
  );
  assert.throws(
    () => validateDesktopS3ConfirmatoryQueue(queue, { ...context, serverTopology: "remote" }),
    /local server topology/,
  );
  assert.throws(
    () => validateDesktopS3ConfirmatoryQueue(queue, { ...context, pageOrigin: "http://192.168.1.20:8088" }),
    /local page origin/,
  );
  assert.throws(
    () => validateDesktopS3ConfirmatoryQueue([{ ...queue[0], scenario: "burst" }, ...queue.slice(1)], context),
    /pressureBurst/,
  );
  assert.throws(
    () => validateDesktopS3ConfirmatoryQueue([{ ...queue[0], method: "fixedDiagnostic" }, ...queue.slice(1)], context),
    /six formal methods/,
  );
  assert.throws(
    () => validateDesktopS3ConfirmatoryQueue([{ ...queue[0], networkProfile: "delay40" }, ...queue.slice(1)], context),
    /lan/,
  );
  assert.throws(
    () => validateDesktopS3ConfirmatoryQueue(queue, { ...context, protocolVersion: "2.3.7" }),
    /protocolVersion=2\.3\.6/,
  );
});

test("ablation queue contains four D-031 variants on D1 pressureBurst outside main inference", () => {
  const queue = buildAblationQueue();
  assert.equal(queue.length, 32);
  assert.ok(queue.every((run) => run.dataset === "bagAmsterdam"));
  assert.ok(queue.every((run) => run.scenario === "pressureBurst"));
  assert.ok(queue.every((run) => run.networkProfile === "lan"));
  assert.ok(queue.every((run) => run.studyPhase === "confirmatory-ablation"));
  assert.ok(queue.every((run) => run.confirmatoryRelease === "D-031"));
  assert.ok(queue.every((run) => run.deviceId === "pc-a"));
  assert.ok(queue.every((run) => run.method.startsWith("no")));
});

test("D1/S2 pilot queue schedules four paired six-method blocks outside confirmation", () => {
  const queue = buildD1S2PilotQueue();
  assert.equal(queue.length, 24);
  assert.ok(queue.every((run) => run.dataset === "bagAmsterdam"));
  assert.ok(queue.every((run) => run.scenario === "pressureBurst"));
  assert.ok(queue.every((run) => run.networkProfile === "lan"));
  assert.ok(queue.every((run) => run.studyPhase === "pilot"));
  assert.ok(queue.every((run) => run.pilotPurpose === "full-pilot-v2.3.6-pressure-burst"));
  for (let repeat = 1; repeat <= 4; repeat += 1) {
    assert.deepEqual(
      queue.filter((run) => run.repeat === repeat).map((run) => run.method).sort(),
      [...FROZEN_PROTOCOL.methods].sort(),
    );
  }
});

test("D2/S3 pilot queue schedules Rotterdam pressureBurst paired blocks outside confirmation", () => {
  const queue = buildD2S3PilotQueue();
  assert.equal(queue.length, 24);
  assert.ok(queue.every((run) => run.dataset === "bagRotterdam"));
  assert.ok(queue.every((run) => run.scenario === "pressureBurst"));
  assert.ok(queue.every((run) => run.networkProfile === "lan"));
  assert.ok(queue.every((run) => run.studyPhase === "pilot"));
  assert.ok(queue.every((run) => run.pilotPurpose === "full-pilot-v2.3.6-d2-pressure-burst"));
  for (let repeat = 1; repeat <= 4; repeat += 1) {
    assert.deepEqual(
      queue.filter((run) => run.repeat === repeat).map((run) => run.method).sort(),
      [...FROZEN_PROTOCOL.methods].sort(),
    );
  }
});

test("Android identifiability diagnostic uses fixed SSE 4 outside formal methods", () => {
  const queue = buildAndroidIdentifiabilityDiagnosticQueue();
  assert.equal(queue.length, 2);
  assert.deepEqual(
    queue.map((run) => run.dataset).sort(),
    ["bagAmsterdam", "bagRotterdam"],
  );
  assert.ok(queue.every((run) => run.scenario === "pressureBurst"));
  assert.ok(queue.every((run) => run.method === "fixedDiagnostic"));
  assert.ok(queue.every((run) => run.methodParameters.fixedSse === 4));
  assert.ok(queue.every((run) => run.fixedSse === 4));
  assert.ok(queue.every((run) => run.networkProfile === "lan"));
  assert.ok(queue.every((run) => run.studyPhase === "diagnostic"));
  assert.ok(queue.every((run) => run.diagnosticPurpose === "android-workload-identifiability"));
  assert.ok(queue.every((run) => run.excludeFromFormalAggregation === true));
  assert.ok(!FROZEN_PROTOCOL.methods.includes("fixedDiagnostic"));
});

test("server-topology diagnostic uses fixed SSE 4 outside pilot and formal methods", () => {
  const queue = buildServerTopologyDiagnosticQueue({
    seed: 20260823,
    serverTopology: "remote",
  });
  assert.equal(queue.length, 1);
  assert.equal(queue[0].dataset, "bagAmsterdam");
  assert.equal(queue[0].scenario, "pressureBurst");
  assert.equal(queue[0].method, "fixedDiagnostic");
  assert.equal(queue[0].methodParameters.fixedSse, 4);
  assert.equal(queue[0].fixedSse, 4);
  assert.equal(queue[0].networkProfile, "lan");
  assert.equal(queue[0].studyPhase, "diagnostic");
  assert.equal(queue[0].diagnosticPurpose, "server-topology-identifiability");
  assert.equal(queue[0].excludeFromFormalAggregation, true);
  assert.equal(queue[0].serverTopology, "remote");
  assert.ok(!FROZEN_PROTOCOL.methods.includes("fixedDiagnostic"));
});

test("D1/S2 pressure probe schedules one auditable six-method pilot block", () => {
  const queue = buildD1S2PressureProbeQueue();
  assert.equal(queue.length, 6);
  assert.ok(queue.every((run) => run.dataset === "bagAmsterdam"));
  assert.ok(queue.every((run) => run.scenario === "pressureBurst"));
  assert.ok(queue.every((run) => run.studyPhase === "pilot"));
  assert.ok(queue.every((run) => run.pilotPurpose === "request-peak-probe-v2.3.6-pressure-burst"));
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
