import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DATASETS } from "./experiment-config.mjs";
import { buildProvenanceRecord } from "./dataset-provenance.mjs";

const datasetId = process.argv.find((value) => value.startsWith("--dataset="))?.split("=")[1];
const dataset = DATASETS[datasetId];
if (!dataset || !["main", "externalValidation"].includes(dataset.studyRole)) {
  throw new Error(`Unknown provenance-managed dataset: ${datasetId}`);
}
const here = path.dirname(fileURLToPath(import.meta.url));
const appsRoot = path.resolve(here, "..");
const root = path.dirname(path.resolve(appsRoot, dataset.path));
const provenance = await buildProvenanceRecord(root, {
  datasetId,
  sourceUrl: dataset.sourceUrl,
  sourceVersion: dataset.version,
  license: dataset.license,
  accessRoute: dataset.accessRoute,
});
const bytes = Buffer.from(`${JSON.stringify(provenance, null, 2)}\n`, "utf8");
await fs.writeFile(path.join(root, "provenance.json"), bytes);
const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
process.stdout.write(`${datasetId} provenance SHA-256: ${sha256}\n`);
