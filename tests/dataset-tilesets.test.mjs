import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

for (const dataset of ["3dbag-amsterdam", "3dbag-rotterdam"]) {
  test(`${dataset} aggregate root forces refinement into content-bearing children`, async () => {
    const tileset = JSON.parse(await fs.readFile(
      new URL(`../datasets/${dataset}/tileset.json`, import.meta.url),
      "utf8",
    ));
    const childError = Math.max(...tileset.root.children.map((child) => child.geometricError));
    assert.ok(tileset.geometricError >= tileset.root.geometricError);
    assert.ok(tileset.root.geometricError > childError);
    assert.ok(tileset.root.children.every((child) => child.content?.uri?.endsWith(".json")));
  });
}
