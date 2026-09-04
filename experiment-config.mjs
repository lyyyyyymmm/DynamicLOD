import { DEFAULT_LOD_POLICY } from "./lod-controller.mjs";

export const EXPERIMENT_METHODS = Object.freeze({
  fixed8: Object.freeze({ label: "Fixed SSE 8", kind: "fixed", initialSse: 8 }),
  fixed16: Object.freeze({ label: "Fixed SSE 16", kind: "fixed", initialSse: 16 }),
  fixedDiagnostic: Object.freeze({
    label: "Diagnostic fixed SSE 4",
    kind: "fixed",
    initialSse: 4,
    diagnosticOnly: true,
  }),
  cesiumDynamic: Object.freeze({
    label: "Cesium Dynamic SSE",
    kind: "cesium",
    initialSse: 16,
  }),
  reactive: Object.freeze({ label: "Reactive P95", kind: "reactive", initialSse: 16 }),
  pi: Object.freeze({ label: "Discrete PI", kind: "pi", initialSse: 16 }),
  proposed: Object.freeze({ label: "Proposed", kind: "controller", initialSse: 16 }),
  noPrediction: Object.freeze({ label: "Ablation: no prediction", kind: "controller" }),
  noRequest: Object.freeze({ label: "Ablation: no request pressure", kind: "controller" }),
  noInteraction: Object.freeze({ label: "Ablation: no interaction", kind: "controller" }),
  noStability: Object.freeze({ label: "Ablation: no stability", kind: "controller" }),
});

export const DATASETS = Object.freeze({
  dragon: Object.freeze({
    label: "Stanford Dragon discrete LOD",
    path: "SampleData/models/TilesetWithDiscreteLOD/tileset.json",
    sourceUrl: "https://github.com/CesiumGS/3d-tiles-samples",
    version: "bundled-cesium-1.134",
    license: "Apache-2.0; verify asset attribution before publication",
    sourceSha256: null,
    studyRole: "calibration",
    accessRoute: "bundledSample",
    allowedForMainStudy: false,
  }),
  publicStress: Object.freeze({
    label: "Public 85-tile stress benchmark",
    path: "learnMapmost/generated/public-stress-tileset/tileset.json",
    sourceUrl: "local://learnMapmost/stress-tileset-generator.mjs",
    version: "generated-v1",
    license: "Derived from bundled Cesium sample; verify attribution",
    sourceSha256: null,
    studyRole: "diagnostic",
    accessRoute: "generated",
    allowedForMainStudy: false,
  }),
  bagAmsterdam: Object.freeze({
    label: "3DBAG Amsterdam frozen subset",
    path: "learnMapmost/datasets/3dbag-amsterdam/tileset.json",
    sourceUrl: "https://data.3dbag.nl/v20250903/cesium3dtiles/lod12/tileset.json",
    version: "v20250903",
    license: "CC-BY-4.0",
    sourceSha256: "5632a6307cced8bd32451c9a561a77b46d9dcf3cd6ca607079ae5e75ea679a7a",
    studyRole: "main",
    accessRoute: "publicRepository",
    allowedForMainStudy: true,
  }),
  bagRotterdam: Object.freeze({
    label: "3DBAG Rotterdam frozen subset",
    path: "learnMapmost/datasets/3dbag-rotterdam/tileset.json",
    sourceUrl: "https://data.3dbag.nl/v20250903/cesium3dtiles/lod12/tileset.json",
    version: "v20250903",
    license: "CC-BY-4.0",
    sourceSha256: "d06be54d9f1009ef4d83ab71c1d6bd0f32a36c87ec28b6155f9160ebf219e787",
    studyRole: "externalValidation",
    accessRoute: "publicRepository",
    allowedForMainStudy: true,
  }),
  helsinkiKalasatama: Object.freeze({
    label: "Helsinki Kalasatama reality-mesh subset",
    path: "learnMapmost/datasets/helsinki-kalasatama/tileset.json",
    sourceUrl: "https://hri.fi/data/en/dataset/helsingin-3d-kaupunkimalli",
    version: "frozen-local-conversion-v1",
    license: "CC-BY-4.0",
    sourceSha256: null,
    studyRole: "externalValidation",
    accessRoute: "publicRepository",
    allowedForMainStudy: false,
  }),
  taipei101: Object.freeze({
    label: "Taipei 101 third-party case",
    path: "SampleData/models/taipei101/tileset.json",
    sourceUrl: "https://mp.weixin.qq.com/s/XIWd4LmYpvB46bzp0iIwmA",
    version: "downloaded-via-wechat-unverified",
    license: "NOASSERTION",
    sourceSha256: null,
    studyRole: "optionalCase",
    accessRoute: "thirdPartyRestricted",
    allowedForMainStudy: false,
  }),
  dayanta: Object.freeze({
    label: "Dayanta cultural-heritage case",
    path: "SampleData/models/dayanta-3dtiles-202211/tileset.json",
    sourceUrl: null,
    version: "local-unverified",
    license: "NOASSERTION",
    sourceSha256: null,
    studyRole: "optionalCase",
    accessRoute: "thirdPartyRestricted",
    allowedForMainStudy: false,
  }),
});

