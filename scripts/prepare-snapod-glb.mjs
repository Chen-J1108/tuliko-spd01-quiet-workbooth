import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

globalThis.ProgressEvent ??= class ProgressEvent {};

const [referencePath, sourcePath, outputPath, reportPath] = process.argv.slice(2);
if (!referencePath || !sourcePath || !outputPath) {
  throw new Error(
    "Usage: node scripts/prepare-snapod-glb.mjs <semantic-reference.glb> <source.glb> <output.glb> [report.json]",
  );
}

const GLB_JSON_CHUNK = 0x4e4f534a;
const MODULE_ORDER = [
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
];

// Presentation offsets are authored against the imported GLB's local axes.
// After the website applies the approved -90deg front yaw they reproduce the
// supplied exploded-render order instead of sending the door/glass into depth.
const REFERENCE_EXPLOSION_OFFSETS = {
  roof: [0, 0.82, 0],
  base: [0, -0.58, 0],
  carpet: [0, -0.32, 0],
  "rear-wall": [0, 0, -0.82],
  "service-wall": [0, 0, 0.38],
  "fixed-glass": [0, 0, -0.42],
  "door-leaf": [0, 0, 1.08],
  "door-jamb": [0, 0, 0.92],
  "column-covers": [0, 0, 0.06],
  "frame-core": [0, 0, 0],
};

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function parseGlb(bytes) {
  if (bytes.readUInt32LE(0) !== 0x46546c67 || bytes.readUInt32LE(4) !== 2) {
    throw new Error("Only binary glTF 2.0 (.glb) files are supported.");
  }

  const chunks = [];
  let offset = 12;
  while (offset < bytes.length) {
    const length = bytes.readUInt32LE(offset);
    const type = bytes.readUInt32LE(offset + 4);
    chunks.push({ type, data: bytes.subarray(offset + 8, offset + 8 + length) });
    offset += 8 + length;
  }

  const jsonChunk = chunks.find((chunk) => chunk.type === GLB_JSON_CHUNK);
  if (!jsonChunk) throw new Error("The GLB does not contain a JSON chunk.");
  return {
    json: JSON.parse(jsonChunk.data.toString("utf8").trimEnd()),
    chunks,
  };
}

function encodeGlb(json, originalChunks) {
  const jsonBytes = Buffer.from(JSON.stringify(json));
  const paddedJsonLength = Math.ceil(jsonBytes.length / 4) * 4;
  const jsonChunk = Buffer.alloc(paddedJsonLength, 0x20);
  jsonBytes.copy(jsonChunk);

  const chunks = originalChunks.map((chunk) => (
    chunk.type === GLB_JSON_CHUNK ? { type: chunk.type, data: jsonChunk } : chunk
  ));
  const totalLength = 12 + chunks.reduce((sum, chunk) => sum + 8 + chunk.data.length, 0);
  const output = Buffer.alloc(totalLength);
  output.writeUInt32LE(0x46546c67, 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(totalLength, 8);

  let offset = 12;
  for (const chunk of chunks) {
    output.writeUInt32LE(chunk.data.length, offset);
    output.writeUInt32LE(chunk.type, offset + 4);
    chunk.data.copy(output, offset + 8);
    offset += 8 + chunk.data.length;
  }
  return output;
}

async function loadGlb(bytes) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return loader.parseAsync(data, "");
}

function objectBounds(object) {
  const box = new THREE.Box3().setFromObject(object);
  return {
    box,
    center: box.getCenter(new THREE.Vector3()),
    size: box.getSize(new THREE.Vector3()),
  };
}

function triangleCount(object) {
  let triangles = 0;
  object.traverse((child) => {
    if (!child.isMesh) return;
    const geometry = child.geometry;
    triangles += geometry.index
      ? geometry.index.count / 3
      : (geometry.attributes.position?.count ?? 0) / 3;
  });
  return triangles;
}

function rotateIncomingBounds(bounds) {
  return {
    center: new THREE.Vector3(-bounds.center.z, bounds.center.y, bounds.center.x),
    size: new THREE.Vector3(bounds.size.z, bounds.size.y, bounds.size.x),
  };
}

function meshRows(referenceScene) {
  const rows = [];
  referenceScene.updateMatrixWorld(true);
  for (const module of referenceScene.children) {
    const moduleId = String(module.userData.moduleId || "");
    module.traverse((object) => {
      if (!object.isMesh) return;
      const bounds = objectBounds(object);
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      rows.push({
        moduleId,
        partId: String(object.userData.partId || ""),
        center: bounds.center,
        size: bounds.size,
        triangles: triangleCount(object),
        materialNames: materials.filter(Boolean).map((material) => material.name),
      });
    });
  }
  return rows;
}

