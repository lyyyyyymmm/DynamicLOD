import test from "node:test";
import assert from "node:assert/strict";

import {
  countTiles,
  createStressTileset,
  treeDepth,
} from "../stress-tileset-generator.mjs";

test("public stress tileset is a four-level 85-tile quadtree", () => {
  const tileset = createStressTileset();
  assert.equal(countTiles(tileset.root), 85);
  assert.equal(treeDepth(tileset.root), 4);
  assert.equal(tileset.asset.version, "1.0");
  assert.equal(tileset.root.transform.length, 16);
  assert.ok(Math.abs(tileset.root.transform[12]) > 1_000_000);
});

test("every stress tile has a unique request URL", () => {
  const tileset = createStressTileset();
  const uris = [];
  const visit = (tile) => {
    uris.push(tile.content.uri);
    for (const child of tile.children ?? []) visit(child);
  };
  visit(tileset.root);

  assert.equal(new Set(uris).size, 85);
  assert.ok(uris.every((uri) => uri.startsWith("tile-content.b3dm?tile=")));
});

test("stress leaves have zero geometric error", () => {
  const tileset = createStressTileset();
  const visit = (tile) => {
    if (!tile.children?.length) assert.equal(tile.geometricError, 0);
    for (const child of tile.children ?? []) visit(child);
  };
  visit(tileset.root);
});