export const FROZEN_PROTOCOL = Object.freeze({
  schemaVersion: 2,
  protocolVersion: "2.3.6",
  renderWidth: 960,
  renderHeight: 540,
  warmupMs: 10000,
  measurementMs: 40000,
  windowMs: DEFAULT_LOD_POLICY.windowMs,
  controlIntervalMs: DEFAULT_LOD_POLICY.controlIntervalMs,
  initialContentTimeoutMs: 60000,
  readinessWindowMs: 2000,
  readinessRequiredStableWindows: 2,
  readinessP95ThresholdMs: 25,
  readinessTimeoutMs: 60000,
  drawingBufferTolerancePx: 1,
  publicStressDelayMs: 40,
  defaultRepeats: 8,
  primaryRepeats: 12,
  frameBudgetMs: DEFAULT_LOD_POLICY.frameBudgetMs,
  methods: Object.freeze([
    "fixed8", "fixed16", "cesiumDynamic", "reactive", "pi", "proposed",
  ]),
  datasets: Object.freeze(["bagAmsterdam", "bagRotterdam"]),
  scenarios: Object.freeze(["steady", "burst", "pressureBurst"]),
  networkProfiles: Object.freeze(["lan", "delay40", "delay80"]),
});

export const D031_CONFIRMATORY_RELEASE = Object.freeze({
  decisionId: "D-031",
  protocolVersion: "2.3.6",
  seed: 20260823,
  efficacyDevices: Object.freeze(["pc-a", "pc-b"]),
  serverTopology: "local",
  allowedPageHostnames: Object.freeze(["localhost", "127.0.0.1", "::1", "[::1]"]),
  scenario: "pressureBurst",
  networkProfile: "lan",
  studyPhase: "confirmatory",
  methods: FROZEN_PROTOCOL.methods,
  matrix: Object.freeze([
    Object.freeze({
      dataset: "bagAmsterdam",
      repeats: 12,
      confirmatoryRole: "primary-efficacy",
    }),
    Object.freeze({
      dataset: "bagRotterdam",
      repeats: 8,
      confirmatoryRole: "external-validation",
    }),
  ]),
  ablation: Object.freeze({
    deviceId: "pc-a",
    dataset: "bagAmsterdam",
    scenario: "pressureBurst",
    repeats: 8,
    studyPhase: "confirmatory-ablation",
    methods: Object.freeze(["noPrediction", "noRequest", "noInteraction", "noStability"]),
  }),
});

export const PI_TUNING_GRID = Object.freeze({
  kp: Object.freeze([0.05, 0.1, 0.2, 0.4]),
  ki: Object.freeze([0.01, 0.02, 0.05, 0.1]),
});