function rootRows(sourceScene) {
  sourceScene.updateMatrixWorld(true);
  return sourceScene.children.map((object, rootIndex) => {
    const bounds = objectBounds(object);
    const rotated = rotateIncomingBounds(bounds);
    return {
      object,
      rootIndex,
      center: rotated.center,
      size: rotated.size,
      triangles: triangleCount(object),
    };
  });
}

function matchRoot(source, candidates) {
  let best = null;
  for (const candidate of candidates) {
    const centerCost = source.center.distanceTo(candidate.center) / 2.4;
    const sizeScale = Math.max(source.size.length(), candidate.size.length(), 0.01);
    const sizeCost = source.size.distanceTo(candidate.size) / sizeScale;
    const triangleScale = Math.max(source.triangles, candidate.triangles, 1);
    const triangleCost = Math.abs(source.triangles - candidate.triangles) / triangleScale;
    const cost = centerCost * 6 + sizeCost * 4 + triangleCost * 0.15;
    if (!best || cost < best.cost) {
      best = { candidate, cost, centerCost, sizeCost, triangleCost };
    }
  }
  return best;
}

function walkNodeTree(json, nodeIndex, visitor, visited = new Set()) {
  if (visited.has(nodeIndex)) return;
  visited.add(nodeIndex);
  const node = json.nodes[nodeIndex];
  visitor(node, nodeIndex);
  for (const childIndex of node.children || []) {
    walkNodeTree(json, childIndex, visitor, visited);
  }
}

function cloneMaterialForRole(json, sourceMaterial, role, cache) {
  const key = `${sourceMaterial ?? "none"}:${role}`;
  if (cache.has(key)) return cache.get(key);
  const original = sourceMaterial == null ? {} : (json.materials?.[sourceMaterial] || {});
  const clone = structuredClone(original);
  clone.name = role === "glass" ? "SNAPOD_Glass" : "SNAPOD_BlackHardware";

  if (role === "glass") {
    clone.alphaMode = "BLEND";
    clone.doubleSided = true;
    clone.pbrMetallicRoughness = {
      ...(clone.pbrMetallicRoughness || {}),
      baseColorFactor: [0.02358, 0.08221, 0.22235, 0.34],
      metallicFactor: 0,
      roughnessFactor: 0.08,
    };
    clone.extensions = {
      ...(clone.extensions || {}),
      KHR_materials_transmission: { transmissionFactor: 0.55 },
      KHR_materials_volume: { thicknessFactor: 0.008 },
    };
  } else {
    clone.pbrMetallicRoughness = {
      ...(clone.pbrMetallicRoughness || {}),
      baseColorFactor: [0.035, 0.04, 0.038, 1],
      metallicFactor: 0.55,
      roughnessFactor: 0.32,
    };
  }

  json.materials ??= [];
  const index = json.materials.push(clone) - 1;
  cache.set(key, index);
  return index;
}

function assignMaterialRole(json, rootNodeIndex, role, cache) {
  walkNodeTree(json, rootNodeIndex, (node) => {
    if (node.mesh == null) return;
    for (const primitive of json.meshes[node.mesh].primitives || []) {
      primitive.material = cloneMaterialForRole(json, primitive.material, role, cache);
    }
  });
}

const referenceBytes = fs.readFileSync(referencePath);
const sourceBytes = fs.readFileSync(sourcePath);
const [referenceGlb, sourceGlb] = await Promise.all([
  loadGlb(referenceBytes),
  loadGlb(sourceBytes),
]);
const referenceParsed = parseGlb(referenceBytes);
const sourceParsed = parseGlb(sourceBytes);
const referenceRows = meshRows(referenceGlb.scene);
const sourceRows = rootRows(sourceGlb.scene);
const activeSceneIndex = sourceParsed.json.scene ?? 0;
const activeScene = sourceParsed.json.scenes?.[activeSceneIndex];
const sceneRoots = activeScene?.nodes || [];

if (sceneRoots.length !== sourceRows.length) {
  throw new Error(
    `Cannot map source roots: JSON has ${sceneRoots.length}, Three.js loaded ${sourceRows.length}.`,
  );
}

const moduleDefinitions = new Map(referenceGlb.scene.children.map((module) => [
  String(module.userData.moduleId || ""),
  {
    name: module.name,
    moduleLabel: module.userData.moduleLabel,
    explodeOffset: module.userData.explodeOffset,
  },
]));
const assignments = sourceRows.map((source) => ({
  source,
  match: matchRoot(source, referenceRows),
  rootNodeIndex: sceneRoots[source.rootIndex],
}));

