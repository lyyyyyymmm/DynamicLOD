export function boxCenter(boundingVolume) {
  if (Array.isArray(boundingVolume?.box) && boundingVolume.box.length === 12) {
    return boundingVolume.box.slice(0, 3).map(Number);
  }
  if (Array.isArray(boundingVolume?.sphere) && boundingVolume.sphere.length === 4) {
    return boundingVolume.sphere.slice(0, 3).map(Number);
  }
  throw new Error("Expected a 3D Tiles box or sphere bounding volume");
}

export function collectContentUris(tile) {
  const uris = [];
  const visit = (node) => {
    const single = node?.content?.uri ?? node?.content?.url;
    if (single) uris.push(String(single));
    for (const content of node?.contents ?? []) {
      const uri = content?.uri ?? content?.url;
      if (uri) uris.push(String(uri));
    }
    for (const child of node?.children ?? []) visit(child);
  };
  visit(tile);
  return uris;
}

export function collectExternalTilesetNodes(tile) {
  const nodes = [];
  const visit = (node) => {
    const uri = node?.content?.uri ?? node?.content?.url;
    if (uri && String(uri).toLowerCase().endsWith(".json")) nodes.push(node);
    for (const child of node?.children ?? []) visit(child);
  };
  visit(tile);
  return nodes;
}

function boxCorners(box) {
  const center = box.slice(0, 3);
  const axes = [box.slice(3, 6), box.slice(6, 9), box.slice(9, 12)];
  const corners = [];
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        corners.push(center.map((value, index) =>
          value + sx * axes[0][index] + sy * axes[1][index] + sz * axes[2][index]));
      }
    }
  }
  return corners;
}

export function combineBoxes(boxes) {
  if (!Array.isArray(boxes) || boxes.length === 0) throw new Error("At least one box is required");
  const corners = boxes.flatMap(boxCorners);
  const minimum = [0, 1, 2].map((index) => Math.min(...corners.map((point) => point[index])));
  const maximum = [0, 1, 2].map((index) => Math.max(...corners.map((point) => point[index])));
  const center = minimum.map((value, index) => (value + maximum[index]) / 2);
  const half = minimum.map((value, index) => (maximum[index] - value) / 2);
  return [center[0], center[1], center[2], half[0], 0, 0, 0, half[1], 0, 0, 0, half[2]];
}

export function selectChunkRecords(records, options) {
  const targetBytes = Number(options.targetBytes);
  const maxBytes = Number(options.maxBytes);
  const minContents = Number(options.minContents);
  const ordered = [...records].sort((left, right) =>
    left.distance - right.distance || String(left.uri).localeCompare(String(right.uri)));
  const selected = [];
  let bytes = 0;
  let contents = 0;
  for (const record of ordered) {
    if (bytes >= targetBytes && contents >= minContents) break;
    if (selected.length > 0 && bytes + record.bytes > maxBytes) continue;
    selected.push(record);
    bytes += record.bytes;
    contents += record.contentCount;
  }
  if (bytes < targetBytes || contents < minContents) {
    throw new Error(`Unable to reach subset target within ${maxBytes} bytes`);
  }
  return selected;
}

export function ecefFromDegrees(longitudeDeg, latitudeDeg, height = 0) {
  const longitude = longitudeDeg * Math.PI / 180;
  const latitude = latitudeDeg * Math.PI / 180;
  const semiMajor = 6378137;
  const eccentricitySquared = 6.69437999014e-3;
  const normal = semiMajor / Math.sqrt(1 - eccentricitySquared * Math.sin(latitude) ** 2);
  return [
    (normal + height) * Math.cos(latitude) * Math.cos(longitude),
    (normal + height) * Math.cos(latitude) * Math.sin(longitude),
    (normal * (1 - eccentricitySquared) + height) * Math.sin(latitude),
  ];
}

export function distance3(left, right) {
  return Math.hypot(left[0] - right[0], left[1] - right[1], left[2] - right[2]);
}

export async function fetchWithRetry(url, options = {}, retry = {}) {
  const attempts = Math.max(1, Number(retry.attempts ?? 4));
  const baseDelayMs = Math.max(0, Number(retry.baseDelayMs ?? 300));
  const fetchImpl = retry.fetchImpl ?? fetch;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, options);
      if (response.ok) return response;
      const error = new Error(`${response.status} ${response.statusText}: ${url}`);
      if (response.status < 500 && response.status !== 429) throw error;
      lastError = error;
    } catch (error) {
      lastError = error;
      if (attempt === attempts) throw error;
    }
    if (baseDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * attempt));
    }
  }
  throw lastError;
}

export async function mapConcurrent(values, concurrency, mapper) {
  const items = [...values];
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(Math.max(1, Number(concurrency) || 1), items.length) },
    async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        results[index] = await mapper(items[index], index);
      }
    },
  );
  await Promise.all(workers);
  return results;
}
