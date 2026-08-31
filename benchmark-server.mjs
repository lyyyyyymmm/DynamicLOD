import fs from "node:fs";
import fsPromises from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DATASETS, FROZEN_PROTOCOL } from "./experiment-config.mjs";
import { inspectDatasetReadiness } from "./dataset-provenance.mjs";
import {
  networkDelayMs,
  parseBenchmarkAssetPath,
  resolveInside,
  sanitizeRunId,
} from "./benchmark-server-utils.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APPS_ROOT = path.resolve(HERE, "..");
const CESIUM_ROOT = path.resolve(APPS_ROOT, "..");
const RESULTS_ROOT = path.join(HERE, "results", "incoming");
const PUBLIC_STRESS_CONTENT = path.join(
  APPS_ROOT,
  "SampleData",
  "models",
  "TilesetWithDiscreteLOD",
  "dragon_low.b3dm",
);

const MIME_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".b3dm", "application/octet-stream"],
  [".cmpt", "application/octet-stream"],
  [".glb", "model/gltf-binary"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
  [".woff2", "font/woff2"],
]);

function jsonResponse(response, status, value) {
  const body = `${JSON.stringify(value, null, 2)}\n`;
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  });
  response.end(body);
}

function localAddresses(port) {
  const urls = [];
  for (const values of Object.values(os.networkInterfaces())) {
    for (const item of values ?? []) {
      if (item.family === "IPv4" && !item.internal) {
        urls.push(`http://${item.address}:${port}/Apps/learnMapmost/lod-benchmark.html`);
      }
    }
  }
  return urls;
}

function datasetRoot(dataset) {
  const config = DATASETS[dataset];
  if (!config) return null;
  return path.dirname(resolveInside(APPS_ROOT, config.path));
}

let statusCache = null;

async function datasetStatuses() {
  if (statusCache) return await statusCache;
  statusCache = (async () => {
  const statuses = {};
  for (const [id, config] of Object.entries(DATASETS)) {
    const root = datasetRoot(id);
    if (["main", "externalValidation"].includes(config.studyRole)) {
      statuses[id] = await inspectDatasetReadiness(root, config);
    } else {
      try {
        const stat = await fsPromises.stat(resolveInside(APPS_ROOT, config.path));
        statuses[id] = { ready: stat.isFile(), errors: stat.isFile() ? [] : ["tileset-not-file"] };
      } catch (error) {
        statuses[id] = { ready: false, errors: [`tileset-unavailable:${error.code ?? "invalid"}`] };
      }
    }
  }
  return statuses;
  })();
  try {
    return await statusCache;
  } catch (error) {
    statusCache = null;
    throw error;
  }
}

function resolveBenchmarkFile(route) {
  sanitizeRunId(route.runId);
  const root = datasetRoot(route.dataset);
  if (!root) throw new Error(`Unknown dataset: ${route.dataset}`);
  if (route.dataset === "publicStress" && route.relativePath === "tile-content.b3dm") {
    return PUBLIC_STRESS_CONTENT;
  }
  return resolveInside(root, route.relativePath);
}

async function sendFile(request, response, filePath, noStore = false) {
  const stat = await fsPromises.stat(filePath);
  if (!stat.isFile()) throw new Error("Not a file");
  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    "Content-Type": MIME_TYPES.get(extension) ?? "application/octet-stream",
    "Content-Length": stat.size,
    "Cache-Control": noStore ? "no-store" : "public, max-age=60",
    "Access-Control-Allow-Origin": "*",
    "Timing-Allow-Origin": "*",
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  fs.createReadStream(filePath).pipe(response);
}

async function readJsonBody(request, limitBytes = 20 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limitBytes) throw new Error("Result payload exceeds 20 MB");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function createBenchmarkServer(options = {}) {
  const port = Number(options.port ?? 8088);
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
      if (request.method === "OPTIONS") {
        response.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
        });
        response.end();
        return;
      }
      if (url.pathname === "/api/health") {
        jsonResponse(response, 200, {
          ok: true,
          protocol: FROZEN_PROTOCOL,
          datasets: await datasetStatuses(),
          benchmarkUrls: localAddresses(port),
        });
        return;
      }
      if (url.pathname === "/api/results" && request.method === "POST") {
        const payload = await readJsonBody(request);
        const runId = sanitizeRunId(payload?.manifest?.runId);
        await fsPromises.mkdir(RESULTS_ROOT, { recursive: true });
        const outputPath = resolveInside(RESULTS_ROOT, `${runId}.json`);
        await fsPromises.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
        jsonResponse(response, 201, { ok: true, runId });
        return;
      }

      const benchmarkRoute = parseBenchmarkAssetPath(url.pathname);
      if (benchmarkRoute) {
        const dataset = DATASETS[benchmarkRoute.dataset];
        if (!dataset) throw new Error(`Unknown dataset: ${benchmarkRoute.dataset}`);
        const delayMs = networkDelayMs(benchmarkRoute.networkProfile, dataset);
        if (delayMs > 0 && path.extname(benchmarkRoute.relativePath).toLowerCase() !== ".json") {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        await sendFile(request, response, resolveBenchmarkFile(benchmarkRoute), true);
        return;
      }

      const pathname = url.pathname === "/"
        ? "/Apps/learnMapmost/lod-benchmark.html"
        : url.pathname;
      const staticPath = resolveInside(CESIUM_ROOT, decodeURIComponent(pathname.slice(1)));
      await sendFile(request, response, staticPath, false);
    } catch (error) {
      const status = error?.code === "ENOENT" ? 404 : 400;
      jsonResponse(response, status, { ok: false, error: String(error.message ?? error) });
    }
  });
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const portArg = process.argv.find((arg) => arg.startsWith("--port="));
  const port = Number(portArg?.split("=")[1] ?? 8088);
  const server = createBenchmarkServer({ port });
  server.listen(port, "0.0.0.0", () => {
    process.stdout.write(`LOD benchmark server listening on http://localhost:${port}/\n`);
    for (const url of localAddresses(port)) process.stdout.write(`${url}\n`);
  });
}
