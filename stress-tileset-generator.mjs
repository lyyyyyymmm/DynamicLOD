import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GEOMETRIC_ERRORS = [64, 32, 16, 0];
const ROOT_TRANSFORM = [
  96.86356343768793, 24.848542777253734, 0, 0,
  -15.986465724980844, 62.317780594908875, 76.5566922962899, 0,
  19.02322243409411, -74.15554020821229, 64.3356267137516, 0,
  1215107.7612304366, -4736682.902037748, 4081926.095098698, 1,
];
const OFFSETS = [
  [-40, -40],
  [40, -40],
  [-40, 40],
  [40, 40],
];

function childTransform(x, y) {
  return [
    0.5, 0, 0, 0,
    0, 0.5, 0, 0,
    0, 0, 0.5, 0,
    x, y, 0, 1,
  ];
}

function createTile(depth, id) {
  const tile = {
    boundingVolume: {
      box: [0, 0, 0, 40, 0, 0, 0, 40, 0, 0, 0, 40],
    },
    geometricError: GEOMETRIC_ERRORS[depth],
    refine: "REPLACE",
    content: { uri: `tile-content.b3dm?tile=${id}` },
  };
  if (depth < GEOMETRIC_ERRORS.length - 1) {
    tile.children = OFFSETS.map(([x, y], index) => ({
      ...createTile(depth + 1, `${id}-${index}`),
      transform: childTransform(x, y),
    }));
  }
  return tile;
}

export function createStressTileset() {
  const root = createTile(0, "0");
  root.transform = ROOT_TRANSFORM;
  return {
    asset: {
      version: "1.0",
      tilesetVersion: "public-stress-v1",
    },
    geometricError: GEOMETRIC_ERRORS[0],
    root,
    extras: {
      purpose: "Synthetic request-pressure benchmark; not a real-world scene",
      sourceContent: "Bundled Cesium Stanford Dragon discrete-LOD sample",
      tileCount: 85,
    },
  };
}

export function countTiles(tile) {
  return 1 + (tile.children ?? []).reduce((sum, child) => sum + countTiles(child), 0);
}

export function treeDepth(tile) {
  if (!tile.children?.length) return 1;
  return 1 + Math.max(...tile.children.map(treeDepth));
}

export async function writeStressTileset(outputPath) {
  const resolved = path.resolve(outputPath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, `${JSON.stringify(createStressTileset(), null, 2)}\n`, "utf8");
  return resolved;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const outputPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "generated/public-stress-tileset/tileset.json",
  );
  const written = await writeStressTileset(outputPath);
  process.stdout.write(`Generated ${written}\n`);
}
