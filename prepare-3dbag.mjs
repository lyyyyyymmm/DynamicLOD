import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildProvenanceRecord } from "./dataset-provenance.mjs";
import {
  boxCenter,
  collectContentUris,
  collectExternalTilesetNodes,
  combineBoxes,
  distance3,
  ecefFromDegrees,
  fetchWithRetry,
  mapConcurrent,
  selectChunkRecords,
} from "./dataset-prep-utils.mjs";

const DEFAULT_SOURCE = "https://data.3dbag.nl/v20250903/cesium3dtiles/lod12/tileset.json";
const DEFAULT_OUTPUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "datasets", "3dbag-amsterdam");

function argument(name, fallback) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

async function fetchChecked(url, options = {}) {
  return await fetchWithRetry(url, options, { attempts: 4, baseDelayMs: 500 });
}

async function fetchJson(url) {
  return await (await fetchChecked(url)).json();
}

function remoteRelativePath(url, rootBase) {
  const remote = new URL(url, rootBase);
  if (remote.origin !== rootBase.origin || !remote.pathname.startsWith(rootBase.pathname)) {
    throw new Error(`3DBAG asset escaped the frozen source root: ${remote.href}`);
  }
  return decodeURIComponent(remote.pathname.slice(rootBase.pathname.length));
}

function rewriteManifestUris(tile, manifestUrl, rootBase) {
  const manifestLocal = remoteRelativePath(manifestUrl, rootBase);
  const localDirectory = path.posix.dirname(manifestLocal);
  const rewrite = (content) => {
    const field = content?.uri ? "uri" : content?.url ? "url" : null;
    if (!field) return;
    const assetUrl = new URL(content[field], manifestUrl);
    const assetLocal = remoteRelativePath(assetUrl, rootBase);
    content[field] = path.posix.relative(localDirectory, assetLocal) || path.posix.basename(assetLocal);
  };
  if (tile.content) rewrite(tile.content);
  for (const content of tile.contents ?? []) rewrite(content);
  for (const child of tile.children ?? []) rewriteManifestUris(child, manifestUrl, rootBase);
}

async function contentLength(url) {
  const response = await fetchChecked(url, { method: "HEAD" });
  const length = Number(response.headers.get("content-length"));
  if (!Number.isFinite(length) || length < 0) throw new Error(`Missing Content-Length: ${url}`);
  return length;
}

async function inventoryChunk(child, sourceUrl, targetEcef) {
  const manifestUri = child?.content?.uri ?? child?.content?.url;
  if (!manifestUri || !String(manifestUri).toLowerCase().endsWith(".json")) return null;
  const manifestUrl = new URL(manifestUri, sourceUrl);
  const manifestResponse = await fetchChecked(manifestUrl);
  const manifestText = await manifestResponse.text();
  const manifest = JSON.parse(manifestText);
  const uris = collectContentUris(manifest.root)
    .filter((uri) => !uri.toLowerCase().endsWith(".json"));
  const sizes = await mapConcurrent(
    uris,
    8,
    async (uri) => await contentLength(new URL(uri, manifestUrl)),
  );
  const bytes = Buffer.byteLength(manifestText) + sizes.reduce((sum, value) => sum + value, 0);
  return {
    uri: String(manifestUri),
    child,
    manifest,
    manifestText,
    manifestUrl,
    bytes,
    contentCount: uris.length,
    distance: distance3(boxCenter(child.boundingVolume), targetEcef),
  };
}

async function writeRemoteAsset(url, rootBase, outputRoot) {
  const relative = remoteRelativePath(url, rootBase);
  const output = path.join(outputRoot, ...relative.split("/"));
  await fs.mkdir(path.dirname(output), { recursive: true });
  const bytes = Buffer.from(await (await fetchChecked(url)).arrayBuffer());
  await fs.writeFile(output, bytes);
}

