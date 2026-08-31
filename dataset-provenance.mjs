import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const REQUIRED_TEXT_FIELDS = [
  "datasetId",
  "sourceUrl",
  "sourceVersion",
  "license",
  "accessRoute",
  "generatedAt",
];

function portableRelativePath(value) {
  return String(value).replaceAll("\\", "/");
}

function isSafeRelativePath(value) {
  const portable = portableRelativePath(value);
  return portable.length > 0 &&
    !portable.startsWith("/") &&
    !/^[A-Za-z]:\//.test(portable) &&
    !portable.split("/").includes("..");
}

async function hashFile(filePath) {
  const bytes = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

async function listFiles(root, relative = "") {
  const directory = path.join(root, relative);
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const output = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) output.push(...await listFiles(root, child));
    else if (entry.isFile() && portableRelativePath(child) !== "provenance.json") output.push(child);
  }
  return output;
}

export function validateProvenanceRecord(record, dataset = {}) {
  const errors = [];
  if (record?.schemaVersion !== 1) errors.push("unsupported-provenance-schema");
  for (const field of REQUIRED_TEXT_FIELDS) {
    if (typeof record?.[field] !== "string" || record[field].trim() === "") {
      errors.push(`missing-${field}`);
    }
  }
  if (dataset.allowedForMainStudy && record?.license === "NOASSERTION") {
    errors.push("main-study-license-unresolved");
  }
  if (!Array.isArray(record?.files) || record.files.length === 0) {
    errors.push("missing-file-manifest");
  } else {
    for (const file of record.files) {
      const relativePath = portableRelativePath(file?.path ?? "");
      if (!isSafeRelativePath(relativePath)) errors.push(`unsafe-path:${relativePath}`);
      if (!Number.isInteger(file?.bytes) || file.bytes < 0) errors.push(`invalid-bytes:${relativePath}`);
      if (!/^[a-f0-9]{64}$/i.test(String(file?.sha256 ?? ""))) {
        errors.push(`invalid-sha256:${relativePath}`);
      }
    }
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

export async function buildProvenanceRecord(root, metadata) {
  const files = [];
  for (const relativePath of await listFiles(root)) {
    const absolutePath = path.join(root, relativePath);
    const stat = await fs.stat(absolutePath);
    files.push({
      path: portableRelativePath(relativePath),
      bytes: stat.size,
      sha256: await hashFile(absolutePath),
    });
  }
  return Object.freeze({
    schemaVersion: 1,
    datasetId: String(metadata.datasetId),
    sourceUrl: String(metadata.sourceUrl),
    sourceVersion: String(metadata.sourceVersion),
    license: String(metadata.license),
    accessRoute: String(metadata.accessRoute),
    generatedAt: metadata.generatedAt ?? new Date().toISOString(),
    files: Object.freeze(files.map(Object.freeze)),
  });
}

export async function inspectDatasetReadiness(root, dataset = {}) {
  const errors = [];
  let provenance;
  try {
    const provenanceBytes = await fs.readFile(path.join(root, "provenance.json"));
    provenance = JSON.parse(provenanceBytes.toString("utf8"));
    if (dataset.sourceSha256) {
      const actual = crypto.createHash("sha256").update(provenanceBytes).digest("hex");
      if (actual !== dataset.sourceSha256) errors.push("provenance-sha256-mismatch");
    }
  } catch (error) {
    return Object.freeze({ ready: false, errors: Object.freeze([`provenance-unavailable:${error.code ?? "invalid"}`]) });
  }
  if (dataset.version && provenance.sourceVersion !== dataset.version) {
    errors.push("source-version-mismatch");
  }
  if (dataset.license && provenance.license !== dataset.license) {
    errors.push("license-mismatch");
  }
  if (dataset.sourceUrl && provenance.sourceUrl !== dataset.sourceUrl) {
    errors.push("source-url-mismatch");
  }
  errors.push(...validateProvenanceRecord(provenance, dataset).errors);
  for (const file of provenance.files ?? []) {
    if (!isSafeRelativePath(file.path)) continue;
    try {
      const absolutePath = path.join(root, file.path);
      const stat = await fs.stat(absolutePath);
      if (stat.size !== file.bytes) errors.push(`size-mismatch:${file.path}`);
      if (await hashFile(absolutePath) !== file.sha256) errors.push(`hash-mismatch:${file.path}`);
    } catch (error) {
      errors.push(`file-unavailable:${file.path}:${error.code ?? "invalid"}`);
    }
  }
  return Object.freeze({
    ready: errors.length === 0,
    errors: Object.freeze([...new Set(errors)]),
    provenance,
  });
}
