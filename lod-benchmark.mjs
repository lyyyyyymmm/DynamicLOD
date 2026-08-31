import {
  DATASETS,
  EXPERIMENT_METHODS,
  FROZEN_PROTOCOL,
  buildAblationQueue,
  buildD1S2PressureProbeQueue,
  buildD1S2PilotQueue,
  buildMainExperimentQueue,
  buildPiCalibrationQueue,
  createRunManifest,
} from "./experiment-config.mjs";
import {
  PI_BASELINE_POLICY,
  createMethodController,
  tilesetOptionsForMethod,
} from "./lod-methods.mjs";
import {
  isControlWindowReady,
  readinessInvalidReasons,
  retryCondition,
  runFrameReadinessCheck,
  unavailableDatasets,
} from "./benchmark-run-utils.mjs";
import {
  FrameTimeWindow,
  percentile,
  summarizeForecast,
  summarizeRun,
  validateRunEvidence,
} from "./lod-metrics.mjs";
import { buildControllerSample } from "./controller-sample.mjs";
import { downloadText, rowsToCsv, sanitizeForJson } from "./result-export.mjs";
import { getScenarioFrame } from "./scenario-driver.mjs";
import { TilesetTelemetry, summarizeResourceEntries } from "./tileset-telemetry.mjs";

const Cesium = globalThis.Cesium;
if (!Cesium) throw new Error("Cesium failed to load");

const elements = Object.fromEntries(
  [
    "runForm", "method", "dataset", "scenario", "networkProfile", "deviceId", "repeat", "seed",
    "runSingle", "stopRun", "runMainBatch", "runAblationBatch", "runD1S2Pilot", "runD1S2PressureProbe", "runPiCalibration", "downloadJson",
    "downloadCsv", "runState", "runProgress", "progressBar", "resultsBody", "hud",
    "bufferSize", "metricP95", "metricPredicted", "metricSse", "metricQueue",
    "metricState", "metricAction", "viewportFrame",
  ].map((id) => [id, document.getElementById(id)]),
);

const query = new URLSearchParams(location.search);
const smokeMode = query.get("smoke") === "1";
const state = {
  running: false,
  stopRequested: false,
  activeRaf: null,
  tileset: null,
  detachTelemetry: null,
  completedRuns: [],
  lastResult: null,
  invalidReasons: [],
  resizeDuringRun: false,
  qualityContext: null,
};

for (const [id, method] of Object.entries(EXPERIMENT_METHODS)) {
  const option = document.createElement("option");
  option.value = id;
  option.textContent = method.label;
  elements.method.append(option);
}
for (const [id, dataset] of Object.entries(DATASETS)) {
  const option = document.createElement("option");
  option.value = id;
  option.textContent = dataset.label;
  elements.dataset.append(option);
}
elements.method.value = query.get("method") ?? "proposed";
elements.dataset.value = query.get("dataset") ?? "publicStress";
elements.scenario.value = query.get("scenario") ?? "burst";
elements.repeat.value = query.get("repeat") ?? "1";
elements.seed.value = query.get("seed") ?? "20260823";
elements.networkProfile.value = query.get("networkProfile") ?? "lan";
elements.deviceId.value = query.get("deviceId") ?? "unregistered";

const viewer = new Cesium.Viewer("cesiumContainer", {
  animation: false,
  baseLayer: false,
  baseLayerPicker: false,
  fullscreenButton: false,
  geocoder: false,
  globe: false,
  homeButton: false,
  infoBox: false,
  navigationHelpButton: false,
  sceneModePicker: false,
  selectionIndicator: false,
  timeline: false,
  useBrowserRecommendedResolution: true,
});
viewer.scene.backgroundColor = Cesium.Color.fromCssColorString("#050706");
viewer.scene.highDynamicRange = false;
viewer.scene.fxaa = false;
viewer.scene.screenSpaceCameraController.enableInputs = false;
viewer.scene.debugShowFramesPerSecond = false;

