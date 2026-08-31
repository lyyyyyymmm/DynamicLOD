export function buildControllerSample({ elapsed, frameStats, tileStats, interacting }) {
  return {
    timestampMs: elapsed,
    frameTimeP95Ms: frameStats.p95Ms,
    pendingRequests: tileStats.pendingRequests,
    processingTiles: tileStats.processingTiles,
    requestQueue: tileStats.requestQueue,
    interacting,
  };
}