async function mirrorChunk(record, rootBase, outputRoot) {
  const manifest = structuredClone(record.manifest);
  const originalUris = collectContentUris(manifest.root)
    .filter((uri) => !uri.toLowerCase().endsWith(".json"));
  rewriteManifestUris(manifest.root, record.manifestUrl, rootBase);
  const manifestRelative = remoteRelativePath(record.manifestUrl, rootBase);
  const manifestOutput = path.join(outputRoot, ...manifestRelative.split("/"));
  await fs.mkdir(path.dirname(manifestOutput), { recursive: true });
  await fs.writeFile(manifestOutput, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await mapConcurrent(
    originalUris,
    6,
    async (uri) => await writeRemoteAsset(new URL(uri, record.manifestUrl), rootBase, outputRoot),
  );
}

export async function prepare3dBag(options = {}) {
  const sourceUrl = new URL(options.sourceUrl ?? DEFAULT_SOURCE);
  const rootBase = new URL("./", sourceUrl);
  const outputRoot = path.resolve(options.outputRoot ?? DEFAULT_OUTPUT);
  const targetBytes = Math.round((options.targetMb ?? 180) * 1024 * 1024);
  const maxBytes = Math.round((options.maxMb ?? 250) * 1024 * 1024);
  const minContents = options.minContents ?? 200;
  const longitude = Number(options.longitude ?? 4.8936);
  const latitude = Number(options.latitude ?? 52.3731);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    throw new Error("longitude and latitude must be finite numbers");
  }
  const datasetId = String(options.datasetId ?? "bagAmsterdam");
  const sourceVersion = String(options.sourceVersion ?? "v20250903");
  const license = String(options.license ?? "CC-BY-4.0");
  const targetEcef = ecefFromDegrees(longitude, latitude);
  const sourceTileset = await fetchJson(sourceUrl);
  const children = collectExternalTilesetNodes(sourceTileset.root);
  const inventory = [];
  const orderedChildren = [...children].sort((left, right) =>
    distance3(boxCenter(left.boundingVolume), targetEcef) -
    distance3(boxCenter(right.boundingVolume), targetEcef));
  for (const child of orderedChildren) {
    const record = await inventoryChunk(child, sourceUrl, targetEcef);
    if (record) inventory.push(record);
    const bytes = inventory.reduce((sum, item) => sum + item.bytes, 0);
    const contents = inventory.reduce((sum, item) => sum + item.contentCount, 0);
    if (bytes >= targetBytes && contents >= minContents) break;
  }
  const selected = selectChunkRecords(inventory, { targetBytes, maxBytes, minContents });
  await fs.mkdir(outputRoot, { recursive: true });
  for (const record of selected) await mirrorChunk(record, rootBase, outputRoot);
  const boxes = selected.map((record) => record.child.boundingVolume.box);
  if (boxes.some((box) => !Array.isArray(box))) throw new Error("Selected 3DBAG chunks must use box volumes");
  const localTileset = {
    asset: sourceTileset.asset,
    geometricError: Number(sourceTileset.geometricError),
    root: {
      boundingVolume: { box: combineBoxes(boxes) },
      geometricError: Number(sourceTileset.root.geometricError),
      refine: "REPLACE",
      children: selected.map((record) => record.child),
    },
  };
  await fs.writeFile(path.join(outputRoot, "tileset.json"), `${JSON.stringify(localTileset, null, 2)}\n`, "utf8");
  const provenance = await buildProvenanceRecord(outputRoot, {
    datasetId,
    sourceUrl: sourceUrl.href,
    sourceVersion,
    license,
    accessRoute: "publicRepository",
  });
  await fs.writeFile(path.join(outputRoot, "provenance.json"), `${JSON.stringify(provenance, null, 2)}\n`, "utf8");
  return { outputRoot, selectedChunks: selected.length, contentCount: selected.reduce((sum, item) => sum + item.contentCount, 0) };
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  const result = await prepare3dBag({
    sourceUrl: argument("source", DEFAULT_SOURCE),
    outputRoot: argument("output", DEFAULT_OUTPUT),
    targetMb: Number(argument("target-mb", 180)),
    maxMb: Number(argument("max-mb", 250)),
    minContents: Number(argument("min-contents", 200)),
    longitude: Number(argument("longitude", 4.8936)),
    latitude: Number(argument("latitude", 52.3731)),
    datasetId: argument("dataset-id", "bagAmsterdam"),
    sourceVersion: argument("source-version", "v20250903"),
    license: argument("license", "CC-BY-4.0"),
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
