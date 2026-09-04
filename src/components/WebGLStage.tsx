import { useEffect, useRef, useState } from "react";
import {
  AmbientLight,
  Box3,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoToneMapping,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import type { SceneDirector } from "../scene-director";
import { clamp01, rangeProgress, smoothstep } from "../scene-director";
import {
  PRODUCT_BOUNDARY_EVENT,
  type ProductScreenBoundary,
} from "../product-boundary";
import {
  STRUCTURE_GUIDE_EVENT,
  type StructureGuideId,
  type StructureGuideTarget,
} from "../structure-guides";

const MODEL_URL = "/assets/models/snapod-spd01-white-semantic.glb?v=20260903-1";
const PRODUCT_BOUNDARY_SIGNS = [-0.5, 0.5] as const;
const HERO_BACKGROUND = new Color(0x0c0f0e);
const STORY_BACKGROUND = new Color(0x131816);

type PartKind =
  | "roof"
  | "base"
  | "columns"
  | "sidePanels"
  | "frontDoor"
  | "rearGlass"
  | "acousticPanels";

interface ExplodablePart {
  object: Object3D;
  base: Vector3;
  direction: Vector3;
  kind: PartKind;
  moduleId: string;
}

interface GuideAnchor {
  object: Object3D;
  localPoint: Vector3;
}

interface WebGLStageProps {
  director: SceneDirector;
  onReady?: (status: "loaded" | "error") => void;
}

const PRODUCT_FINISH = {
  // Sampled toward the supplied green front and 45-degree product renders:
  // mint-grey satin shell, warm neutral lining, dark metal and clear glass.
  sage: new Color(0x8daea1),
  charcoal: new Color(0x242625),
  graphite: new Color(0x363837),
  textile: new Color(0xaaa7a4),
  glass: new Color(0xe0e7e4),
  desk: new Color(0xe9e6e0),
  light: new Color(0xfff2d9),
};

// The uploaded product folder includes a canonical exploded render. These
// offsets recreate its readable left-to-right order after the model's -90deg
// front yaw: door -> service lining -> core -> fixed glass -> rear shell.
// Keeping the offsets in the runtime (instead of trusting older GLB extras)
// also prevents broad panels from travelling only in depth and occluding the
// complete assembly in the direct front inspection frame.
const REFERENCE_EXPLOSION_OFFSETS: Record<string, readonly [number, number, number]> = {
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

function partKindForModule(moduleId: string): PartKind {
  switch (moduleId) {
    case "roof":
      return "roof";
    case "base":
    case "carpet":
      return "base";
    case "rear-wall":
      return "acousticPanels";
    case "service-wall":
      return "sidePanels";
    case "fixed-glass":
      return "rearGlass";
    case "door-leaf":
      return "frontDoor";
    default:
      return "columns";
  }
}

function directionForModule(moduleId: string) {
  const offset = REFERENCE_EXPLOSION_OFFSETS[moduleId] ?? [0, 0, 0];
  return new Vector3(...offset);
}

function isDeskSurface(bounds: Box3) {
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  return size.x > 0.45
    && size.x < 0.82
    && size.z > 0.18
    && size.z < 0.52
    && size.y < 0.09
    && center.y > -0.35
    && center.y < 0.45;
}

function isCeilingLight(bounds: Box3) {
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  return size.x > 0.24
    && size.x < 0.8
    && size.y < 0.08
    && size.z < 0.14
    && center.y > 0.82;
}

function applyProductFinish(mesh: Mesh) {
  const moduleId = String(mesh.userData?.moduleId || "");
  const partId = String(mesh.userData?.partId || "");
  const bounds = new Box3().setFromObject(mesh);
  const deskSurface = isDeskSurface(bounds);
  const ceilingLight = isCeilingLight(bounds);
  const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

  const finishedMaterials = sourceMaterials.map((sourceMaterial) => {
    const material = sourceMaterial.clone() as MeshStandardMaterial | MeshPhysicalMaterial;
    const materialName = sourceMaterial.name || "";
    const glassSurface = materialName.includes("Glass");
    const outerSkin = partId.endsWith("outer-skin");
    const innerSkin = partId.endsWith("inner-skin");
    const blackHardware = materialName.includes("BlackHardware");
    const darkAssembly = ["base", "frame-core", "door-jamb", "door-leaf"].includes(moduleId);
    const fabricWall = ["rear-wall", "service-wall"].includes(moduleId);

    // The GLB contains presentation-light emissive values. Clear them so the
    // product reads as a material sample instead of a glowing stage prop.
    material.emissive.set(0x000000);
    material.emissiveIntensity = 0;
    material.envMapIntensity = 0.16;

    if (glassSurface) {
      const glass = material as MeshPhysicalMaterial;
      glass.color.copy(PRODUCT_FINISH.glass);
      // Match the supplied frontal render: the glass remains clearly present,
      // while the desk and inner lining stay readable through it.
      glass.roughness = 0.18;
      glass.metalness = 0;
      glass.transmission = 0.86;
      glass.opacity = 0.14;
      glass.transparent = true;
      glass.depthWrite = false;
      glass.side = DoubleSide;
      glass.clearcoat = 0.18;
      glass.clearcoatRoughness = 0.28;
      glass.ior = 1.45;
      glass.thickness = 0.008;
      glass.envMapIntensity = 0.14;
    } else if (ceilingLight) {
      material.color.copy(PRODUCT_FINISH.light);
      material.emissive.copy(PRODUCT_FINISH.light);
      material.emissiveIntensity = 0.12;
      material.roughness = 0.46;
      material.metalness = 0;
      material.envMapIntensity = 0.28;
    } else if (deskSurface) {
      material.color.copy(PRODUCT_FINISH.desk);
      material.roughness = 0.34;
      material.metalness = 0.02;
      material.envMapIntensity = 0.3;
    } else if (outerSkin || moduleId === "column-covers") {
      material.color.copy(PRODUCT_FINISH.sage);
      material.roughness = 0.4;
      material.metalness = 0.04;
      material.envMapIntensity = 0.32;
    } else if (innerSkin || fabricWall) {
      material.color.copy(PRODUCT_FINISH.textile);
      material.roughness = 0.88;
      material.metalness = 0;
      material.envMapIntensity = 0.1;
    } else if (moduleId === "carpet") {
      material.color.copy(PRODUCT_FINISH.graphite);
      material.roughness = 0.96;
      material.metalness = 0;
      material.envMapIntensity = 0.04;
    } else if (blackHardware || darkAssembly) {
      material.color.copy(PRODUCT_FINISH.charcoal);
      material.roughness = 0.34;
      material.metalness = 0.38;
      material.envMapIntensity = 0.34;
    } else {
      // Preserve more of the supplied GLB's own neutral surface variation so
      // small switches, fittings and trim do not collapse into one dark mass.
      material.color.lerp(PRODUCT_FINISH.graphite, 0.28);
      material.roughness = Math.max(material.roughness, 0.48);
      material.metalness = Math.min(material.metalness, 0.18);
      material.envMapIntensity = 0.22;
    }

    material.needsUpdate = true;
    return material;
  });

  mesh.material = Array.isArray(mesh.material) ? finishedMaterials : finishedMaterials[0];
}

function createSoftContactShadow() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createRadialGradient(128, 64, 8, 128, 64, 118);
  gradient.addColorStop(0, "rgba(0,0,0,.34)");
  gradient.addColorStop(0.55, "rgba(0,0,0,.13)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const material = new MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });
  const shadow = new Mesh(new PlaneGeometry(1, 1), material);
  shadow.rotation.x = -Math.PI / 2;
  shadow.renderOrder = -1;
  return shadow;
}

function disposeObject(object: Object3D) {
  const disposedMaterials = new Set<object>();
  const disposedTextures = new Set<object>();
  object.traverse((child) => {
    const mesh = child as Mesh;
    mesh.geometry?.dispose?.();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.filter(Boolean).forEach((material) => {
      if (disposedMaterials.has(material)) return;
      disposedMaterials.add(material);
      Object.values(material).forEach((value) => {
        if (value && typeof value === "object" && "isTexture" in value && !disposedTextures.has(value)) {
          disposedTextures.add(value);
          (value as { dispose: () => void }).dispose();
        }
      });
      material.dispose?.();
    });
  });
}

function sampleShift(narrative: number) {
  const values = [-0.7, -0.48, -0.46, -0.02, -0.42, -0.42];
  const index = Math.min(values.length - 2, Math.max(0, Math.floor(narrative)));
  const progress = smoothstep(narrative - index);
  return values[index] + (values[index + 1] - values[index]) * progress;
}

function sampleCompactY(narrative: number) {
  const values = [-0.3, -0.1, -0.08, 0.06, 0.06, 0.06];
  const index = Math.min(values.length - 2, Math.max(0, Math.floor(narrative)));
  const progress = smoothstep(narrative - index);
  return values[index] + (values[index + 1] - values[index]) * progress;
}

function sampleMobileDistance(narrative: number) {
  // The compact product stays prominent in every assembled chapter. The
  // fully exploded construction view applies its own fit guard below. The
  // modular compact view remains farther out to preserve its right-edge and
  // bottom-rail safety clearance on narrow screens.
  const values = [2.4, 2.12, 2.02, 2.52, 2.52, 2.52];
  const index = Math.min(values.length - 2, Math.max(0, Math.floor(narrative)));
  const progress = smoothstep(narrative - index);
  return values[index] + (values[index + 1] - values[index]) * progress;
}

function sampleDesktopFit(narrative: number) {
  // Keep the hero's established generous three-quarter frame, then bring the
  // assembled product closer for structure, acoustic, modular, and control
  // chapters. Acoustic, modular, and interaction intentionally share one fit
  // so the booth does not shrink across the assembled-product explanations.
  // Values interpolate across chapter overlap rather than jumping.
  const values = [1.66, 1.48, 1.3, 1.3, 1.3, 1.48];
  const index = Math.min(values.length - 2, Math.max(0, Math.floor(narrative)));
  const progress = smoothstep(narrative - index);
  return values[index] + (values[index + 1] - values[index]) * progress;
}

function explosionFor(structureProgress: number) {
  // The three phases are deliberately tied to the chapter, rather than to an
  // animation clock: scrub, reverse-scroll, and hash refresh all land on the
  // same authoritative assembly state. The final reassembly is intentionally
  // compact so the completed product does not linger before the acoustic page.
  if (structureProgress < 0.29) return smoothstep(rangeProgress(structureProgress, 0, 0.29));
  if (structureProgress < 0.86) return 1;
  return 1 - smoothstep(rangeProgress(structureProgress, 0.86, 1));
}

function structureCameraMove(structureProgress: number) {
  // One deterministic camera phrase: move in while the assembly opens, hold
  // while it can be inspected, then return before the following chapter.
  const arrive = smoothstep(rangeProgress(structureProgress, 0.05, 0.32));
  const depart = smoothstep(rangeProgress(structureProgress, 0.76, 0.98));
  return arrive * (1 - depart);
}

function structurePresentationMove(structureProgress: number) {
  // A compact orientation phrase gives the assembly a readable spatial entry
  // before the technical view locks to its front elevation. It is driven by
  // scroll, so reverse scrolling and hash refresh restore the exact pose.
  const turnIn = smoothstep(rangeProgress(structureProgress, 0.08, 0.22));
  const turnOut = 1 - smoothstep(rangeProgress(structureProgress, 0.3, 0.44));
  return turnIn * turnOut;
}

function structureOrbitProgress(structureProgress: number) {
  // The full revolution belongs to the fully exploded inspection state. It
  // now has a longer scrub range and completes before deterministic
  // reassembly. The stable front-elevation label pass remains untouched.
  return smoothstep(rangeProgress(structureProgress, 0.6, 0.82));
}

function structureTopDownProgress(structureProgress: number) {
  const liftIn = smoothstep(rangeProgress(structureProgress, 0.67, 0.75));
  const liftOut = 1 - smoothstep(rangeProgress(structureProgress, 0.8, 0.9));
  return liftIn * liftOut;
}

export function WebGLStage({ director, onReady }: WebGLStageProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let disposed = false;
    let animationFrame = 0;
    let lastCompactFrame = 0;
    const appRoot = mount.closest<HTMLElement>("#app-story");
    let postStoryPaused = appRoot?.classList.contains("is-post-story") ?? false;
    let product: Group | null = null;
    let productBackdrop: Mesh | null = null;
    let productSize = new Vector3(1.0481, 2.3196, 1);
    const parts: ExplodablePart[] = [];
    const guideAnchors = new Map<StructureGuideId, GuideAnchor>();
    const projectedBoundaryCorner = new Vector3();
    const projectedGuideBounds = new Box3();
    let lastGuideSignature = "";
    let lastBoundarySignature = "";
    let heroExtraShiftPx = 0;

    const scene = new Scene();
    const sceneBackground = HERO_BACKGROUND.clone();
    scene.background = sceneBackground;
    const camera = new PerspectiveCamera(28, 1, 0.02, 80);
    const renderer = new WebGLRenderer({
      alpha: true,
      antialias: !director.snapshot.compact,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x0c0f0e, 1);
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = NoToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, director.snapshot.compact ? 1 : 1.25));
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);

    // A low-detail neutral room restores small, truthful material reflections
    // on glass and metal without becoming a visible lighting effect.
    const pmrem = new PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environmentTarget = pmrem.fromScene(room, 0.04);
    scene.environment = environmentTarget.texture;
    room.dispose();
    pmrem.dispose();

    // Broad studio illumination keeps the satin shell and the felt texture
    // legible without the hard glow or silhouette-only contrast of a stage rig.
    const ambient = new AmbientLight(0xdfe5df, 0.32);
    const hemisphere = new HemisphereLight(0xf0f1ea, 0x121615, 0.34);
    const key = new DirectionalLight(0xfff8ed, 0.78);
    key.position.set(-3.4, 4.8, 3.8);
    const fill = new DirectionalLight(0xd4e2da, 0.34);
    fill.position.set(3.1, 1.7, 2.6);
    const rim = new DirectionalLight(0xb7c9b5, 0.2);
    rim.position.set(-2.6, 3.1, -3.4);
    scene.add(ambient, hemisphere, key, fill, rim);

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      heroExtraShiftPx = appRoot
        ? Number.parseFloat(getComputedStyle(appRoot).getPropertyValue("--hero-extra-shift-x")) || 0
        : 0;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, director.snapshot.compact ? 1 : 1.25));
      renderer.setSize(width, height, false);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      MODEL_URL,
      (gltf) => {
        if (disposed) {
          disposeObject(gltf.scene);
          return;
        }

        product = new Group();
        product.name = "SNAPOD SPD01 authoritative continuous product stage";
        product.add(gltf.scene);
        scene.add(product);

        const semanticParts = new Map<string, Object3D>();
        let deskTarget: Mesh | null = null;
        let deskTargetArea = 0;
        let lightTarget: Mesh | null = null;
        let lightTargetArea = 0;

        gltf.scene.traverse((child) => {
          const partId = String(child.userData?.partId || "");
          if (partId && !semanticParts.has(partId)) semanticParts.set(partId, child);
          if (!(child as Mesh).isMesh) return;

          const mesh = child as Mesh;
          const bounds = new Box3().setFromObject(mesh);
          const size = bounds.getSize(new Vector3());
          const area = size.x * size.z;
          if (isDeskSurface(bounds) && area > deskTargetArea) {
            deskTarget = mesh;
            deskTargetArea = area;
          }
          if (isCeilingLight(bounds) && area > lightTargetArea) {
            lightTarget = mesh;
            lightTargetArea = area;
          }
          applyProductFinish(mesh);
        });

        const modules = new Map<string, Object3D>();

        gltf.scene.children.forEach((module) => {
          const moduleId = String(module.userData?.moduleId || "");
          if (!moduleId) return;
          modules.set(moduleId, module);
          parts.push({
            object: module,
            base: module.position.clone(),
            direction: directionForModule(moduleId),
            kind: partKindForModule(moduleId),
            moduleId,
          });
        });

        product.updateMatrixWorld(true);
        const bounds = new Box3().setFromObject(product);
        productSize = bounds.getSize(new Vector3());
        const center = bounds.getCenter(new Vector3());
        gltf.scene.position.sub(center);
        product.updateMatrixWorld(true);

        const registerGuideAnchor = (
          id: StructureGuideId,
          object: Object3D | null | undefined,
          fractions = new Vector3(0.5, 0.5, 0.5),
        ) => {
          if (!object) return;
          const objectBounds = new Box3().setFromObject(object);
          if (objectBounds.isEmpty()) return;
          const objectSize = objectBounds.getSize(new Vector3());
          const worldPoint = objectBounds.min.clone().add(new Vector3(
            objectSize.x * fractions.x,
            objectSize.y * fractions.y,
            objectSize.z * fractions.z,
          ));
          guideAnchors.set(id, {
            object,
            localPoint: object.worldToLocal(worldPoint.clone()),
          });
        };

        registerGuideAnchor("roof", modules.get("roof"), new Vector3(0.5, 0.55, 0.14));
        registerGuideAnchor("base", modules.get("base"));
        registerGuideAnchor("columns", semanticParts.get("frame-core-xp-zp") || modules.get("frame-core"));
        // Use the complete module envelope for callouts. A child skin can sit
        // inside the projected silhouette after rotation, which makes an
        // otherwise horizontal leader appear to pass through the panel.
        registerGuideAnchor("sidePanel", modules.get("service-wall"));
        registerGuideAnchor("frontDoor", modules.get("door-leaf"));
        registerGuideAnchor("fixedGlass", modules.get("fixed-glass"));
        registerGuideAnchor("acousticPanel", modules.get("rear-wall"));
        registerGuideAnchor("desk", deskTarget);
        registerGuideAnchor("carpet", modules.get("carpet"));
        registerGuideAnchor("lighting", lightTarget);

        // A compact neutral inner liner separates the dark door from the page
        // without reading as a coloured shell around the product.
        productBackdrop = new Mesh(
          new PlaneGeometry(productSize.x * 1.12, productSize.y * 1.08),
          new MeshBasicMaterial({
            color: 0x2a2d2b,
            transparent: true,
            opacity: 0.48,
            side: DoubleSide,
            depthWrite: false,
          }),
        );
        productBackdrop.renderOrder = -1;
        scene.add(productBackdrop);

        const contactShadow = createSoftContactShadow();
        if (contactShadow) {
          contactShadow.scale.set(productSize.x * 1.18, productSize.z * 0.96, 1);
          contactShadow.position.set(0, -productSize.y * 0.505, 0.04);
          product.add(contactShadow);
        }

        setStatus("loaded");
        onReady?.("loaded");
      },
      undefined,
      (error) => {
        if (!disposed) {
          console.error("SNAPOD authoritative GLB failed to load", error);
          setStatus("error");
          onReady?.("error");
        }
      },
    );

    const render = (time: number) => {
      animationFrame = 0;
      if (disposed || !director.snapshot.visible || postStoryPaused) return;
      if (director.snapshot.compact && time - lastCompactFrame < 1000 / 40) {
        animationFrame = requestAnimationFrame(render);
        return;
      }
      lastCompactFrame = time;

      const state = director.snapshot;
      const explode = state.reducedMotion ? 0 : explosionFor(state.structureProgress);
      const structureCamera = state.reducedMotion || state.chapter !== "structure"
        ? 0
        : structureCameraMove(state.structureProgress);
      const structurePresentation = state.reducedMotion || state.chapter !== "structure"
        ? 0
        : structurePresentationMove(state.structureProgress);
      const structureOrbit = state.reducedMotion || state.chapter !== "structure"
        ? 0
        : structureOrbitProgress(state.structureProgress);
      const structureTopDown = state.reducedMotion || state.chapter !== "structure"
        ? 0
        : structureTopDownProgress(state.structureProgress);
      // During the unlabelled inspection beat, borrow the reference page's
      // diagonal editorial framing without turning it into a free-running
      // camera. A sine envelope guarantees a clean front-view entry/exit.
      const referenceSweep = Math.sin(Math.PI * structureOrbit);
      const heroPrelude = state.reducedMotion || state.narrative >= 1
        ? 0
        : 0.065 * smoothstep(rangeProgress(state.narrative, 0.8, 1));
      const filmPrelude = state.reducedMotion
        ? 0
        : smoothstep(rangeProgress(state.narrative, 4.8, 5));
      // Acoustic and modular are adjacent assembled-product explanations, so
      // they share one right-hand visual centre as well as one camera fit. The
      // acoustic waves keep their clear lanes, and the modular chapter no
      // longer introduces an unrelated horizontal jump. The envelope keeps
      // both handoffs continuous in either scroll direction.
      const adjacentProductComposition = state.reducedMotion
        ? (state.chapter === "acoustic" || state.chapter === "modular" ? 1 : 0)
        : smoothstep(rangeProgress(state.narrative, 1.78, 2))
          * (1 - smoothstep(rangeProgress(state.narrative, 3.78, 4)));
      const light = state.reducedMotion ? 1 : clamp01(state.illumination);
      const technicalLight = state.chapter === "structure" ? structureCamera : 0;
      // The homepage retains its near-black product theatre. Every following
      // chapter gets a modest, continuous lift so technical material detail
      // and labels sit on a slightly brighter deep-grey-green field.
      const storyBackgroundMix = state.reducedMotion
        ? (state.chapter === "hero" ? 0 : 1)
        : smoothstep(rangeProgress(state.narrative, 0.82, 1.06));
      sceneBackground.lerpColors(HERO_BACKGROUND, STORY_BACKGROUND, storyBackgroundMix);
      renderer.toneMappingExposure = 1;
      key.intensity = ((0.56 + light * 0.34) + technicalLight * 0.06) * (1 - filmPrelude * 0.08);
      fill.intensity = ((0.22 + light * 0.16) + technicalLight * 0.045) * (1 - filmPrelude * 0.08);
      rim.intensity = ((0.12 + light * 0.13) + technicalLight * 0.09) * (1 - filmPrelude * 0.05);
      ambient.intensity = 0.2 + light * 0.14;
      hemisphere.intensity = 0.21 + light * 0.13;

      if (product) {
        parts.forEach((part) => {
          const isHeroPreviewPart = part.moduleId === "roof"
            || part.moduleId === "service-wall"
            || part.moduleId === "column-covers";
          const previewOffset = isHeroPreviewPart ? heroPrelude : heroPrelude * 0.14;
          part.object.position.copy(part.base).addScaledVector(part.direction, Math.max(explode, previewOffset));
        });

        const mobile = state.mobile;
        const stageX = mobile ? 0 : productSize.x * sampleShift(state.narrative);
        // Let the product travel slightly into the engineering view while the
        // camera tracks only part of that distance. The movement reads on
        // screen, but keeps the copy runway and global rail clear.
        const presentationSlide = mobile ? 0 : productSize.x * 0.12 * structurePresentation;
        product.position.x = stageX + presentationSlide;
        product.position.y = mobile
          ? productSize.y * sampleCompactY(state.narrative)
          : -productSize.y * 0.012;
        // The supplied SPD01 front elevation defines the product's true face:
        // the worktop is on the viewer's left and the door handle is on the
        // right. The authored GLB needs a -90deg yaw to reproduce that view.
        // Only the later exploded inspection adds its reversible full turn.
        const frontTurn = -Math.PI * 0.5;
        product.rotation.set(
          0,
          frontTurn + Math.PI * 2 * structureOrbit,
          0,
        );
        if (productBackdrop) {
          productBackdrop.position.set(product.position.x, product.position.y, 1.55);
          // Keep the neutral inner liner present from the first frame. It sits
          // behind the glass opening (never outside the shell) and gives the
          // black frame, handle and translucent door enough tonal separation
          // on both desktop and compact dark layouts.
          productBackdrop.visible = true;
        }

        const verticalDistance = productSize.y / (2 * Math.tan((camera.fov * Math.PI) / 360));
        const mobileMultiplier = sampleMobileDistance(state.narrative);
        const narrowDesktop = !mobile && mount.clientWidth <= 1200;
        // The compact desktop layout reserves a full header-safe frame for the
        // expanded roof and base before any construction-camera move begins.
        const desktopFit = sampleDesktopFit(state.narrative);
        const fitMultiplier = mobile
          ? mobileMultiplier
          : (narrowDesktop ? desktopFit * 1.08 : desktopFit);
        // The expanded roof/base already use the full header-safe viewport.
        // Preserve that validated fit while enlarging all assembled states.
        // Bring the technical assembly roughly 10% closer than the previous
        // conservative framing. Projection-based callouts continue to use the
        // same camera, so their anchors stay attached while the product gains
        // more visual weight on desktop and compact screens.
        const fullExplosionFit = mobile
          ? 2.28 * 1.16
          : (narrowDesktop ? 1.78 * 1.27 : 1.66 * 1.27);
        const explosionFit = 1 + explode * (fullExplosionFit / fitMultiplier - 1);
        const structureDolly = structureCamera * (mobile ? 0.045 : (narrowDesktop ? 0.028 : 0.055));
        const distance = verticalDistance
          * fitMultiplier
          * explosionFit
          * (1 - structureDolly);
        const cameraLift = productSize.y * structureCamera * (mobile ? 0.008 : (narrowDesktop ? 0.008 : 0.018));
        // Keep the booth square to the viewer. On the hero only, frame the
        // front-facing product to the right so the left editorial copy keeps
        // its clear runway; the offset eases away before construction begins.
        const heroRightFrame = mobile
          ? 0
          : productSize.x * 0.32 * (1 - smoothstep(rangeProgress(state.narrative, 0.72, 0.98)));
        const adjacentRightFrame = mobile ? 0 : productSize.x * 0.28 * adjacentProductComposition;
        const cameraStageX = stageX + presentationSlide * 0.22 + heroRightFrame + adjacentRightFrame;
        // A true 45-degree desktop top view is reserved for the latter part
        // of the 360-degree exploded inspection. Compact screens use a
        // restrained equivalent so the full booth remains visible.
        const topViewAmount = structureTopDown * (mobile ? 0.66 : 1);
        const topViewAngle = Math.PI * 0.25 * topViewAmount;
        // Pull back slightly during the diagonal frame so the exploded roof
        // and base remain inside the header-safe viewport at every width.
        const diagonalFit = 1 + referenceSweep * (mobile ? 0.025 : 0.075);
        const cameraRadius = distance * diagonalFit * (1 + topViewAmount * 0.16);
        const cameraTargetY = -productSize.y * 0.02 + cameraLift * 0.24;
        const cameraOrbitX = cameraStageX + productSize.x * referenceSweep * (mobile ? 0.018 : 0.06);
        camera.position.set(
          cameraOrbitX,
          productSize.y * 0.08 + cameraLift + cameraRadius * Math.sin(topViewAngle),
          -cameraRadius * Math.cos(topViewAngle),
        );
        camera.lookAt(cameraStageX, cameraTargetY, 0);
        // Keep the technical datum almost level. Depth now comes from the true
        // 45-degree top view and the product turn, not from a decorative roll
        // that made the assembly read like a loose cloud of parts.
        camera.rotateZ(-Math.PI * (mobile ? 0 : 0.012) * referenceSweep);
        const viewWidth = Math.max(1, mount.clientWidth);
        const viewHeight = Math.max(1, mount.clientHeight);
        const heroExtraViewShift = mobile
          ? 0
          : heroExtraShiftPx * (1 - smoothstep(rangeProgress(state.narrative, 0.72, 0.98)));
        if (heroExtraViewShift > 0.01) {
          camera.setViewOffset(viewWidth, viewHeight, -heroExtraViewShift, 0, viewWidth, viewHeight);
        } else {
          camera.clearViewOffset();
        }

        // Keep the live shell boundary available during the structure tail so
        // the acoustic field can enter against the reassembled product before
        // the next section takes ownership.
        if (state.chapter === "hero" || state.chapter === "structure" || state.chapter === "acoustic") {
          product.updateMatrixWorld(true);
          camera.updateMatrixWorld(true);
          const width = Math.max(1, mount.clientWidth);
          const height = Math.max(1, mount.clientHeight);
          const productMatrixWorld = product.matrixWorld;
          let left = Number.POSITIVE_INFINITY;
          let right = Number.NEGATIVE_INFINITY;
          let top = Number.POSITIVE_INFINITY;
          let bottom = Number.NEGATIVE_INFINITY;

          PRODUCT_BOUNDARY_SIGNS.forEach((xSign) => {
            PRODUCT_BOUNDARY_SIGNS.forEach((ySign) => {
              PRODUCT_BOUNDARY_SIGNS.forEach((zSign) => {
                projectedBoundaryCorner
                  .set(productSize.x * xSign, productSize.y * ySign, productSize.z * zSign)
                  .applyMatrix4(productMatrixWorld)
                  .project(camera);
                const x = (projectedBoundaryCorner.x * 0.5 + 0.5) * width;
                const y = (-projectedBoundaryCorner.y * 0.5 + 0.5) * height;
                left = Math.min(left, x);
                right = Math.max(right, x);
                top = Math.min(top, y);
                bottom = Math.max(bottom, y);
              });
            });
          });

          const boundary: ProductScreenBoundary = { left, right, top, bottom };
          const signature = `${left.toFixed(1)},${right.toFixed(1)},${top.toFixed(1)},${bottom.toFixed(1)}`;
          if (signature !== lastBoundarySignature) {
            lastBoundarySignature = signature;
            window.dispatchEvent(new CustomEvent<ProductScreenBoundary>(PRODUCT_BOUNDARY_EVENT, {
              detail: boundary,
            }));
          }
        }

        if (state.chapter === "structure" && guideAnchors.size) {
          product.updateMatrixWorld(true);
          camera.updateMatrixWorld(true);
          const width = Math.max(1, mount.clientWidth);
          const height = Math.max(1, mount.clientHeight);
          const targets: StructureGuideTarget[] = [];

          const projectGuideObjectBounds = (object: Object3D) => {
            projectedGuideBounds.setFromObject(object);
            if (projectedGuideBounds.isEmpty()) return undefined;

            let left = Number.POSITIVE_INFINITY;
            let right = Number.NEGATIVE_INFINITY;
            let top = Number.POSITIVE_INFINITY;
            let bottom = Number.NEGATIVE_INFINITY;

            PRODUCT_BOUNDARY_SIGNS.forEach((xSign) => {
              PRODUCT_BOUNDARY_SIGNS.forEach((ySign) => {
                PRODUCT_BOUNDARY_SIGNS.forEach((zSign) => {
                  projectedBoundaryCorner
                    .set(
                      xSign < 0 ? projectedGuideBounds.min.x : projectedGuideBounds.max.x,
                      ySign < 0 ? projectedGuideBounds.min.y : projectedGuideBounds.max.y,
                      zSign < 0 ? projectedGuideBounds.min.z : projectedGuideBounds.max.z,
                    )
                    .project(camera);
                  const x = (projectedBoundaryCorner.x * 0.5 + 0.5) * width;
                  const y = (-projectedBoundaryCorner.y * 0.5 + 0.5) * height;
                  left = Math.min(left, x);
                  right = Math.max(right, x);
                  top = Math.min(top, y);
                  bottom = Math.max(bottom, y);
                });
              });
            });

            return { left, right, top, bottom };
          };

          guideAnchors.forEach((anchor, id) => {
            const projected = anchor.object.localToWorld(anchor.localPoint.clone()).project(camera);
            targets.push({
              id,
              x: (projected.x * 0.5 + 0.5) * width,
              y: (-projected.y * 0.5 + 0.5) * height,
              visible: projected.z > -1 && projected.z < 1,
              bounds: projectGuideObjectBounds(anchor.object),
            });
          });

          const signature = targets
            .map((target) => `${target.id}:${target.x.toFixed(1)},${target.y.toFixed(1)},${target.bounds?.left.toFixed(1)},${target.bounds?.right.toFixed(1)}`)
            .join("|");
          if (signature !== lastGuideSignature) {
            lastGuideSignature = signature;
            window.dispatchEvent(new CustomEvent<StructureGuideTarget[]>(STRUCTURE_GUIDE_EVENT, {
              detail: targets,
            }));
          }
        }
      }

      renderer.render(scene, camera);
      if (!postStoryPaused) animationFrame = requestAnimationFrame(render);
    };

    const startOrStop = () => {
      const shouldRender = director.snapshot.visible && !postStoryPaused;
      if (shouldRender && !animationFrame) animationFrame = requestAnimationFrame(render);
      if (!shouldRender && animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    };

    const stageStateObserver = appRoot
      ? new MutationObserver(() => {
          postStoryPaused = appRoot.classList.contains("is-post-story");
          startOrStop();
        })
      : null;
    stageStateObserver?.observe(appRoot as HTMLElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const unsubscribe = director.subscribe(startOrStop);
    startOrStop();

    return () => {
      disposed = true;
      unsubscribe();
      stageStateObserver?.disconnect();
      resizeObserver.disconnect();
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (product) disposeObject(product);
      if (productBackdrop) disposeObject(productBackdrop);
      environmentTarget.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [director, onReady]);

  return (
    <div
      className={`webgl-stage is-${status}`}
      aria-label="Tuliko SPD01 三次元製品モデル"
    >
      <div className="product-stage-reveal" data-product-reveal>
        <img
          className="webgl-reference"
          src="/assets/products/spd01-green-hero-cutout.webp"
          alt=""
          aria-hidden="true"
        />
        <div className="webgl-mount" ref={mountRef} />
        <i className="product-intro-scan" aria-hidden="true" />
      </div>
      <span className="model-status" aria-live="polite">
        {status === "loading" ? "3Dモデルを読み込んでいます" : ""}
        {status === "error" ? "製品レンダーを表示しています" : ""}
      </span>
    </div>
  );
}
