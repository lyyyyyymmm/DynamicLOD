import path from "node:path";

export function sanitizeRunId(runId) {
  const value = String(runId ?? "");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value) || value.includes("..")) {
    throw new Error("Invalid runId");
  }
  return value;
}

export function parseBenchmarkAssetPath(pathname) {
  const value = String(pathname);
  const versioned = value.match(
    /^\/bench-assets\/([^/]+)\/(lan|delay40|delay80)\/([^/]+)\/(.+)$/,
  );
  if (versioned) {
    return {
      runId: sanitizeRunId(decodeURIComponent(versioned[1])),
      networkProfile: versioned[2],
      dataset: decodeURIComponent(versioned[3]),
      relativePath: decodeURIComponent(versioned[4]),
    };
  }
  const legacy = value.match(/^\/bench-assets\/([^/]+)\/([^/]+)\/(.+)$/);
  if (!legacy) return null;
  return {
    runId: sanitizeRunId(decodeURIComponent(legacy[1])),
    networkProfile: "lan",
    dataset: decodeURIComponent(legacy[2]),
    relativePath: decodeURIComponent(legacy[3]),
  };
}

export function networkDelayMs(profile, dataset) {
  const delays = { lan: 0, delay40: 40, delay80: 80 };
  if (!Object.hasOwn(delays, profile)) throw new Error(`Unknown network profile: ${profile}`);
  if (profile !== "lan" && !["calibration", "diagnostic"].includes(dataset?.studyRole)) {
    throw new Error("Artificial delay is only allowed for calibration or diagnostic datasets");
  }
  return delays[profile];
}

export function resolveInside(root, relativePath) {
  const resolvedRoot = path.resolve(root);
  const resolvedPath = path.resolve(resolvedRoot, relativePath);
  if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error("Resolved path is outside allowed root");
  }
  return resolvedPath;
}