const materialCache = new Map();
const groupedRoots = new Map(MODULE_ORDER.map((moduleId) => [moduleId, []]));
for (const assignment of assignments) {
  const { candidate } = assignment.match;
  groupedRoots.get(candidate.moduleId)?.push(assignment.rootNodeIndex);
  walkNodeTree(sourceParsed.json, assignment.rootNodeIndex, (node) => {
    node.extras = {
      ...(node.extras || {}),
      moduleId: candidate.moduleId,
      partId: candidate.partId || `${candidate.moduleId}-assembly`,
    };
  });

  const largeThinSide = assignment.source.size.x < 0.04
    && assignment.source.size.y > 1.7
    && assignment.source.size.z > 0.65;
  const glass = candidate.materialNames.some((name) => name.includes("Glass"))
    || (largeThinSide && ["fixed-glass", "door-leaf"].includes(candidate.moduleId));
  const blackHardware = candidate.materialNames.some((name) => name.includes("BlackHardware"));
  if (glass) assignMaterialRole(sourceParsed.json, assignment.rootNodeIndex, "glass", materialCache);
  else if (blackHardware) {
    assignMaterialRole(sourceParsed.json, assignment.rootNodeIndex, "hardware", materialCache);
  }
}

sourceParsed.json.extensionsUsed ??= [];
for (const extension of ["KHR_materials_transmission", "KHR_materials_volume"]) {
  if (!sourceParsed.json.extensionsUsed.includes(extension)) {
    sourceParsed.json.extensionsUsed.push(extension);
  }
}

const halfSqrt = Math.SQRT1_2;
const semanticRootIndices = [];
for (const moduleId of MODULE_ORDER) {
  const children = groupedRoots.get(moduleId) || [];
  if (!children.length) throw new Error(`No source geometry was assigned to module '${moduleId}'.`);
  const definition = moduleDefinitions.get(moduleId) || {};
  const nodeIndex = sourceParsed.json.nodes.push({
    name: definition.name || `SNAPOD_${moduleId}`,
    children,
    rotation: [0, -halfSqrt, 0, halfSqrt],
    extras: {
      moduleId,
      moduleLabel: definition.moduleLabel || moduleId,
      explodeOffset: REFERENCE_EXPLOSION_OFFSETS[moduleId] || definition.explodeOffset,
    },
  }) - 1;
  semanticRootIndices.push(nodeIndex);
}
activeScene.nodes = semanticRootIndices;
sourceParsed.json.asset.extras = {
  ...(sourceParsed.json.asset.extras || {}),
  semanticPreparation: "Tuliko SPD01 web semantic grouping v1",
  sourceSha256: sha256(sourceBytes),
  referenceSha256: sha256(referenceBytes),
};

const preparedBytes = encodeGlb(sourceParsed.json, sourceParsed.chunks);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, preparedBytes);

const moduleCounts = Object.fromEntries(MODULE_ORDER.map((moduleId) => [
  moduleId,
  groupedRoots.get(moduleId)?.length || 0,
]));
const exactBounds = assignments.filter(({ match }) => (
  match.centerCost < 0.0002 && match.sizeCost < 0.001
)).length;
const nearBounds = assignments.filter(({ match }) => (
  match.centerCost < 0.005 && match.sizeCost < 0.025
)).length;
const report = {
  source: path.resolve(sourcePath),
  semanticReference: path.resolve(referencePath),
  output: path.resolve(outputPath),
  sourceSha256: sha256(sourceBytes),
  referenceSha256: sha256(referenceBytes),
  sourceBytes: sourceBytes.length,
  preparedBytes: preparedBytes.length,
  sourceRootCount: sourceRows.length,
  referenceMeshCount: referenceRows.length,
  moduleCounts,
  mappingQuality: {
    exactBounds,
    nearBounds,
    inferredBounds: assignments.length - nearBounds,
  },
  inferredAssignments: assignments
    .filter(({ match }) => !(match.centerCost < 0.005 && match.sizeCost < 0.025))
    .map(({ source, match }) => ({
      rootIndex: source.rootIndex,
      name: source.object.name || `root-${source.rootIndex}`,
      center: source.center.toArray().map((value) => +value.toFixed(5)),
      size: source.size.toArray().map((value) => +value.toFixed(5)),
      triangles: source.triangles,
      moduleId: match.candidate.moduleId,
      partId: match.candidate.partId,
      centerCost: +match.centerCost.toFixed(5),
      sizeCost: +match.sizeCost.toFixed(5),
    })),
  materialRepairs: {
    glassRoots: assignments.filter(({ source, match }) => (
      match.candidate.materialNames.some((name) => name.includes("Glass"))
      || (
        source.size.x < 0.04
        && source.size.y > 1.7
        && source.size.z > 0.65
        && ["fixed-glass", "door-leaf"].includes(match.candidate.moduleId)
      )
    )).length,
    hardwareRoots: assignments.filter(({ match }) => (
      match.candidate.materialNames.some((name) => name.includes("BlackHardware"))
    )).length,
  },
};

if (reportPath) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}
console.log(JSON.stringify(report, null, 2));