function mulberry32(seed) {
  let value = seed >>> 0;
  return function random() {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle(values, seed) {
  const output = [...values];
  const random = mulberry32(Number(seed) || 0);
  for (let index = output.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [output[index], output[other]] = [output[other], output[index]];
  }
  return output;
}

export function buildScenarioTimeline(scenario) {
  if (scenario === "steady") {
    return [{ id: "steady-orbit", startMs: 0, endMs: 40000, interacting: false }];
  }
  if (!["burst", "pressureBurst"].includes(scenario)) {
    throw new Error(`Unknown scenario: ${scenario}`);
  }
  const interactionMs = scenario === "pressureBurst" ? 4000 : 6000;
  const recoveryMs = scenario === "pressureBurst" ? 6000 : 4000;
  const phases = [];
  let cursor = 0;
  for (let cycle = 0; cycle < 4; cycle += 1) {
    phases.push({
      id: `interaction-${cycle + 1}`,
      startMs: cursor,
      endMs: cursor + interactionMs,
      interacting: true,
    });
    cursor += interactionMs;
    phases.push({
      id: `recovery-${cycle + 1}`,
      startMs: cursor,
      endMs: cursor + recoveryMs,
      interacting: false,
    });
    cursor += recoveryMs;
  }
  return phases;
}

export function createRunManifest(options) {
  if (!EXPERIMENT_METHODS[options.method]) {
    throw new Error(`Unknown method: ${options.method}`);
  }
  if (!DATASETS[options.dataset]) {
    throw new Error(`Unknown dataset: ${options.dataset}`);
  }
  if (!FROZEN_PROTOCOL.scenarios.includes(options.scenario)) {
    throw new Error(`Unknown scenario: ${options.scenario}`);
  }
  const networkProfile = options.networkProfile ?? "lan";
  if (!FROZEN_PROTOCOL.networkProfiles.includes(networkProfile)) {
    throw new Error(`Unknown network profile: ${networkProfile}`);
  }
  const repeat = Number(options.repeat);
  if (!Number.isInteger(repeat) || repeat < 1) {
    throw new Error("repeat must be a positive integer");
  }
  return Object.freeze({
    schemaVersion: FROZEN_PROTOCOL.schemaVersion,
    protocolVersion: FROZEN_PROTOCOL.protocolVersion,
    runId: String(options.runId),
    createdAt: new Date().toISOString(),
    method: options.method,
    dataset: options.dataset,
    scenario: options.scenario,
    repeat,
    retryAttempt: Number(options.retryAttempt ?? 0),
    seed: Number(options.seed),
    renderWidth: FROZEN_PROTOCOL.renderWidth,
    renderHeight: FROZEN_PROTOCOL.renderHeight,
    warmupMs: FROZEN_PROTOCOL.warmupMs,
    measurementMs: FROZEN_PROTOCOL.measurementMs,
    initialContentTimeoutMs: FROZEN_PROTOCOL.initialContentTimeoutMs,
    readinessWindowMs: FROZEN_PROTOCOL.readinessWindowMs,
    readinessRequiredStableWindows: FROZEN_PROTOCOL.readinessRequiredStableWindows,
    readinessP95ThresholdMs: FROZEN_PROTOCOL.readinessP95ThresholdMs,
    readinessTimeoutMs: FROZEN_PROTOCOL.readinessTimeoutMs,
    drawingBufferTolerancePx: FROZEN_PROTOCOL.drawingBufferTolerancePx,
    frameBudgetMs: FROZEN_PROTOCOL.frameBudgetMs,
    datasetVersion: DATASETS[options.dataset].version,
    sourceSha256: DATASETS[options.dataset].sourceSha256,
    sourceLicense: DATASETS[options.dataset].license,
    deviceId: String(options.deviceId ?? "unregistered"),
    networkProfile,
    studyPhase: String(options.studyPhase ?? "adHoc"),
    pilotPurpose: String(options.pilotPurpose ?? "none"),
    diagnosticPurpose: String(options.diagnosticPurpose ?? "none"),
    confirmatoryRelease: String(options.confirmatoryRelease ?? "none"),
    confirmatoryRole: String(options.confirmatoryRole ?? "none"),
    ablationPurpose: String(options.ablationPurpose ?? "none"),
    fixedSse: Number.isFinite(Number(options.fixedSse)) ? Number(options.fixedSse) : null,
    excludeFromFormalAggregation: Boolean(options.excludeFromFormalAggregation),
    serverTopology: String(options.serverTopology ?? "unspecified"),
    pageOrigin: String(options.pageOrigin ?? "unknown"),
    pageHost: String(options.pageHost ?? "unknown"),
    browserVersion: String(options.browserVersion ?? "unknown"),
    gpuRenderer: String(options.gpuRenderer ?? "unknown"),
    methodParameters: options.methodParameters ?? null,
    userAgent: String(options.userAgent ?? "unknown"),
    hardwareConcurrency:
      Number.isFinite(options.hardwareConcurrency) ? options.hardwareConcurrency : null,
    deviceMemoryGb: Number.isFinite(options.deviceMemoryGb) ? options.deviceMemoryGb : null,
    viewport: options.viewport ?? null,
  });
}

export function controllerOverridesForMethod(method) {
  switch (method) {
    case "noPrediction":
      return { predictionEnabled: false };
    case "noRequest":
      return { requestPressureEnabled: false };
    case "noInteraction":
      return { interactionAware: false };
    case "noStability":
      return { stabilityEnabled: false };
    default:
      return {};
  }
}

function createQueue({ datasets, scenarios, methods, repeats, seed }) {
  const queue = [];
  let block = 0;
  for (const dataset of datasets) {
    for (const scenario of scenarios) {
      for (let repeat = 1; repeat <= repeats; repeat += 1) {
        const blockSeed = Number(seed) + block;
        for (const method of seededShuffle(methods, blockSeed)) {
          queue.push({ dataset, scenario, repeat, method, seed: blockSeed });
        }
        block += 1;
      }
    }
  }
  return queue;
}

export function buildDesktopS3ConfirmatoryQueue(options = {}) {
  const seed = options.seed ?? D031_CONFIRMATORY_RELEASE.seed;
  const queue = [];
  let block = 0;
  for (const condition of D031_CONFIRMATORY_RELEASE.matrix) {
    for (let repeat = 1; repeat <= condition.repeats; repeat += 1) {
      const blockSeed = Number(seed) + block;
      for (const method of seededShuffle(D031_CONFIRMATORY_RELEASE.methods, blockSeed)) {
        queue.push({
          dataset: condition.dataset,
          scenario: D031_CONFIRMATORY_RELEASE.scenario,
          repeat,
          method,
          seed: blockSeed,
          networkProfile: D031_CONFIRMATORY_RELEASE.networkProfile,
          studyPhase: D031_CONFIRMATORY_RELEASE.studyPhase,
          confirmatoryRelease: D031_CONFIRMATORY_RELEASE.decisionId,
          confirmatoryRole: condition.confirmatoryRole,
        });
      }
      block += 1;
    }
  }
  return queue;
}

export function buildMainExperimentQueue(options = {}) {
  const seed = options.seed ?? 20260823;
  const defaultRepeats = options.repeats ?? FROZEN_PROTOCOL.defaultRepeats;
  const primaryRepeats = options.primaryRepeats ?? FROZEN_PROTOCOL.primaryRepeats;
  const conditions = [
    { dataset: "bagAmsterdam", scenario: "steady", repeats: defaultRepeats },
    { dataset: "bagAmsterdam", scenario: "burst", repeats: primaryRepeats },
    { dataset: "bagRotterdam", scenario: "steady", repeats: defaultRepeats },
    { dataset: "bagRotterdam", scenario: "burst", repeats: defaultRepeats },
  ];
  const queue = [];
  let block = 0;
  for (const condition of conditions) {
    for (let repeat = 1; repeat <= condition.repeats; repeat += 1) {
      const blockSeed = Number(seed) + block;
      for (const method of seededShuffle(FROZEN_PROTOCOL.methods, blockSeed)) {
        queue.push({
          ...condition,
          repeat,
          method,
          seed: blockSeed,
          networkProfile: "lan",
          studyPhase: "confirmatory",
          legacyConfirmatory: true,
          confirmatoryRelease: "legacy-s1s2-unreleased",
          confirmatoryRole: "historical-audit-trail",
        });
      }
      block += 1;
    }
  }
  return queue.map(({ repeats: _repeats, ...run }) => run);
}

export function buildAblationQueue(options = {}) {
  return createQueue({
    datasets: ["bagAmsterdam"],
    scenarios: [D031_CONFIRMATORY_RELEASE.ablation.scenario],
    methods: D031_CONFIRMATORY_RELEASE.ablation.methods,
    repeats: options.repeats ?? D031_CONFIRMATORY_RELEASE.ablation.repeats,
    seed: options.seed ?? D031_CONFIRMATORY_RELEASE.seed,
  }).map((run) => ({
    ...run,
    deviceId: options.deviceId ?? D031_CONFIRMATORY_RELEASE.ablation.deviceId,
    networkProfile: D031_CONFIRMATORY_RELEASE.networkProfile,
    studyPhase: D031_CONFIRMATORY_RELEASE.ablation.studyPhase,
    confirmatoryRelease: D031_CONFIRMATORY_RELEASE.decisionId,
    confirmatoryRole: "mechanism-ablation",
    ablationPurpose: "d031-d1-s3-mechanism",
  }));
}

export function isLocalPageOrigin(pageOrigin, pageHost = "") {
  const allowed = new Set(D031_CONFIRMATORY_RELEASE.allowedPageHostnames);
  try {
    const parsed = new URL(String(pageOrigin));
    return ["http:", "https:"].includes(parsed.protocol) && allowed.has(parsed.hostname);
  } catch {
    const rawHost = String(pageHost).trim().toLowerCase();
    const bracketEnd = rawHost.startsWith("[") ? rawHost.indexOf("]") : -1;
    const host = bracketEnd >= 0 ? rawHost.slice(0, bracketEnd + 1) : rawHost.split(":")[0];
    return allowed.has(host);
  }
}

function assertQueueMatchesD031Plan(queue) {
  const expected = buildDesktopS3ConfirmatoryQueue({ seed: D031_CONFIRMATORY_RELEASE.seed });
  if (queue.length !== expected.length) {
    throw new Error(`D-031 confirmatory queue must contain ${expected.length} runs`);
  }
  for (let index = 0; index < expected.length; index += 1) {
    const actual = queue[index];
    const planned = expected[index];
    for (const field of [
      "dataset",
      "scenario",
      "repeat",
      "method",
      "seed",
      "networkProfile",
      "studyPhase",
      "confirmatoryRelease",
      "confirmatoryRole",
    ]) {
      if (actual[field] !== planned[field]) {
        throw new Error(`D-031 confirmatory queue differs from the frozen plan at run ${index + 1}: ${field}`);
      }
    }
  }
}

export function validateDesktopS3ConfirmatoryQueue(queue, context = {}) {
  if (context.protocolVersion !== D031_CONFIRMATORY_RELEASE.protocolVersion) {
    throw new Error("D-031 confirmatory requires protocolVersion=2.3.6");
  }
  if (!D031_CONFIRMATORY_RELEASE.efficacyDevices.includes(String(context.deviceId))) {
    throw new Error("D-031 confirmatory requires an approved desktop device: pc-a or pc-b");
  }
  if (String(context.serverTopology) !== D031_CONFIRMATORY_RELEASE.serverTopology) {
    throw new Error("D-031 confirmatory requires local server topology");
  }
  if (!isLocalPageOrigin(context.pageOrigin, context.pageHost)) {
    throw new Error("D-031 confirmatory requires a local page origin such as localhost or 127.0.0.1");
  }
  for (const run of queue) {
    const deviceId = String(run.deviceId ?? context.deviceId);
    const serverTopology = String(run.serverTopology ?? context.serverTopology);
    if (!D031_CONFIRMATORY_RELEASE.efficacyDevices.includes(deviceId)) {
      throw new Error("D-031 confirmatory requires an approved desktop device: pc-a or pc-b");
    }
    if (serverTopology !== D031_CONFIRMATORY_RELEASE.serverTopology) {
      throw new Error("D-031 confirmatory requires local server topology");
    }
    if (!D031_CONFIRMATORY_RELEASE.matrix.some((condition) => condition.dataset === run.dataset)) {
      throw new Error("D-031 confirmatory dataset must be bagAmsterdam or bagRotterdam");
    }
    if (run.scenario !== D031_CONFIRMATORY_RELEASE.scenario) {
      throw new Error("D-031 confirmatory scenario must be pressureBurst");
    }
    if (!D031_CONFIRMATORY_RELEASE.methods.includes(run.method)) {
      throw new Error("D-031 confirmatory allows only the six formal methods");
    }
    if (run.networkProfile !== D031_CONFIRMATORY_RELEASE.networkProfile) {
      throw new Error("D-031 confirmatory networkProfile must be lan");
    }
    if (run.studyPhase !== D031_CONFIRMATORY_RELEASE.studyPhase) {
      throw new Error("D-031 confirmatory studyPhase must be confirmatory");
    }
    if (run.confirmatoryRelease !== D031_CONFIRMATORY_RELEASE.decisionId) {
      throw new Error("D-031 confirmatoryRelease must be D-031");
    }
    if (run.excludeFromFormalAggregation) {
      throw new Error("D-031 confirmatory runs must not be diagnostic exclusions");
    }
  }
  assertQueueMatchesD031Plan(queue);
  return true;
}

export function buildD1S2PilotQueue(options = {}) {
  return createQueue({
    datasets: ["bagAmsterdam"],
    scenarios: ["pressureBurst"],
    methods: FROZEN_PROTOCOL.methods,
    repeats: options.repeats ?? 4,
    seed: options.seed ?? 20260823,
  }).map((run) => ({
    ...run,
    networkProfile: "lan",
    studyPhase: "pilot",
    pilotPurpose: "full-pilot-v2.3.6-pressure-burst",
  }));
}

export function buildD2S3PilotQueue(options = {}) {
  return createQueue({
    datasets: ["bagRotterdam"],
    scenarios: ["pressureBurst"],
    methods: FROZEN_PROTOCOL.methods,
    repeats: options.repeats ?? 4,
    seed: options.seed ?? 20260823,
  }).map((run) => ({
    ...run,
    networkProfile: "lan",
    studyPhase: "pilot",
    pilotPurpose: "full-pilot-v2.3.6-d2-pressure-burst",
  }));
}

export function buildAndroidIdentifiabilityDiagnosticQueue(options = {}) {
  return createQueue({
    datasets: ["bagAmsterdam", "bagRotterdam"],
    scenarios: ["pressureBurst"],
    methods: ["fixedDiagnostic"],
    repeats: options.repeats ?? 1,
    seed: options.seed ?? 20260823,
  }).map((run) => ({
    ...run,
    networkProfile: "lan",
    studyPhase: "diagnostic",
    diagnosticPurpose: "android-workload-identifiability",
    fixedSse: 4,
    excludeFromFormalAggregation: true,
    methodParameters: { fixedSse: 4 },
  }));
}

export function buildServerTopologyDiagnosticQueue(options = {}) {
  return createQueue({
    datasets: ["bagAmsterdam"],
    scenarios: ["pressureBurst"],
    methods: ["fixedDiagnostic"],
    repeats: options.repeats ?? 1,
    seed: options.seed ?? 20260823,
  }).map((run) => ({
    ...run,
    networkProfile: "lan",
    studyPhase: "diagnostic",
    diagnosticPurpose: "server-topology-identifiability",
    fixedSse: 4,
    excludeFromFormalAggregation: true,
    methodParameters: { fixedSse: 4 },
    ...(options.serverTopology ? { serverTopology: options.serverTopology } : {}),
  }));
}

export function buildD1S2PressureProbeQueue(options = {}) {
  return createQueue({
    datasets: ["bagAmsterdam"],
    scenarios: ["pressureBurst"],
    methods: FROZEN_PROTOCOL.methods,
    repeats: 1,
    seed: options.seed ?? 20260823,
  }).map((run) => ({
    ...run,
    networkProfile: "lan",
    studyPhase: "pilot",
    pilotPurpose: "request-peak-probe-v2.3.6-pressure-burst",
  }));
}

export function buildPiCalibrationQueue(options = {}) {
  const repeats = options.repeats ?? 4;
  const seed = options.seed ?? 20260823;
  const queue = [];
  let block = 0;
  for (const kp of PI_TUNING_GRID.kp) {
    for (const ki of PI_TUNING_GRID.ki) {
      for (let repeat = 1; repeat <= repeats; repeat += 1) {
        queue.push({
          dataset: "publicStress",
          scenario: "burst",
          method: "pi",
          repeat,
          seed: Number(seed) + block,
          networkProfile: "delay40",
          studyPhase: "tuning",
          methodParameters: { kp, ki },
        });
        block += 1;
      }
    }
  }
  return queue;
}