function setBufferSize() {
  const band = elements.viewportFrame.parentElement;
  const bandStyle = getComputedStyle(band);
  const availableWidth =
    band.clientWidth -
    Number.parseFloat(bandStyle.paddingLeft) -
    Number.parseFloat(bandStyle.paddingRight);
  const availableHeight =
    band.clientHeight -
    Number.parseFloat(bandStyle.paddingTop) -
    Number.parseFloat(bandStyle.paddingBottom);
  const widthLimited = innerWidth <= 880
    ? availableWidth
    : Math.min(availableWidth, availableHeight * (16 / 9));
  const cssWidth = Math.max(320, Math.floor(widthLimited / 16) * 16);
  elements.viewportFrame.style.width = `${cssWidth}px`;
  elements.viewportFrame.style.height = `${(cssWidth / 16) * 9}px`;
  const canvas = viewer.canvas;
  if (canvas.clientWidth <= 0) return;
  viewer.resolutionScale = FROZEN_PROTOCOL.renderWidth / canvas.clientWidth;
  viewer.forceResize();
  viewer.render();
  const width = viewer.scene.context.drawingBufferWidth;
  const height = viewer.scene.context.drawingBufferHeight;
  elements.bufferSize.textContent = `${width} × ${height}`;
  if (
    state.running &&
    (Math.abs(width - FROZEN_PROTOCOL.renderWidth) > FROZEN_PROTOCOL.drawingBufferTolerancePx ||
      Math.abs(height - FROZEN_PROTOCOL.renderHeight) > FROZEN_PROTOCOL.drawingBufferTolerancePx)
  ) {
    state.resizeDuringRun = true;
  }
}

new ResizeObserver(() => requestAnimationFrame(setBufferSize)).observe(
  elements.viewportFrame.parentElement,
);
requestAnimationFrame(setBufferSize);

document.addEventListener("visibilitychange", () => {
  if (state.running && document.hidden) state.invalidReasons.push("document-hidden");
});
window.addEventListener("blur", () => {
  if (state.running) state.invalidReasons.push("window-blur");
});

function formatMs(value) {
  return Number.isFinite(value) ? `${value.toFixed(2)} ms` : "-";
}

function setRunning(running) {
  state.running = running;
  elements.runSingle.disabled = running;
  elements.runMainBatch.disabled = running;
  elements.runAblationBatch.disabled = running;
  elements.runD1S2Pilot.disabled = running;
  elements.runD1S2PressureProbe.disabled = running;
  elements.runPiCalibration.disabled = running;
  elements.stopRun.disabled = !running;
  elements.method.disabled = running;
  elements.dataset.disabled = running;
  elements.scenario.disabled = running;
  elements.networkProfile.disabled = running;
  elements.deviceId.disabled = running;
}

function makeRunId(condition) {
  const device = String(condition.deviceId ?? "unregistered").replaceAll(/[^A-Za-z0-9._-]/g, "-");
  return [
    device,
    condition.dataset,
    condition.scenario,
    condition.method,
    `r${condition.repeat}`,
    Date.now().toString(36),
  ].join("-");
}

function conditionFromForm() {
  return {
    method: elements.method.value,
    dataset: elements.dataset.value,
    scenario: elements.scenario.value,
    repeat: Number(elements.repeat.value),
    seed: Number(elements.seed.value),
    networkProfile: elements.networkProfile.value,
    deviceId: elements.deviceId.value.trim() || "unregistered",
  };
}

