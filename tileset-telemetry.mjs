export class TilesetTelemetry {
  constructor() {
    this.pendingRequests = 0;
    this.processingTiles = 0;
    this.requestQueuePeakInterval = 0;
    this.loadProgressEventCount = 0;
    this.loadProgressEventsInterval = 0;
    this.tilesLoadedTotal = 0;
    this.tileFailures = [];
    this.firstTileLoadMs = null;
    this.queueEmptySinceMs = null;
    this.firstStableDisplayMs = null;
    this.visibleGeometricErrors = [];
    this.loadProgressEvents = [];
    this.tileLoadEvents = [];
  }

  recordLoadProgress(pendingRequests, processingTiles, timestampMs = performance.now()) {
    this.pendingRequests = Number.isFinite(pendingRequests) ? Number(pendingRequests) : 0;
    this.processingTiles = Number.isFinite(processingTiles) ? Number(processingTiles) : 0;
    const requestQueue = this.pendingRequests + this.processingTiles;
    this.requestQueuePeakInterval = Math.max(this.requestQueuePeakInterval, requestQueue);
    this.loadProgressEventCount += 1;
    this.loadProgressEventsInterval += 1;
    this.loadProgressEvents.push({
      timestampMs,
      pendingRequests: this.pendingRequests,
      processingTiles: this.processingTiles,
      requestQueue,
    });
    if (requestQueue === 0) {
      if (this.queueEmptySinceMs === null) this.queueEmptySinceMs = timestampMs;
    } else {
      this.queueEmptySinceMs = null;
    }
  }

  recordTileLoad(tile, timestampMs = performance.now()) {
    this.tilesLoadedTotal += 1;
    if (this.firstTileLoadMs === null) this.firstTileLoadMs = timestampMs;
    if (tile && Number.isFinite(tile.geometricError)) {
      this.lastLoadedGeometricError = Number(tile.geometricError);
    }
    this.tileLoadEvents.push({
      timestampMs,
      geometricError: tile && Number.isFinite(tile.geometricError)
        ? Number(tile.geometricError)
        : null,
    });
  }

  recordTileVisible(tile) {
    if (tile && Number.isFinite(tile.geometricError)) {
      this.visibleGeometricErrors.push(Number(tile.geometricError));
    }
  }

  recordTileFailure(error) {
    this.tileFailures.push(String(error?.message ?? error ?? "unknown tile failure"));
  }

  updateFirstStableDisplay(timestampMs = performance.now()) {
    if (
      this.firstStableDisplayMs === null &&
      this.firstTileLoadMs !== null &&
      this.queueEmptySinceMs !== null &&
      timestampMs - this.queueEmptySinceMs >= 1000
    ) {
      this.firstStableDisplayMs = timestampMs;
    }
    return this.firstStableDisplayMs;
  }

  snapshotInterval(timestampMs = performance.now()) {
    this.updateFirstStableDisplay(timestampMs);
    const errors = this.visibleGeometricErrors;
    const visibleGeometricErrorMean =
      errors.length > 0
        ? errors.reduce((sum, value) => sum + value, 0) / errors.length
        : null;
    const requestQueueEnd = this.pendingRequests + this.processingTiles;
    const snapshot = {
      pendingRequests: this.pendingRequests,
      processingTiles: this.processingTiles,
      requestQueue: this.requestQueuePeakInterval,
      requestQueueEnd,
      loadProgressEventCount: this.loadProgressEventCount,
      loadProgressEventsInterval: this.loadProgressEventsInterval,
      tilesLoadedTotal: this.tilesLoadedTotal,
      tileFailureCount: this.tileFailures.length,
      visibleTileEvents: errors.length,
      visibleGeometricErrorMean,
      visibleGeometricErrorMax: errors.length > 0 ? Math.max(...errors) : null,
      firstStableDisplayMs: this.firstStableDisplayMs,
    };
    this.visibleGeometricErrors = [];
    this.requestQueuePeakInterval = requestQueueEnd;
    this.loadProgressEventsInterval = 0;
    return snapshot;
  }

  attach(tileset, now = () => performance.now()) {
    const onProgress = (pending, processing) =>
      this.recordLoadProgress(pending, processing, now());
    const onLoad = (tile) => this.recordTileLoad(tile, now());
    const onVisible = (tile) => this.recordTileVisible(tile);
    const onFailed = (error) => this.recordTileFailure(error);
    tileset.loadProgress.addEventListener(onProgress);
    tileset.tileLoad.addEventListener(onLoad);
    tileset.tileVisible.addEventListener(onVisible);
    tileset.tileFailed.addEventListener(onFailed);
    return () => {
      tileset.loadProgress.removeEventListener(onProgress);
      tileset.tileLoad.removeEventListener(onLoad);
      tileset.tileVisible.removeEventListener(onVisible);
      tileset.tileFailed.removeEventListener(onFailed);
    };
  }
}

