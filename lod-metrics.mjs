function finiteValues(values) {
  return values.filter(Number.isFinite).map(Number).sort((a, b) => a - b);
}

export function percentile(values, probability) {
  const sorted = finiteValues(values);
  if (sorted.length === 0) return null;
  if (sorted.length === 1) return sorted[0];
  const p = Math.min(1, Math.max(0, probability));
  const position = (sorted.length - 1) * p;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  const fraction = position - lower;
  return sorted[lower] + (sorted[upper] - sorted[lower]) * fraction;
}

export function assertFiniteTelemetry(row) {
  const requiredFinite = ["frameTimeP95Ms", "sse"];
  for (const key of requiredFinite) {
    if (!Number.isFinite(row[key])) {
      throw new TypeError(`Telemetry field ${key} must be finite`);
    }
  }
  return row;
}

function rowWeights(rows) {
  if (rows.length === 0) return [];
  if (rows.length === 1) return [1];
  return rows.map((row, index) => {
    if (index < rows.length - 1) {
      return Math.max(0, rows[index + 1].elapsedMs - row.elapsedMs);
    }
    return Math.max(0, row.elapsedMs - rows[index - 1].elapsedMs);
  });
}

function weightedMean(rows, weights, field) {
  let numerator = 0;
  let denominator = 0;
  rows.forEach((row, index) => {
    if (!Number.isFinite(row[field]) || weights[index] <= 0) return;
    numerator += row[field] * weights[index];
    denominator += weights[index];
  });
  return denominator > 0 ? numerator / denominator : null;
}

function countSwitches(rows) {
  let switches = 0;
  let reversals = 0;
  let previousSse = null;
  let previousDirection = 0;
  for (const row of rows) {
    if (!Number.isFinite(row.sse)) continue;
    if (previousSse !== null && row.sse !== previousSse) {
      switches += 1;
      const direction = Math.sign(row.sse - previousSse);
      if (previousDirection !== 0 && direction !== previousDirection) reversals += 1;
      previousDirection = direction;
    }
    previousSse = row.sse;
  }
  return { switches, reversals };
}

export function summarizeRun(rows, options = {}) {
  const frameBudgetMs = options.frameBudgetMs ?? 1000 / 30;
  const validRows = rows.filter(
    (row) => Number.isFinite(row.elapsedMs) && Number.isFinite(row.frameTimeP95Ms),
  );
  const weights = rowWeights(validRows);
  const violations = validRows.filter((row) => row.frameTimeP95Ms > frameBudgetMs);
  const requestQueue = validRows.map((row) => Number(row.requestQueue ?? 0));
  const requestQueueAuc = validRows.reduce(
    (sum, row, index) => sum + Math.max(0, Number(row.requestQueue ?? 0)) * weights[index],
    0,
  );
  const { switches, reversals } = countSwitches(validRows);
  const durationMs = weights.reduce((sum, value) => sum + value, 0);

  return {
    validWindowCount: validRows.length,
    violationWindowCount: violations.length,
    violationRate: validRows.length > 0 ? violations.length / validRows.length : null,
    frameTimeP95Ms: percentile(validRows.map((row) => row.frameTimeP95Ms), 0.95),
    frameTimeP99Ms: percentile(validRows.map((row) => row.frameTimeP95Ms), 0.99),
    timeWeightedMeanSse: weightedMean(validRows, weights, "sse"),
    requestQueuePeak: requestQueue.length > 0 ? Math.max(...requestQueue) : null,
    requestQueueAuc,
    switchCount: switches,
    reversalCount: reversals,
    switchesPerMinute: durationMs > 0 ? switches / (durationMs / 60000) : null,
  };
}

