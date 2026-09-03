import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modelPath = path.join(
  projectRoot,
  "public",
  "assets",
  "models",
  "snapod-spd01-white-semantic.glb",
);

function readGlbJson(filePath) {
  const bytes = fs.readFileSync(filePath);
  assert.equal(bytes.readUInt32LE(0), 0x46546c67, "asset must be a binary glTF file");
  assert.equal(bytes.readUInt32LE(4), 2, "asset must use glTF 2.0");
  const jsonLength = bytes.readUInt32LE(12);
  const jsonType = bytes.readUInt32LE(16);
  assert.equal(jsonType, 0x4e4f534a, "first GLB chunk must contain JSON");
  return {
    bytes,
    json: JSON.parse(bytes.subarray(20, 20 + jsonLength).toString("utf8").trimEnd()),
  };
}

test("the production SPD01 model keeps all semantic product modules", () => {
  const { bytes, json } = readGlbJson(modelPath);
  const scene = json.scenes[json.scene ?? 0];
  const moduleIds = scene.nodes.map((nodeIndex) => json.nodes[nodeIndex].extras?.moduleId);

  assert.deepEqual(moduleIds, [
    "base",
    "frame-core",
    "rear-wall",
    "service-wall",
    "fixed-glass",
    "roof",
    "door-jamb",
    "door-leaf",
    "column-covers",
    "carpet",
  ]);
  assert.ok(bytes.length < 2_000_000, "production model should remain web-sized");
  assert.ok(json.extensionsRequired.includes("EXT_meshopt_compression"));
});

test("the production SPD01 model retains glass and hardware material roles", () => {
  const { json } = readGlbJson(modelPath);
  const materialNames = json.materials.map((material) => material.name);

  assert.ok(materialNames.includes("SNAPOD_Glass"));
  assert.ok(materialNames.includes("SNAPOD_BlackHardware"));
  assert.ok(json.extensionsUsed.includes("KHR_materials_transmission"));
  assert.ok(json.extensionsUsed.includes("KHR_materials_volume"));
});