export function summarizeResourceEntries(entries, pathPrefix) {
  const matching = entries.filter((entry) => String(entry.name ?? "").includes(pathPrefix));
  return {
    resourceCount: matching.length,
    transferBytes: matching.reduce(
      (sum, entry) => sum + (Number.isFinite(entry.transferSize) ? entry.transferSize : 0),
      0,
    ),
    encodedBodyBytes: matching.reduce(
      (sum, entry) => sum + (Number.isFinite(entry.encodedBodySize) ? entry.encodedBodySize : 0),
      0,
    ),
  };
}

function finiteOrZero(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function eventBinStart(timestampMs, originMs, binMs) {
  return Math.floor((timestampMs - originMs) / binMs) * binMs;
}

function summarizeEventBins(events, binMs, summarizeEvent) {
  const validEvents = events
    .map((event) => ({ ...event, timestampMs: Number(event.timestampMs) }))
    .filter((event) => Number.isFinite(event.timestampMs));
  if (validEvents.length === 0) return { binMs, originMs: null, bins: [] };
  const originMs = Math.min(...validEvents.map((event) => event.timestampMs));
  const bins = new Map();
  for (const event of validEvents) {
    const startMs = eventBinStart(event.timestampMs, originMs, binMs);
    const key = String(startMs);
    if (!bins.has(key)) {
      bins.set(key, {
        startMs,
        endMs: startMs + binMs,
        eventCount: 0,
      });
    }
    const bin = bins.get(key);
    bin.eventCount += 1;
    summarizeEvent?.(bin, event);
  }
  return {
    binMs,
    originMs,
    bins: [...bins.values()].sort((left, right) => left.startMs - right.startMs),
  };
}

export function summarizeResourceCompletionBins(entries, pathPrefix, binMs) {
  const matching = entries
    .filter((entry) => String(entry.name ?? "").includes(pathPrefix))
    .map((entry) => {
      const startTime = Number(entry.startTime);
      const responseEnd = Number(entry.responseEnd);
      return {
        timestampMs: Number.isFinite(responseEnd) && responseEnd > 0 ? responseEnd : startTime,
        transferSize: finiteOrZero(entry.transferSize),
        encodedBodySize: finiteOrZero(entry.encodedBodySize),
      };
    });
  return summarizeEventBins(matching, binMs, (bin, event) => {
    bin.transferBytes = finiteOrZero(bin.transferBytes) + event.transferSize;
    bin.encodedBodyBytes = finiteOrZero(bin.encodedBodyBytes) + event.encodedBodySize;
  });
}

function maxFromBins(summary, key) {
  if (!summary.bins.length) return 0;
  return Math.max(...summary.bins.map((bin) => finiteOrZero(bin[key])));
}

export function summarizeStreamingTemporalStructure({
  resourceEntries,
  pathPrefix,
  tileLoadEvents,
  loadProgressEvents,
  binSizesMs = [100, 250, 500],
}) {
  const summaries = {};
  const metrics = {};
  for (const binMs of binSizesMs) {
    const suffix = `${binMs}Ms`;
    const resourceSummary = summarizeResourceCompletionBins(resourceEntries, pathPrefix, binMs);
    const tileLoadSummary = summarizeEventBins(tileLoadEvents, binMs);
    const loadProgressSummary = summarizeEventBins(loadProgressEvents, binMs, (bin, event) => {
      bin.requestQueuePeak = Math.max(
        finiteOrZero(bin.requestQueuePeak),
        finiteOrZero(event.requestQueue),
      );
    });

    summaries[`resourceCompletionBins${suffix}`] = resourceSummary;
    summaries[`tileLoadBins${suffix}`] = tileLoadSummary;
    summaries[`loadProgressBins${suffix}`] = loadProgressSummary;

    metrics[`resourceCompletionPeak${suffix}`] = maxFromBins(resourceSummary, "eventCount");
    metrics[`resourceCompletionTransferBytesPeak${suffix}`] =
      maxFromBins(resourceSummary, "transferBytes");
    metrics[`tileLoadPeak${suffix}`] = maxFromBins(tileLoadSummary, "eventCount");
    metrics[`loadProgressEventPeak${suffix}`] = maxFromBins(loadProgressSummary, "eventCount");
    metrics[`loadProgressQueuePeak${suffix}`] =
      maxFromBins(loadProgressSummary, "requestQueuePeak");
  }
  return { summaries, metrics };
}