export function summarizeForecast(rows, options = {}) {
  const horizonMs = options.horizonMs ?? 1000;
  const frameBudgetMs = options.frameBudgetMs ?? 1000 / 30;
  const pairs = [];
  for (const row of rows) {
    if (
      !Number.isFinite(row.elapsedMs) ||
      !Number.isFinite(row.frameTimeP95Ms) ||
      !Number.isFinite(row.predictedFrameTimeP95Ms)
    ) continue;
    const future = rows.filter((candidate) =>
      Number.isFinite(candidate.elapsedMs) &&
      Number.isFinite(candidate.frameTimeP95Ms) &&
      candidate.elapsedMs > row.elapsedMs &&
      candidate.elapsedMs <= row.elapsedMs + horizonMs);
    if (future.length === 0) continue;
    const actualFutureP95Ms = Math.max(...future.map((candidate) => candidate.frameTimeP95Ms));
    const firstViolation = future.find((candidate) => candidate.frameTimeP95Ms > frameBudgetMs);
    pairs.push({
      predictionError: Math.abs(row.predictedFrameTimeP95Ms - actualFutureP95Ms),
      persistenceError: Math.abs(row.frameTimeP95Ms - actualFutureP95Ms),
      predictedViolation: row.predictedFrameTimeP95Ms > frameBudgetMs,
      actualViolation: actualFutureP95Ms > frameBudgetMs,
      warningLeadMs: firstViolation ? firstViolation.elapsedMs - row.elapsedMs : null,
    });
  }
  const truePositive = pairs.filter((pair) => pair.predictedViolation && pair.actualViolation);
  const falsePositive = pairs.filter((pair) => pair.predictedViolation && !pair.actualViolation);
  const falseNegative = pairs.filter((pair) => !pair.predictedViolation && pair.actualViolation);
  const precisionDenominator = truePositive.length + falsePositive.length;
  const recallDenominator = truePositive.length + falseNegative.length;
  const precision = precisionDenominator > 0 ? truePositive.length / precisionDenominator : null;
  const recall = recallDenominator > 0 ? truePositive.length / recallDenominator : null;
  const leads = truePositive.map((pair) => pair.warningLeadMs).filter(Number.isFinite);
  return {
    forecastPairCount: pairs.length,
    predictionMaeMs: pairs.length > 0
      ? pairs.reduce((sum, pair) => sum + pair.predictionError, 0) / pairs.length
      : null,
    persistenceMaeMs: pairs.length > 0
      ? pairs.reduce((sum, pair) => sum + pair.persistenceError, 0) / pairs.length
      : null,
    violationPrecision: precision,
    violationRecall: recall,
    violationF1: precision !== null && recall !== null && precision + recall > 0
      ? 2 * precision * recall / (precision + recall)
      : null,
    meanWarningLeadMs: leads.length > 0
      ? leads.reduce((sum, value) => sum + value, 0) / leads.length
      : null,
  };
}

export function validateRunEvidence(evidence) {
  const reasons = [];
  const drawingBufferTolerancePx = Number.isFinite(evidence.drawingBufferTolerancePx)
    ? Math.max(0, evidence.drawingBufferTolerancePx)
    : 0;
  if (!Number.isFinite(evidence.rowCount) || evidence.rowCount <= 0) {
    reasons.push("no-valid-windows");
  }
  if (!Number.isFinite(evidence.tilesLoadedTotal) || evidence.tilesLoadedTotal <= 0) {
    reasons.push("no-tile-content");
  }
  if (!Number.isFinite(evidence.resourceCount) || evidence.resourceCount <= 1) {
    reasons.push("no-tile-resource-timing");
  }
  if (Number(evidence.tileFailureCount) > 0) reasons.push("tile-failure");
  if (
    Math.abs(evidence.drawingBufferWidth - 960) > drawingBufferTolerancePx ||
    Math.abs(evidence.drawingBufferHeight - 540) > drawingBufferTolerancePx
  ) {
    reasons.push(`drawing-buffer-${evidence.drawingBufferWidth}x${evidence.drawingBufferHeight}`);
  }
  return reasons;
}

export class FrameTimeWindow {
  constructor(windowMs = 2000) {
    this.windowMs = windowMs;
    this.samples = [];
  }

  push(timestampMs, frameTimeMs) {
    if (!Number.isFinite(timestampMs) || !Number.isFinite(frameTimeMs)) return;
    this.samples.push({ timestampMs, frameTimeMs });
    const cutoff = timestampMs - this.windowMs;
    while (this.samples.length > 0 && this.samples[0].timestampMs < cutoff) {
      this.samples.shift();
    }
  }

  values() {
    return this.samples.map((sample) => sample.frameTimeMs);
  }

  summary() {
    const values = this.values();
    return {
      count: values.length,
      meanMs:
        values.length > 0
          ? values.reduce((sum, value) => sum + value, 0) / values.length
          : null,
      p95Ms: percentile(values, 0.95),
      p99Ms: percentile(values, 0.99),
    };
  }
}