async function unloadTileset() {
  state.detachTelemetry?.();
  state.detachTelemetry = null;
  state.qualityContext = null;
  if (state.tileset) {
    viewer.scene.primitives.remove(state.tileset);
    if (!state.tileset.isDestroyed()) state.tileset.destroy();
    state.tileset = null;
  }
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

async function loadTileset(condition, runId, telemetry) {
  await unloadTileset();
  performance.clearResourceTimings();
  performance.setResourceTimingBufferSize(20000);
  const networkProfile = condition.networkProfile ?? "lan";
  const assetPrefix = `/bench-assets/${runId}/${networkProfile}/${condition.dataset}/`;
  const options = tilesetOptionsForMethod(condition.method);
  const tileset = await Cesium.Cesium3DTileset.fromUrl(`${assetPrefix}tileset.json`, {
    maximumScreenSpaceError: options.maximumScreenSpaceError,
    dynamicScreenSpaceError: options.dynamicScreenSpaceError,
    preloadFlightDestinations: false,
    preloadWhenHidden: false,
  });
  tileset.maximumScreenSpaceError = options.maximumScreenSpaceError;
  tileset.dynamicScreenSpaceError = options.dynamicScreenSpaceError;
  state.tileset = viewer.scene.primitives.add(tileset);
  state.detachTelemetry = telemetry.attach(tileset);
  const sphere = tileset.boundingSphere;
  if (!sphere || !Number.isFinite(sphere.radius) || sphere.radius <= 0) {
    throw new Error("Tileset has no finite bounding sphere");
  }
  return { tileset, sphere, assetPrefix };
}

function applyCamera(sphere, frame) {
  viewer.camera.lookAt(
    sphere.center,
    new Cesium.HeadingPitchRange(
      frame.headingRad,
      frame.pitchRad,
      Math.max(1, sphere.radius * frame.rangeMultiplier),
    ),
  );
}

function updateLive(decision, p95, telemetry, phaseId, elapsedMs) {
  elements.metricP95.textContent = formatMs(p95);
  elements.metricPredicted.textContent = formatMs(decision.predictedFrameTimeP95Ms);
  elements.metricSse.textContent = String(decision.sse);
  elements.metricQueue.textContent = String(telemetry.requestQueue);
  elements.metricState.textContent = decision.state;
  elements.metricAction.textContent = decision.action;
  elements.hud.textContent = [
    `phase     ${phaseId}`,
    `elapsed   ${(elapsedMs / 1000).toFixed(1)} s`,
    `P95       ${formatMs(p95)}`,
    `predicted ${formatMs(decision.predictedFrameTimeP95Ms)}`,
    `SSE       ${decision.sse}`,
    `queue     ${telemetry.requestQueue}`,
    `state     ${decision.state}`,
    `action    ${decision.action}`,
  ].join("\n");
}

function runAnimation(durationMs, callback) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    let previous = start;
    const tick = (now) => {
      if (state.stopRequested) {
        reject(new DOMException("Benchmark stopped", "AbortError"));
        return;
      }
      const elapsed = Math.min(durationMs, now - start);
      callback({ now, elapsed, frameTimeMs: now - previous });
      previous = now;
      if (elapsed >= durationMs) {
        resolve();
      } else {
        state.activeRaf = requestAnimationFrame(tick);
      }
    };
    state.activeRaf = requestAnimationFrame(tick);
  });
}

async function measureBlankFrameWindow(windowMs) {
  const frameTimes = [];
  const startedAt = performance.now();
  await runAnimation(windowMs, ({ frameTimeMs }) => {
    frameTimes.push(frameTimeMs);
  });
  return {
    p95Ms: percentile(frameTimes, 0.95),
    durationMs: performance.now() - startedAt,
    sampleCount: frameTimes.length,
  };
}

async function waitForPreRunFrameReadiness() {
  await unloadTileset();
  const policy = smokeMode
    ? {
        windowMs: 250,
        requiredStableWindows: 2,
        p95ThresholdMs: 2000,
        timeoutMs: 2000,
      }
    : {
        windowMs: FROZEN_PROTOCOL.readinessWindowMs,
        requiredStableWindows: FROZEN_PROTOCOL.readinessRequiredStableWindows,
        p95ThresholdMs: FROZEN_PROTOCOL.readinessP95ThresholdMs,
        timeoutMs: FROZEN_PROTOCOL.readinessTimeoutMs,
      };
  return runFrameReadinessCheck({
    policy,
    measureWindow: measureBlankFrameWindow,
    onWindow: (window) => {
      elements.runState.textContent =
        `Readiness ${window.stableWindows}/${policy.requiredStableWindows}`;
      elements.metricP95.textContent = formatMs(window.p95Ms);
    },
  });
}

