import test from "node:test";
import assert from "node:assert/strict";

import { rowsToCsv, sanitizeForJson } from "../result-export.mjs";

test("CSV export quotes commas and leaves non-finite cells empty", () => {
  const csv = rowsToCsv([
    { method: "proposed", note: "a,b", value: Number.NaN },
  ]);
  assert.equal(csv, 'method,note,value\r\nproposed,"a,b",\r\n');
});

test("JSON sanitization replaces non-finite numbers with null", () => {
  assert.deepEqual(sanitizeForJson({ p95: Number.NaN, nested: [1, Infinity] }), {
    p95: null,
    nested: [1, null],
  });
});
