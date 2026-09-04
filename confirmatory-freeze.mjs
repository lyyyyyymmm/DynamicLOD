import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import { DEFAULT_LOD_POLICY } from "./lod-controller.mjs";
import {
  D031_CONFIRMATORY_RELEASE,
  DATASETS,
  FROZEN_PROTOCOL,
  buildDesktopS3ConfirmatoryQueue,
} from "./experiment-config.mjs";
import { PI_BASELINE_POLICY } from "./lod-methods.mjs";

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`,
    ).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

function queuePlanForDevice(deviceId) {
  const queue = buildDesktopS3ConfirmatoryQueue();
  const methodsPerBlock = D031_CONFIRMATORY_RELEASE.methods.length;
  const blocks = [];
  for (let index = 0; index < queue.length; index += methodsPerBlock) {
    const block = queue.slice(index, index + methodsPerBlock);
    const first = block[0];
    blocks.push({
      deviceId,
      perDeviceBlockIndex: blocks.length + 1,
      dataset: first.dataset,
      scenario: first.scenario,
      repeat: first.repeat,
      blockSeed: first.seed,
      networkProfile: first.networkProfile,
      studyPhase: first.studyPhase,
      confirmatoryRelease: first.confirmatoryRelease,
      confirmatoryRole: first.confirmatoryRole,
      methodOrder: block.map((run) => run.method),
    });
  }
  return blocks;
}

export function createConfirmatoryFreezeArtifact(options = {}) {
  const createdAt = options.createdAt ?? new Date().toISOString();
  const queuePlan = D031_CONFIRMATORY_RELEASE.efficacyDevices.flatMap(queuePlanForDevice)
    .map((block, index) => ({ globalBlockIndex: index + 1, ...block }));
  const queuePlanSha256 = sha256Hex(canonicalJson(queuePlan));
  const perDeviceRunCount = buildDesktopS3ConfirmatoryQueue().length;
  return {
    artifactSchemaVersion: 1,
    createdAt,
    freezeDecision: D031_CONFIRMATORY_RELEASE.decisionId,
    protocolVersion: FROZEN_PROTOCOL.protocolVersion,
    efficacyDevices: [...D031_CONFIRMATORY_RELEASE.efficacyDevices],
    excludedEfficacyDevices: ["android-a"],
    androidScope: [
      "cross-device executability",
      "telemetry validity",
      "frame-time floor / low-pressure boundary evidence",
    ],
    serverTopology: D031_CONFIRMATORY_RELEASE.serverTopology,
    allowedPageOrigins: ["http://localhost:8088", "http://127.0.0.1:8088"],
    datasets: D031_CONFIRMATORY_RELEASE.matrix.map((condition) => ({
      dataset: condition.dataset,
      label: DATASETS[condition.dataset].label,
      version: DATASETS[condition.dataset].version,
      license: DATASETS[condition.dataset].license,
      sourceSha256: DATASETS[condition.dataset].sourceSha256,
      repeats: condition.repeats,
      role: condition.confirmatoryRole,
    })),
    scenario: D031_CONFIRMATORY_RELEASE.scenario,
    methods: [...D031_CONFIRMATORY_RELEASE.methods],
    seed: D031_CONFIRMATORY_RELEASE.seed,
    networkProfile: D031_CONFIRMATORY_RELEASE.networkProfile,
    studyPhase: D031_CONFIRMATORY_RELEASE.studyPhase,
    statisticalUnit: "one browser run",
    statisticalAnalysisInputs: {
      strata: ["deviceId", "dataset", "scenario"],
      completePairedMethods: [...D031_CONFIRMATORY_RELEASE.methods],
      plannedComparisons: [
        "proposed - pi",
        "proposed - reactive",
        "proposed - cesiumDynamic",
      ],
      friedmanBy: ["deviceId", "dataset", "scenario"],
      holmCorrection: "global across planned paired comparisons",
      pairedBootstrapResamples: 10000,
      bootstrapSeed: 20260823,
      noPooledCrossDevicePValueForGate: true,
    },
    renderWidth: FROZEN_PROTOCOL.renderWidth,
    renderHeight: FROZEN_PROTOCOL.renderHeight,
    frameBudgetMs: FROZEN_PROTOCOL.frameBudgetMs,
    warmupMs: FROZEN_PROTOCOL.warmupMs,
    measurementMs: FROZEN_PROTOCOL.measurementMs,
    windowMs: FROZEN_PROTOCOL.windowMs,
    controlIntervalMs: FROZEN_PROTOCOL.controlIntervalMs,
    predictionHorizonMs: 1000,
    readiness: {
      initialContentTimeoutMs: FROZEN_PROTOCOL.initialContentTimeoutMs,
      readinessWindowMs: FROZEN_PROTOCOL.readinessWindowMs,
      readinessRequiredStableWindows: FROZEN_PROTOCOL.readinessRequiredStableWindows,
      readinessP95ThresholdMs: FROZEN_PROTOCOL.readinessP95ThresholdMs,
      readinessTimeoutMs: FROZEN_PROTOCOL.readinessTimeoutMs,
      drawingBufferTolerancePx: FROZEN_PROTOCOL.drawingBufferTolerancePx,
    },
    controllerPolicy: {
      sseLadder: [...DEFAULT_LOD_POLICY.sseLadder],
      frameBudgetMs: DEFAULT_LOD_POLICY.frameBudgetMs,
      windowMs: DEFAULT_LOD_POLICY.windowMs,
      controlIntervalMs: DEFAULT_LOD_POLICY.controlIntervalMs,
      predictionHorizonMs: DEFAULT_LOD_POLICY.predictionHorizonMs,
      requestPersistenceMs: DEFAULT_LOD_POLICY.requestPersistenceMs,
      requestImpulseThreshold: DEFAULT_LOD_POLICY.requestImpulseThreshold,
      requestReleaseMs: DEFAULT_LOD_POLICY.requestReleaseMs,
      interactionHoldMs: DEFAULT_LOD_POLICY.interactionHoldMs,
      recoveryStableTicks: DEFAULT_LOD_POLICY.recoveryStableTicks,
      downgradeCooldownMs: DEFAULT_LOD_POLICY.downgradeCooldownMs,
      upgradeCooldownMs: DEFAULT_LOD_POLICY.upgradeCooldownMs,
      preemptiveRatio: DEFAULT_LOD_POLICY.preemptiveRatio,
      recoveryRatio: DEFAULT_LOD_POLICY.recoveryRatio,
      criticalRatio: DEFAULT_LOD_POLICY.criticalRatio,
    },
    piBaseline: {
      parameterStatus: PI_BASELINE_POLICY.parameterStatus,
      kp: PI_BASELINE_POLICY.kp,
      ki: PI_BASELINE_POLICY.ki,
    },
    ablation: D031_CONFIRMATORY_RELEASE.ablation,
    perDeviceRunCount,
    totalRunCount: perDeviceRunCount * D031_CONFIRMATORY_RELEASE.efficacyDevices.length,
    queuePlanSha256,
    queuePlan,
  };
}

function markdownForArtifact(artifact) {
  return [
    "# D-031 Confirmatory freeze v2.3.6",
    "",
    `- Created at: ${artifact.createdAt}`,
    `- Freeze decision: ${artifact.freezeDecision}`,
    `- Protocol version: ${artifact.protocolVersion}`,
    `- Queue plan SHA-256: \`${artifact.queuePlanSha256}\``,
    `- Devices: ${artifact.efficacyDevices.join(", ")}`,
    `- Per-device runs: ${artifact.perDeviceRunCount}`,
    `- Total planned runs: ${artifact.totalRunCount}`,
    `- Server topology: ${artifact.serverTopology}; allowed origins: ${artifact.allowedPageOrigins.join(", ")}`,
    `- Matrix: D1 bagAmsterdam/S3 pressureBurst x12; D2 bagRotterdam/S3 pressureBurst x8`,
    `- Methods: ${artifact.methods.join(", ")}`,
    `- Seed: ${artifact.seed}`,
    "",
    "Android-A is excluded from v2.3.6/S3 tail-control efficacy inference and remains executability / telemetry validity / low-pressure boundary evidence only.",
    "",
    "The complete per-device paired-block queue plan is stored in the JSON artifact.",
    "",
  ].join("\n");
}

export async function writeConfirmatoryFreezeArtifacts(outputDir = new URL("./results/confirmatory/", import.meta.url)) {
  const artifact = createConfirmatoryFreezeArtifact();
  await mkdir(outputDir, { recursive: true });
  const jsonPath = new URL("CONFIRMATORY_FREEZE_v2.3.6.json", outputDir);
  const markdownPath = new URL("CONFIRMATORY_FREEZE_v2.3.6.md", outputDir);
  await writeFile(jsonPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf-8");
  await writeFile(markdownPath, markdownForArtifact(artifact), "utf-8");
  return { artifact, jsonPath, markdownPath };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { artifact, jsonPath, markdownPath } = await writeConfirmatoryFreezeArtifacts();
  console.log(`Wrote ${jsonPath.pathname}`);
  console.log(`Wrote ${markdownPath.pathname}`);
  console.log(`Queue plan SHA-256: ${artifact.queuePlanSha256}`);
}