function summarizeStates(rows) {
  const counts = {};
  for (const row of rows) counts[row.controllerState] = (counts[row.controllerState] ?? 0) + 1;
  return counts;
}

function summaryRow(result) {
  return {
    runId: result.manifest.runId,
    method: result.manifest.method,
    dataset: result.manifest.dataset,
    scenario: result.manifest.scenario,
    repeat: result.manifest.repeat,
    seed: result.manifest.seed,
    deviceId: result.manifest.deviceId,
    networkProfile: result.manifest.networkProfile,
    studyPhase: result.manifest.studyPhase,
    pilotPurpose: result.manifest.pilotPurpose,
    valid: result.valid,
    invalidReasons: result.invalidReasons.join("|"),
    ...result.summary,
  };
}

async function postResult(result) {
  try {
    const response = await fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sanitizeForJson(result)),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForTilesSettled(telemetry, timeoutMs = 30000) {
  const startedAt = performance.now();
  let emptySince = null;
  while (performance.now() - startedAt < timeoutMs) {
    viewer.render();
    if (telemetry.tilesLoadedTotal > 0 && telemetry.pendingRequests + telemetry.processingTiles === 0) {
      if (emptySince === null) emptySince = performance.now();
      if (performance.now() - emptySince >= 1000) return true;
    } else {
      emptySince = null;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
}

async function waitForFirstTile(telemetry, timeoutMs = 15000) {
  const startedAt = performance.now();
  while (performance.now() - startedAt < timeoutMs) {
    viewer.render();
    if (telemetry.tilesLoadedTotal > 0) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
}

async function prepareQualityCapture(dataset, sse, viewIndex, settleTimeoutMs = 120000) {
  if (!DATASETS[dataset]) throw new Error(`Unknown dataset: ${dataset}`);
  if (![4, 6, 8, 12, 16, 24, 32, 48, 64].includes(Number(sse))) {
    throw new Error(`Unknown SSE calibration level: ${sse}`);
  }
  if (!Number.isInteger(viewIndex) || viewIndex < 0 || viewIndex >= 6) {
    throw new Error(`Invalid quality view: ${viewIndex}`);
  }
  if (!Number.isFinite(settleTimeoutMs) || settleTimeoutMs <= 0) {
    throw new Error("settleTimeoutMs must be a positive number");
  }
  let context = state.qualityContext;
  if (!context || context.dataset !== dataset || state.tileset !== context.loaded.tileset) {
    const telemetry = new TilesetTelemetry();
    const condition = {
      method: "fixed16",
      dataset,
      scenario: "steady",
      repeat: 1,
      seed: 20260823,
      networkProfile: "lan",
    };
    const runId = `quality-${dataset}-${Date.now().toString(36)}`;
    const loaded = await loadTileset(condition, runId, telemetry);
    context = { dataset, loaded, telemetry };
    state.qualityContext = context;
  }
  const { loaded, telemetry } = context;
  loaded.tileset.maximumScreenSpaceError = Number(sse);
  loaded.tileset.dynamicScreenSpaceError = false;
  const frame = {
    headingRad: (viewIndex / 6) * Math.PI * 2,
    pitchRad: ((-20 - (viewIndex % 3) * 8) * Math.PI) / 180,
    rangeMultiplier: 2.4,
  };
  applyCamera(loaded.sphere, frame);
  const settled = await waitForTilesSettled(telemetry, settleTimeoutMs);
  applyCamera(loaded.sphere, frame);
  setBufferSize();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  return {
    dataset,
    sse: Number(sse),
    viewIndex,
    settled,
    drawingBufferWidth: viewer.scene.context.drawingBufferWidth,
    drawingBufferHeight: viewer.scene.context.drawingBufferHeight,
    tilesLoadedTotal: telemetry.tilesLoadedTotal,
    pendingRequests: telemetry.pendingRequests,
    processingTiles: telemetry.processingTiles,
    tileFailureCount: telemetry.tileFailures.length,
  };
}

async function runCondition(condition) {
  condition = {
    ...condition,
    networkProfile: condition.networkProfile ?? elements.networkProfile.value,
    deviceId: condition.deviceId ?? (elements.deviceId.value.trim() || "unregistered"),
  };
  const runId = makeRunId(condition);
  const smokeWarmupMs = 500;
  const smokeMeasurementMs = 2500;
  const warmupMs = smokeMode ? smokeWarmupMs : FROZEN_PROTOCOL.warmupMs;
  const measurementMs = smokeMode ? smokeMeasurementMs : FROZEN_PROTOCOL.measurementMs;
  const manifest = {
    ...createRunManifest({
      ...condition,
      runId,
      deviceId: condition.deviceId,
      networkProfile: condition.networkProfile,
      browserVersion: navigator.userAgentData?.brands
        ?.map((brand) => `${brand.brand} ${brand.version}`)
        .join(", ") ?? navigator.userAgent,
      gpuRenderer: (() => {
        const gl = viewer.canvas.getContext("webgl2") ?? viewer.canvas.getContext("webgl");
        const extension = gl?.getExtension("WEBGL_debug_renderer_info");
        return extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : "unavailable";
      })(),
      methodParameters: condition.methodParameters ?? null,
      userAgent: navigator.userAgent,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemoryGb: navigator.deviceMemory,
      viewport: { width: innerWidth, height: innerHeight },
    }),
    smokeMode,
    actualWarmupMs: warmupMs,
    actualMeasurementMs: measurementMs,
  };
  const invalidReasons = [];
  state.invalidReasons = invalidReasons;
  state.resizeDuringRun = false;
  const telemetry = new TilesetTelemetry();
  let frameWindow = new FrameTimeWindow(FROZEN_PROTOCOL.windowMs ?? 2000);
  const controller = createMethodController(condition.method, {
    warmupMs: 0,
    ...(condition.methodParameters ?? {}),
  });
  const rows = [];
  const measurementFrames = [];
  let readiness = null;
  let lastControlMs = Number.NEGATIVE_INFINITY;
  let latestDecision = null;
  let loadStartedAt = performance.now();
  let loaded;

  elements.runState.textContent = "Loading";
  try {
    elements.runState.textContent = "Readiness";
    readiness = await waitForPreRunFrameReadiness();
    invalidReasons.push(...readinessInvalidReasons(readiness));
    elements.runState.textContent = "Loading";
    loaded = await loadTileset(condition, runId, telemetry);
    setBufferSize();
    loadStartedAt = performance.now();
    const initialFrame = condition.scenario === "steady"
      ? getScenarioFrame("steady", 0, condition.seed)
      : getScenarioFrame("burst", 0, condition.seed);
    applyCamera(loaded.sphere, initialFrame);
    const initialContentReady = await waitForFirstTile(
      telemetry,
      smokeMode ? 15000 : FROZEN_PROTOCOL.initialContentTimeoutMs,
    );
    if (!initialContentReady) invalidReasons.push("initial-content-timeout");
    elements.runState.textContent = "Running";

    loaded.tileset.maximumScreenSpaceError = 16;
    await runAnimation(warmupMs, ({ elapsed }) => {
      const warmupFrame = condition.scenario === "steady"
        ? getScenarioFrame("steady", (elapsed / warmupMs) * 40000, condition.seed)
        : getScenarioFrame("burst", 0, condition.seed);
      applyCamera(loaded.sphere, warmupFrame);
    });

    telemetry.snapshotInterval(performance.now());
    controller.reset?.();
    frameWindow = new FrameTimeWindow(FROZEN_PROTOCOL.windowMs ?? 2000);
    lastControlMs = 0;

    await runAnimation(measurementMs, ({ now, elapsed, frameTimeMs }) => {
      const measuredElapsed = elapsed;
      const scenarioFrame = getScenarioFrame(condition.scenario, measuredElapsed, condition.seed);
      applyCamera(loaded.sphere, scenarioFrame);
      frameWindow.push(measuredElapsed, frameTimeMs);
      measurementFrames.push(frameTimeMs);

      if (isControlWindowReady({
        elapsedMs: elapsed,
        lastControlMs,
        windowMs: FROZEN_PROTOCOL.windowMs,
        controlIntervalMs: FROZEN_PROTOCOL.controlIntervalMs,
      })) {
        lastControlMs = elapsed;
        const frameStats = frameWindow.summary();
        if (!Number.isFinite(frameStats.p95Ms)) return;
        const tileStats = telemetry.snapshotInterval(now);
        latestDecision = controller.update(buildControllerSample({
          elapsed,
          frameStats,
          tileStats,
          interacting: scenarioFrame.interacting,
        }));
        loaded.tileset.maximumScreenSpaceError = latestDecision.sse;
        updateLive(latestDecision, frameStats.p95Ms, tileStats, scenarioFrame.phaseId, elapsed);

        const width = viewer.scene.context.drawingBufferWidth;
        const height = viewer.scene.context.drawingBufferHeight;
        if (
          Math.abs(width - FROZEN_PROTOCOL.renderWidth) > FROZEN_PROTOCOL.drawingBufferTolerancePx ||
          Math.abs(height - FROZEN_PROTOCOL.renderHeight) > FROZEN_PROTOCOL.drawingBufferTolerancePx
        ) {
          invalidReasons.push(`drawing-buffer-${width}x${height}`);
        }
        rows.push({
          schemaVersion: 2,
          runId,
          elapsedMs: measuredElapsed,
          phaseId: scenarioFrame.phaseId,
          interacting: scenarioFrame.interacting,
          frameTimeMeanMs: frameStats.meanMs,
          frameTimeP95Ms: frameStats.p95Ms,
          frameTimeP99Ms: frameStats.p99Ms,
          predictedFrameTimeP95Ms: latestDecision.predictedFrameTimeP95Ms,
          levelFrameTimeP95Ms: latestDecision.levelFrameTimeP95Ms,
          pendingRequests: tileStats.pendingRequests,
          processingTiles: tileStats.processingTiles,
          requestQueue: tileStats.requestQueue,
          requestQueueEnd: tileStats.requestQueueEnd,
          loadProgressEventCount: tileStats.loadProgressEventCount,
          loadProgressEventsInterval: tileStats.loadProgressEventsInterval,
          requestPressureHigh: latestDecision.requestPressureHigh,
          tilesLoadedTotal: tileStats.tilesLoadedTotal,
          visibleTileEvents: tileStats.visibleTileEvents,
          visibleGeometricErrorMean: tileStats.visibleGeometricErrorMean,
          visibleGeometricErrorMax: tileStats.visibleGeometricErrorMax,
          sse: latestDecision.sse,
          controllerState: latestDecision.state,
          action: latestDecision.action,
          reason: latestDecision.reason,
          drawingBufferWidth: width,
          drawingBufferHeight: height,
        });
      }
    });

    if (state.resizeDuringRun) invalidReasons.push("drawing-buffer-resized");
    const resources = summarizeResourceEntries(
      performance.getEntriesByType("resource"),
      loaded.assetPrefix,
    );
    invalidReasons.push(
      ...validateRunEvidence({
        rowCount: rows.length,
        tilesLoadedTotal: telemetry.tilesLoadedTotal,
        resourceCount: resources.resourceCount,
        tileFailureCount: telemetry.tileFailures.length,
        drawingBufferWidth: viewer.scene.context.drawingBufferWidth,
        drawingBufferHeight: viewer.scene.context.drawingBufferHeight,
        drawingBufferTolerancePx: FROZEN_PROTOCOL.drawingBufferTolerancePx,
      }),
    );
    const summary = {
      ...summarizeRun(rows, { frameBudgetMs: FROZEN_PROTOCOL.frameBudgetMs }),
      ...summarizeForecast(rows, {
        frameBudgetMs: FROZEN_PROTOCOL.frameBudgetMs,
        horizonMs: 1000,
      }),
      rawFrameTimeP95Ms: percentile(measurementFrames, 0.95),
      rawFrameTimeP99Ms: percentile(measurementFrames, 0.99),
      frameBudgetViolationRate:
        measurementFrames.length > 0
          ? measurementFrames.filter((value) => value > FROZEN_PROTOCOL.frameBudgetMs).length /
            measurementFrames.length
          : null,
      preRunReadinessReady: readiness?.ready ?? false,
      preRunReadinessWaitMs: readiness?.waitMs ?? null,
      preRunReadinessP95Ms: readiness?.p95Ms ?? null,
      preRunReadinessCheckCount: readiness?.checkCount ?? 0,
      firstStableDisplayMs:
        telemetry.firstStableDisplayMs === null
          ? null
          : telemetry.firstStableDisplayMs - loadStartedAt,
      tilesLoadedTotal: telemetry.tilesLoadedTotal,
      loadProgressEventCount: telemetry.loadProgressEventCount,
      tileFailureCount: telemetry.tileFailures.length,
      stateWindowCounts: summarizeStates(rows),
      ...resources,
    };
    const result = sanitizeForJson({
      manifest,
      policy: controller.policy ?? { fixedSse: latestDecision?.sse ?? null },
      dataset: DATASETS[condition.dataset],
      readiness,
      valid: invalidReasons.length === 0,
      invalidReasons: [...new Set(invalidReasons)],
      summary,
      rows,
    });
    result.savedToServer = await postResult(result);
    state.lastResult = result;
    state.completedRuns.push(result);
    renderResults();
    return result;
  } finally {
    state.detachTelemetry?.();
    state.detachTelemetry = null;
  }
}

function renderResults() {
  elements.resultsBody.replaceChildren();
  for (const result of state.completedRuns.slice(-20).reverse()) {
    const row = document.createElement("tr");
    const cells = [
      result.manifest.method,
      result.manifest.dataset,
      result.manifest.scenario,
      result.manifest.studyPhase ?? "adHoc",
      Number.isFinite(result.summary.violationRate)
        ? `${(result.summary.violationRate * 100).toFixed(1)}%`
        : "-",
      result.valid ? "Yes" : "No",
    ];
    cells.forEach((value, index) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      if (index === 5) cell.className = result.valid ? "valid" : "invalid";
      row.append(cell);
    });
    elements.resultsBody.append(row);
  }
  const hasResults = state.completedRuns.length > 0;
  elements.downloadJson.disabled = !hasResults;
  elements.downloadCsv.disabled = !hasResults;
}

async function assertDatasetsReady(queue) {
  const response = await fetch("/api/health", { cache: "no-store" });
  if (!response.ok) throw new Error(`Dataset readiness check failed: HTTP ${response.status}`);
  const health = await response.json();
  const unavailable = unavailableDatasets(queue, health.datasets);
  if (unavailable.length > 0) {
    throw new Error(`Datasets are not ready: ${unavailable.join(", ")}`);
  }
}

async function runQueue(queue, options = {}) {
  if (state.running) return;
  const pending = queue.map((condition) => ({ ...condition }));
  setRunning(true);
  state.stopRequested = false;
  elements.progressBar.max = Math.max(1, pending.length);
  elements.progressBar.value = 0;
  try {
    if (options.requireReady) await assertDatasetsReady(pending);
    if (options.requirePiFrozen && PI_BASELINE_POLICY.parameterStatus !== "frozen") {
      throw new Error("PI baseline parameters are not frozen; complete PI calibration first");
    }
    for (let index = 0; index < pending.length; index += 1) {
      if (state.stopRequested) break;
      elements.runProgress.textContent = `${index + 1} / ${pending.length}`;
      const result = await runCondition(pending[index]);
      const retry = retryCondition(pending[index], result);
      if (retry) {
        pending.push(retry);
        elements.progressBar.max = pending.length;
      }
      elements.progressBar.value = index + 1;
      if (!smokeMode && index < pending.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    elements.runState.textContent = state.stopRequested ? "Stopped" : "Complete";
  } catch (error) {
    if (error?.name === "AbortError") {
      elements.runState.textContent = "Stopped";
    } else {
      elements.runState.textContent = "Failed";
      elements.hud.textContent = String(error?.stack ?? error);
    }
  } finally {
    setRunning(false);
    state.activeRaf = null;
  }
}

elements.runForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void runQueue([conditionFromForm()]);
});
elements.runMainBatch.addEventListener("click", () => {
  const queue = buildMainExperimentQueue({
    repeats: smokeMode ? 1 : FROZEN_PROTOCOL.defaultRepeats,
    primaryRepeats: smokeMode ? 1 : FROZEN_PROTOCOL.primaryRepeats,
    seed: Number(elements.seed.value),
  });
  void runQueue(queue, { requireReady: true, requirePiFrozen: true });
});
elements.runAblationBatch.addEventListener("click", () => {
  void runQueue(
    buildAblationQueue({
      repeats: smokeMode ? 1 : FROZEN_PROTOCOL.defaultRepeats,
      seed: Number(elements.seed.value),
    }),
    { requireReady: true },
  );
});
elements.runD1S2Pilot.addEventListener("click", () => {
  void runQueue(
    buildD1S2PilotQueue({
      repeats: smokeMode ? 1 : 4,
      seed: Number(elements.seed.value),
    }),
    { requireReady: true, requirePiFrozen: true },
  );
});
elements.runD1S2PressureProbe.addEventListener("click", () => {
  void runQueue(
    buildD1S2PressureProbeQueue({ seed: Number(elements.seed.value) }),
    { requireReady: true, requirePiFrozen: true },
  );
});
elements.runPiCalibration.addEventListener("click", () => {
  void runQueue(
    buildPiCalibrationQueue({
      repeats: smokeMode ? 1 : 4,
      seed: Number(elements.seed.value),
    }),
  );
});
elements.stopRun.addEventListener("click", () => {
  state.stopRequested = true;
  elements.runState.textContent = "Stopping";
});
elements.downloadJson.addEventListener("click", () => {
  downloadText(
    `lod-benchmark-${new Date().toISOString().replaceAll(":", "-")}.json`,
    `${JSON.stringify(sanitizeForJson(state.completedRuns), null, 2)}\n`,
    "application/json;charset=utf-8",
  );
});
elements.downloadCsv.addEventListener("click", () => {
  downloadText(
    `lod-benchmark-summary-${new Date().toISOString().replaceAll(":", "-")}.csv`,
    rowsToCsv(state.completedRuns.map(summaryRow)),
    "text/csv;charset=utf-8",
  );
});

window.__lodBenchmark = {
  getLastResult: () => state.lastResult,
  getResults: () => state.completedRuns,
  prepareQualityCapture,
  runCondition,
  buildD1S2PressureProbeQueue,
  buildD1S2PilotQueue,
  buildPiCalibrationQueue,
  viewer,
};

elements.hud.textContent = "Ready";
elements.runState.textContent = "Ready";

if (query.get("autorun") === "1") {
  void runQueue([conditionFromForm()]);
}
