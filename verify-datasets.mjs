import path from "node:path";
import { fileURLToPath } from "node:url";

import { DATASETS } from "./experiment-config.mjs";
import { inspectDatasetReadiness } from "./dataset-provenance.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const appsRoot = path.resolve(here, "..");
let failed = false;

for (const id of ["bagAmsterdam", "bagRotterdam"]) {
  const dataset = DATASETS[id];
  const root = path.dirname(path.resolve(appsRoot, dataset.path));
  const result = await inspectDatasetReadiness(root, dataset);
  process.stdout.write(`${id}: ${result.ready ? "READY" : `INVALID (${result.errors.join(", ")})`}\n`);
  failed ||= !result.ready;
}

process.exitCode = failed ? 1 : 0;
