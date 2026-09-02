import { type FormEvent, type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  List,
  Pause,
  Play,
  SpeakerHigh,
  SpeakerSlash,
} from "@phosphor-icons/react";
import { WebGLStage } from "./components/WebGLStage";
import { LoadingScreen } from "./components/LoadingScreen";
import { SiteFibers } from "./components/SiteFibers";
import { initMotionSystem } from "./lib/motion";
import {
  PRODUCT_BOUNDARY_EVENT,
  type ProductScreenBoundary,
} from "./product-boundary";
import { CHAPTER_IDS, SceneDirector, type ChapterId } from "./scene-director";
import {
  STRUCTURE_GUIDE_EVENT,
  type StructureGuideId,
  type StructureGuideTarget,
} from "./structure-guides";

const chapters: Array<{ id: ChapterId; short: string; label: string }> = [
  { id: "hero", short: "TOP", label: "トップ" },
  { id: "structure", short: "構造", label: "製品構造" },
  { id: "acoustic", short: "遮音", label: "ガラスと遮音" },
  { id: "modular", short: "構成", label: "モジュール" },
  { id: "interaction", short: "操作", label: "インタラクション" },
];

const chapterSequence = Object.fromEntries(
  chapters.map((chapter, index) => [
    chapter.id,
    {
      index: String(index + 1).padStart(2, "0"),
      label: chapter.short,
    },
  ]),
) as Record<ChapterId, { index: string; label: string }>;

const chapterSignals = {
  structure: {
    ...chapterSequence.structure,
    facts: [
      { label: "主要部品", value: "10点" },
      { label: "組立", value: "順序" },
      { label: "確認", value: "360°確認" },
    ],
  },
  acoustic: {
    ...chapterSequence.acoustic,
    facts: [
      { label: "入力", value: "外側" },
      { label: "境界", value: "固定ガラス" },
      { label: "出力", value: "静かな側" },
    ],
  },
  modular: {
    ...chapterSequence.modular,
    facts: [
      { label: "構成", value: "5分類" },
      { label: "移設", value: "再構成" },
      { label: "拡張", value: "拡張対応" },
    ],
  },
  interaction: {
    ...chapterSequence.interaction,
    facts: [
      { label: "入室", value: "動線" },
      { label: "作業", value: "デスク" },
      { label: "照明", value: "室内灯" },
    ],
  },
} as const;

const BRAND_NAME = "Tuliko";
const BRAND_LOGO_SRC = "/assets/brand/tuliko-logo.png";
const sitePages = [
  { href: "/about/", label: "Tulikoについて" },
  { href: "/business/", label: "製品・事業" },
  { href: "/cases/", label: "配置検討例" },
  { href: "/news/", label: "更新情報" },
  { href: "/contact/", label: "お問い合わせ" },
] as const;

const partLabels = [
  // Reference-inspired technical labels attach to the nearest clear side of
  // the live component envelope. Their leaders stay horizontal, never pass
  // through the assembly, and follow the deterministic GLB projection.
  { index: "01", id: "roof", name: "天板", x: 83, y: 18, anchor: "right", offset: -12, cue: 0.32, orbitCue: 0.765, orbitAnchor: "right", edgeSource: "roof", fallback: [73, 10] },
  { index: "02", id: "base", name: "底座", x: 42, y: 90, anchor: "left", offset: -9, cue: 0.425, edgeSource: "base", fallback: [39, 75] },
  { index: "03", id: "columns", name: "支柱", x: 69, y: 60, anchor: "right", offset: -16, cue: 0.365, edgeSource: "acousticPanel", fallback: [73, 40] },
  { index: "04", id: "sidePanel", name: "側板", x: 69, y: 65, anchor: "right", offset: -18, cue: 0.335, orbitCue: 0.605, orbitAnchor: "right", edgeSource: "sidePanel", fallback: [73, 48] },
  { index: "05", id: "frontDoor", name: "前扉", x: 43, y: 70, anchor: "left", offset: 9, cue: 0.395, edgeSource: "sidePanel", fallback: [39, 49] },
  { index: "06", id: "fixedGlass", name: "固定ガラス", x: 56.5, y: 30, anchor: "right", offset: 10, cue: 0.38, orbitCue: 0.715, orbitAnchor: "right", edgeSource: "acousticPanel", fallback: [73, 48] },
  { index: "07", id: "acousticPanel", name: "吸音内板", x: 30, y: 42, anchor: "left", offset: 38, cue: 0.41, orbitCue: 0.665, orbitAnchor: "right", edgeSource: "sidePanel", fallback: [39, 50] },
  { index: "08", id: "desk", name: "デスク", x: 30, y: 80, anchor: "left", offset: -13, cue: 0.44, edgeSource: "sidePanel", fallback: [39, 50] },
  { index: "09", id: "carpet", name: "床カーペット", x: 38, y: 85, anchor: "left", offset: 9, cue: 0.455, edgeSource: "carpet", fallback: [39, 78] },
  { index: "10", id: "lighting", name: "照明", x: 83, y: 12, anchor: "right", offset: 10, cue: 0.47, edgeSource: "roof", fallback: [73, 8] },
] as const;

const incomingWaves = [
  { y: 18, amplitude: 6.8, energyWidth: 4.4, coreWidth: 1.5, opacity: 0.68 },
  { y: 34, amplitude: 7.4, energyWidth: 4.8, coreWidth: 1.65, opacity: 0.78 },
  { y: 50, amplitude: 6.2, energyWidth: 4.4, coreWidth: 1.55, opacity: 0.68 },
  { y: 66, amplitude: 8.4, energyWidth: 5.4, coreWidth: 1.8, opacity: 0.84 },
  { y: 82, amplitude: 11.2, energyWidth: 6.8, coreWidth: 2.05, opacity: 1 },
];

const soundLanes = [18, 34, 50, 66, 82] as const;

const staticGlassDots = [
  { cx: 46.2, cy: 52.1, r: 0.72 },
  { cx: 48.6, cy: 52.3, r: 0.9 },
  { cx: 51, cy: 52.4, r: 1.05 },
  { cx: 53.5, cy: 52.5, r: 0.9 },
  { cx: 55.9, cy: 52.6, r: 0.72 },
] as const;

const incomingWavePath = (y: number, amplitude: number, phase = 1) => (
  `M0 ${y} C6 ${y} 9 ${y - amplitude * 0.34 * phase} 16 ${y - amplitude * 0.34 * phase} C23 ${y - amplitude * 0.34 * phase} 25 ${y + amplitude * phase} 34 ${y + amplitude * phase} C43 ${y + amplitude * phase} 45 ${y - amplitude * 0.8 * phase} 54 ${y - amplitude * 0.8 * phase} C63 ${y - amplitude * 0.8 * phase} 66 ${y + amplitude * 0.54 * phase} 75 ${y + amplitude * 0.54 * phase} C83 ${y + amplitude * 0.54 * phase} 86 ${y - amplitude * 0.26 * phase} 93 ${y - amplitude * 0.26 * phase} C97 ${y - amplitude * 0.26 * phase} 98 ${y} 100 ${y}`
);

const attenuatedWavePath = (y: number, amplitude: number) => (
  `M0 ${y} C11 ${y} 15 ${y - amplitude} 25 ${y - amplitude} C35 ${y - amplitude} 38 ${y + amplitude * 0.78} 49 ${y + amplitude * 0.78} C60 ${y + amplitude * 0.78} 64 ${y - amplitude * 0.52} 74 ${y - amplitude * 0.52} C84 ${y - amplitude * 0.52} 89 ${y + amplitude * 0.3} 100 ${y}`
);

const transmittedWavePath = (y: number, amplitude: number) => (
  `M0 ${y} C12 ${y} 16 ${y - amplitude} 28 ${y - amplitude} C40 ${y - amplitude} 44 ${y + amplitude * 0.68} 56 ${y + amplitude * 0.68} C68 ${y + amplitude * 0.68} 72 ${y - amplitude * 0.38} 84 ${y - amplitude * 0.38} C92 ${y - amplitude * 0.38} 96 ${y} 100 ${y}`
);

function Brand() {
  return (
    <a className="brand" href="#hero" aria-label={`${BRAND_NAME} トップへ`}>
      <img className="brand-logo" src={BRAND_LOGO_SRC} alt={BRAND_NAME} />
    </a>
  );
}

function Header({ onRouteChange }: { onRouteChange: (event: MouseEvent<HTMLAnchorElement>) => void }) {
  return (
    <header className="site-header">
      <Brand />
      <nav aria-label="メインナビゲーション">
        <div className="header-page-links">
          {sitePages.map((page) => (
            <a href={page.href} key={page.href} onClick={onRouteChange}>{page.label}</a>
          ))}
        </div>
        <details className="header-menu">
          <summary><List weight="bold" /> メニュー</summary>
          <div className="header-menu-panel">
            {sitePages.map((page) => (
              <a href={page.href} key={page.href} onClick={onRouteChange}>{page.label}</a>
            ))}
          </div>
        </details>
        <a className="header-cta" href="#consultation">
          導入相談 <ArrowUpRight weight="bold" />
        </a>
      </nav>
    </header>
  );
}

function AcousticField() {
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return undefined;
    let waveTrackFrame = 0;
    let currentGlassTop = 0;

    const syncWaveTrack = () => {
      const incomingRect = field.querySelector<SVGSVGElement>(".incoming-wave")?.getBoundingClientRect();
      if (!incomingRect || incomingRect.height <= 0) return;
      field.style.setProperty("--glass-wave-track-top", `${(incomingRect.top - currentGlassTop).toFixed(2)}px`);
      field.style.setProperty("--glass-wave-track-height", `${incomingRect.height.toFixed(2)}px`);
    };

    const scheduleWaveTrackSync = () => {
      window.cancelAnimationFrame(waveTrackFrame);
      waveTrackFrame = window.requestAnimationFrame(syncWaveTrack);
    };

    const updateBoundary = (event: Event) => {
      const boundary = (event as CustomEvent<ProductScreenBoundary>).detail;
      if (!boundary || boundary.right <= boundary.left || boundary.bottom <= boundary.top) return;
      const width = boundary.right - boundary.left;
      const height = boundary.bottom - boundary.top;
      const glassTop = boundary.top + height * 0.09;
      const glassHeight = height * 0.79;
      currentGlassTop = glassTop;

      field.style.setProperty("--acoustic-shell-left", `${boundary.left.toFixed(2)}px`);
      field.style.setProperty("--acoustic-shell-right", `${boundary.right.toFixed(2)}px`);
      field.style.setProperty("--acoustic-glass-left", `${(boundary.left + width * 0.22).toFixed(2)}px`);
      field.style.setProperty("--acoustic-glass-top", `${glassTop.toFixed(2)}px`);
      field.style.setProperty("--acoustic-glass-width", `${(width * 0.6).toFixed(2)}px`);
      field.style.setProperty("--acoustic-glass-height", `${glassHeight.toFixed(2)}px`);
      field.style.setProperty("--acoustic-gate-top", `${(boundary.top + height * 0.1).toFixed(2)}px`);
      field.style.setProperty("--acoustic-gate-height", `${(height * 0.8).toFixed(2)}px`);

      // The outside, glass and quiet-side waves share one screen-space lane
      // system. Keep the full-height glass mask for reflections, but map its
      // nested SVG to the actual incoming-wave rectangle so every baseline
      // meets the same y coordinate at both glass boundaries.
      scheduleWaveTrackSync();
    };

    window.addEventListener(PRODUCT_BOUNDARY_EVENT, updateBoundary);
    window.addEventListener("resize", scheduleWaveTrackSync);
    return () => {
      window.cancelAnimationFrame(waveTrackFrame);
      window.removeEventListener(PRODUCT_BOUNDARY_EVENT, updateBoundary);
      window.removeEventListener("resize", scheduleWaveTrackSync);
    };
  }, []);

  return (
    <div
      id="acoustic-visual"
      className="acoustic-field"
      aria-hidden="true"
      ref={fieldRef}
    >
      <div className="quiet-field-haze quiet-field-haze-left" />

      <svg className="incoming-wave" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="incoming-energy-gradient" x1="0" x2="1">
            <stop offset="0" stopColor="var(--color-wave-red-dark)" stopOpacity="0.05" />
            <stop offset="0.46" stopColor="var(--color-wave-red)" stopOpacity="0.3" />
            <stop offset="1" stopColor="var(--color-wave-red-warm)" stopOpacity="0.13" />
          </linearGradient>
          <linearGradient id="incoming-core-gradient" x1="0" x2="1">
            <stop offset="0" stopColor="var(--color-wave-red-dark)" stopOpacity="0.58" />
            <stop offset="0.58" stopColor="var(--color-wave-red)" stopOpacity="1" />
            <stop offset="1" stopColor="var(--color-wave-red-warm)" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {incomingWaves.map(({ y, amplitude, energyWidth, coreWidth, opacity }, index) => (
          <g className="incoming-wave-lane wave-motion-lane" key={`incoming-lane-${index}`}>
            <path className="incoming-wave-baseline" d={`M0 ${y} H100`} />
            <path
              className="incoming-wave-energy"
              d={incomingWavePath(y, amplitude)}
              style={{ "--energy-width": `${energyWidth}px`, "--lane-opacity": opacity } as React.CSSProperties}
            />
            <path
              className="incoming-wave-contour"
              d={incomingWavePath(y, amplitude * 0.62)}
              style={{ "--lane-opacity": opacity } as React.CSSProperties}
            />
            <path
              className="incoming-wave-line"
              d={incomingWavePath(y, amplitude)}
              style={{ "--core-width": `${coreWidth}px`, "--lane-opacity": opacity } as React.CSSProperties}
            />
            <path
              className="incoming-wave-flow wave-flow-line"
              d={incomingWavePath(y, amplitude)}
              pathLength={100}
              style={{ "--lane-opacity": opacity } as React.CSSProperties}
            />
          </g>
        ))}
        <path className="incoming-wave-boundary" d="M99 7 V93" />
      </svg>

      <svg className="outgoing-wave" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="outgoing-wave-gradient" x1="0" x2="1">
            <stop offset="0" stopColor="var(--color-wave-sage-bright)" stopOpacity="0.8" />
            <stop offset="0.58" stopColor="var(--color-wave-sage)" stopOpacity="0.62" />
            <stop offset="1" stopColor="var(--color-wave-sage-muted)" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        {soundLanes.map((y, index) => (
          <g className="outgoing-wave-lane wave-motion-lane" key={`outgoing-lane-${y}`}>
            <path className="outgoing-wave-baseline" d={`M0 ${y} H100`} />
            <path
              className="outgoing-wave-line"
              d={transmittedWavePath(y, 2.2 - index * 0.12)}
              style={{ "--lane-opacity": 0.82 - index * 0.08 } as React.CSSProperties}
            />
            <path
              className="outgoing-wave-flow wave-flow-line"
              d={transmittedWavePath(y, 2.2 - index * 0.12)}
              pathLength={100}
              style={{ "--lane-opacity": 0.82 - index * 0.08 } as React.CSSProperties}
            />
          </g>
        ))}
      </svg>

      <div className="glass-wave-mask">
        <div className="interior-light-wash" />
        <div className="glass-wave-track">
          <svg className="glass-wave-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="wave-line-gradient" x1="0" x2="1">
                <stop offset="0" stopColor="var(--color-wave-sage-bright)" stopOpacity="0" />
                <stop offset="0.2" stopColor="var(--color-wave-sage-bright)" stopOpacity="0.88" />
                <stop offset="0.8" stopColor="var(--color-wave-sage)" stopOpacity="0.78" />
                <stop offset="1" stopColor="var(--color-wave-sage-muted)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g className="glass-wave-lines">
              {soundLanes.map((y, index) => (
                <g className="quiet-glass-lane wave-motion-lane" key={`glass-lane-${y}`}>
                  <path className="quiet-glass-baseline" d={`M0 ${y} H100`} />
                  <path
                    className="quiet-glass-line"
                    d={attenuatedWavePath(y, 3.2 - index * 0.16)}
                    style={{ "--lane-opacity": 0.78 - index * 0.06 } as React.CSSProperties}
                  />
                  <path
                    className="quiet-glass-flow wave-flow-line"
                    d={attenuatedWavePath(y, 3.2 - index * 0.16)}
                    pathLength={100}
                    style={{ "--lane-opacity": 0.78 - index * 0.06 } as React.CSSProperties}
                  />
                </g>
              ))}
            </g>
            <path
              id="glass-wave-path"
              className="glass-wave-path"
              d="M14 53 C28 48 42 49 51 52 C62 56 74 54 88 48"
            />
            <path
              id="glass-wave-quiet-target"
              className="wave-target"
              d="M14 51.5 C31 50.5 39 51 51 51.5 C64 52 74 51.8 88 50.5"
            />
            <g className="wave-static-dots">
              {staticGlassDots.map((dot, index) => (
                <circle cx={dot.cx} cy={dot.cy} r={dot.r} key={index} />
              ))}
            </g>
          </svg>
        </div>
        <div className="hero-light-scan" />
        <div className="glass-reflection" />
      </div>

    </div>
  );
}

function ProductFeatureNotes() {
  return (
    <div className="product-feature-notes">
      <article className="product-feature-note is-panel">
        <span className="product-feature-index">01</span>
        <strong>吸音内板</strong>
        <p>反響音をやわらげ、<br />クリアな会話を支えます。</p>
        <i className="product-feature-leader" />
      </article>
      <article className="product-feature-note is-glass">
        <span className="product-feature-index">02</span>
        <strong>固定ガラス</strong>
        <p>音を守りつつ、<br />開放感を保ちます。</p>
        <i className="product-feature-leader" />
      </article>
      <article className="product-feature-note is-ventilation">
        <span className="product-feature-index">03</span>
        <strong>換気システム</strong>
        <p>静音設計で、<br />長時間でも快適に。</p>
        <i className="product-feature-leader" />
      </article>
    </div>
  );
}

function StructureGuides() {
  const rootRef = useRef<HTMLDivElement>(null);
  const targetsRef = useRef(new Map<StructureGuideId, StructureGuideTarget>());

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const updateTargets = (event: Event) => {
      const targets = (event as CustomEvent<StructureGuideTarget[]>).detail;
      const bounds = root.getBoundingClientRect();
      if (!targets || bounds.width <= 0 || bounds.height <= 0) return;
      const storyRoot = root.closest<HTMLElement>(".app");
      const structureProgress = Number.parseFloat(
        storyRoot ? getComputedStyle(storyRoot).getPropertyValue("--structure-guide-progress") : "0",
      ) || 0;
      const eased = (value: number) => {
        const clamped = Math.min(1, Math.max(0, value));
        return clamped * clamped * (3 - 2 * clamped);
      };

      targets.forEach((target) => targetsRef.current.set(target.id, target));
      const visibleTargets = [...targetsRef.current.values()].filter((target) => (
        target.visible
        && target.x > bounds.left
        && target.x < bounds.right
        && target.y > bounds.top
        && target.y < bounds.bottom
      ));
      if (!visibleTargets.length) return;

      targets.forEach((target) => {
        const part = partLabels.find((candidate) => candidate.id === target.id);
        const line = root.querySelector<SVGPathElement>(`[data-guide-line="${target.id}"]`);
        const marker = root.querySelector<SVGSVGElement>(`[data-guide-marker="${target.id}"]`);
        const label = root.querySelector<HTMLElement>(`[data-guide-label="${target.id}"]`);
        if (!part || !line || !marker || !label) return;

        const frontCueIn = eased((structureProgress - part.cue) / 0.024);
        const frontCueOut = 1 - eased((structureProgress - (part.cue + 0.12)) / 0.038);
        const frontCueVisibility = frontCueIn * frontCueOut;
        const orbitCue = "orbitCue" in part ? part.orbitCue : undefined;
        const orbitCueVisibility = orbitCue === undefined
          ? 0
          : eased((structureProgress - orbitCue) / 0.016)
            * (1 - eased((structureProgress - (orbitCue + 0.052)) / 0.02));
        const resolvedAnchor = orbitCueVisibility > frontCueVisibility && "orbitAnchor" in part
          ? part.orbitAnchor
          : part.anchor;

        const edgePixelX = target.bounds
          ? (resolvedAnchor === "left"
            ? target.bounds.left - bounds.left
            : target.bounds.right - bounds.left)
          : target.x - bounds.left;
        // Give every callout its own horizontal lane, but keep the endpoint
        // inside the projected vertical envelope of the named component.
        // This avoids two adjacent leaders visually merging into one line
        // across the product while retaining a direct component connection.
        const rawEdgePixelY = target.y - bounds.top + part.offset;
        const edgePixelY = target.bounds
          ? Math.max(
            target.bounds.top - bounds.top + 6,
            Math.min(rawEdgePixelY, target.bounds.bottom - bounds.top - 6),
          )
          : rawEdgePixelY;
        const targetX = (edgePixelX / bounds.width) * 640;
        const targetY = (edgePixelY / bounds.height) * 600;
        const labelPixelX = resolvedAnchor === "left"
          ? Math.max(112, Math.min(edgePixelX - 18, bounds.width * 0.43))
          : Math.min(bounds.width - 112, Math.max(edgePixelX + 18, bounds.width * 0.57));
        const startX = (labelPixelX / bounds.width) * 640;
        const startY = targetY;
        const withinStage = target.visible
          && targetX > 0
          && targetX < 640
          && targetY > 0
          && targetY < 600;

        // The first pass reads the stable front elevation; the second pass
        // singles out four envelope components during the 360-degree view.
        // A rear or side panel crossing the camera now carries an explanation
        // instead of reading as an arbitrary obstruction.
        const cueVisibility = Math.max(frontCueVisibility, orbitCueVisibility);
        const opacity = withinStage ? cueVisibility.toFixed(3) : "0";
        line.style.opacity = opacity;
        // Leaders terminate at the silhouette; the former ring marker obscured
        // the component edge and made the exploded assembly harder to read.
        marker.style.opacity = "0";
        label.style.opacity = opacity;
        label.classList.toggle("is-left", resolvedAnchor === "left");
        label.classList.toggle("is-right", resolvedAnchor === "right");
        label.style.setProperty("--label-x", `${labelPixelX.toFixed(2)}px`);
        label.style.setProperty("--label-y", `${edgePixelY.toFixed(2)}px`);
        line.setAttribute("d", `M${startX} ${startY} L${targetX} ${targetY}`);
        marker.style.setProperty("--target-x", `${edgePixelX.toFixed(2)}px`);
        marker.style.setProperty("--target-y", `${edgePixelY.toFixed(2)}px`);
      });
    };

    window.addEventListener(STRUCTURE_GUIDE_EVENT, updateTargets);
    return () => window.removeEventListener(STRUCTURE_GUIDE_EVENT, updateTargets);
  }, []);

  return (
    <div className="structure-guides" aria-hidden="true" ref={rootRef}>
      <svg className="guide-line-layer" viewBox="0 0 640 600" preserveAspectRatio="none">
        {partLabels.map((part) => {
          const startX = (part.x / 100) * 640;
          const startY = (part.y / 100) * 600;
          const targetX = (part.fallback[0] / 100) * 640;
          const targetY = (part.fallback[1] / 100) * 600;
          return (
            <path
              className="guide-line"
              data-guide-line={part.id satisfies StructureGuideId}
              d={`M${startX} ${startY} L${targetX} ${startY}`}
              key={part.id}
            />
          );
        })}
      </svg>
      {partLabels.map((part) => (
        <svg
          className="guide-target-marker"
          data-guide-marker={part.id satisfies StructureGuideId}
          viewBox="0 0 16 16"
          key={`marker-${part.id}`}
        >
          <circle className="guide-target-ring" cx="8" cy="8" r="5.75" />
          <circle className="guide-target-dot" cx="8" cy="8" r="1.65" />
        </svg>
      ))}
      {partLabels.map((part) => (
        <span
          className={`part-label is-${part.anchor}`}
          data-guide-label={part.id}
          data-index={part.index}
          style={{ "--label-x": `${part.x}%`, "--label-y": `${part.y}%` } as React.CSSProperties}
          key={part.name}
        >
          {part.name}
        </span>
      ))}
    </div>
  );
}

function ProgressRail() {
  return (
    <nav className="progress-rail" data-progress-rail aria-label="ページ進捗">
      <div className="progress-track">
        <i className="progress-cursor" data-progress-cursor />
        {chapters.map((chapter, index) => (
          <a
            href={`#${chapter.id}`}
            data-progress-anchor={chapter.id}
            aria-label={chapter.label}
            key={chapter.id}
          >
            <i />
            <span><b>{String(index + 1).padStart(2, "0")}</b>{chapter.short}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}

function HeroTitle() {
  return (
    <h1 id="hero-title">
      静けさを、<br />仕事の中心に。
    </h1>
  );
}

function ChapterSignal({
  index,
  label,
}: {
  index: string;
  label: string;
  facts: readonly { label: string; value: string }[];
}) {
  return (
    <p className="chapter-sequence" aria-label={`製品ストーリー ${index} ${label}`}>
      <span>{index}</span>
      <strong>{label}</strong>
      <i>{String(chapters.length).padStart(2, "0")}</i>
    </p>
  );
}

function ChapterSignalFacts({ facts }: { facts: readonly { label: string; value: string }[] }) {
  return (
    <dl className="chapter-facts">
      {facts.map((fact) => (
        <div key={fact.label}>
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function VideoPrelude({ onActiveChange }: { onActiveChange: (active: boolean) => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPausedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let shouldAutoPlay = false;

    const syncPlayingState = () => setIsPlaying(!video.paused && !video.ended);
    const playWhenAllowed = () => {
      if (reduceMotion || document.hidden || !shouldAutoPlay || userPausedRef.current || !video.muted) return;
      void video.play().catch(() => setIsPlaying(false));
    };
    const handleVisibility = () => {
      if (document.hidden) video.pause();
      else playWhenAllowed();
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      const active = entry.isIntersecting && entry.intersectionRatio > 0.08;
      shouldAutoPlay = entry.isIntersecting && entry.intersectionRatio >= 0.5;
      onActiveChange(active);
      if (shouldAutoPlay) playWhenAllowed();
      else video.pause();
    }, { threshold: [0, 0.08, 0.5, 1] });

    video.addEventListener("play", syncPlayingState);
    video.addEventListener("pause", syncPlayingState);
    video.addEventListener("ended", syncPlayingState);
    document.addEventListener("visibilitychange", handleVisibility);
    observer.observe(section);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      video.removeEventListener("play", syncPlayingState);
      video.removeEventListener("pause", syncPlayingState);
      video.removeEventListener("ended", syncPlayingState);
      video.pause();
    };
  }, [onActiveChange]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPausedRef.current = false;
      void video.play().catch(() => setIsPlaying(false));
    } else {
      userPausedRef.current = true;
      video.pause();
    }
  };

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    if (!nextMuted && video.volume > 0.7) video.volume = 0.7;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  return (
    <section
      className="video-prelude"
      id="video-intro"
      ref={sectionRef}
      aria-labelledby="video-intro-title"
    >
      <div className="video-prelude-media">
        <video
          ref={videoRef}
          muted={isMuted}
          loop
          playsInline
          preload="auto"
          poster="/assets/video/spd01-noise-to-quiet-poster.jpg"
          aria-describedby="video-intro-description"
        >
          <source src="/assets/video/spd01-noise-to-quiet.mp4" type="video/mp4" />
          お使いのブラウザーでは動画を再生できません。
          <a href="/assets/video/spd01-noise-to-quiet.mp4">SPD01 製品映像を開く</a>
        </video>
        <div className="video-prelude-meta">
          <span>SPD01</span>
          <h2 id="video-intro-title">
            騒がしさの向こうに、<br />静かな仕事場を。
          </h2>
          <p id="video-intro-description">
            オフィスの喧騒から静音ブースへ。音の変化：オフィス環境音 → ブース内の静かな状態。
          </p>
          <nav className="video-prelude-paths" aria-label="製品情報へのショートカット">
            <a href="#structure">構造を見る</a>
            <a href="#product-skus">製品を選ぶ</a>
            <a href="#consultation">導入相談</a>
          </nav>
        </div>
        <div className="video-prelude-controls" role="group" aria-label="製品映像の操作">
          <button
            className="video-prelude-control"
            type="button"
            onClick={togglePlayback}
            aria-label={isPlaying ? "製品映像を一時停止" : "製品映像を再生"}
          >
            {isPlaying ? <Pause weight="fill" /> : <Play weight="fill" />}
            <span>{isPlaying ? "一時停止" : "再生"}</span>
          </button>
          <button
            className="video-prelude-control"
            type="button"
            onClick={toggleSound}
            aria-label={isMuted ? "製品映像の音声をオン" : "製品映像の音声をオフ"}
            aria-pressed={!isMuted}
          >
            {isMuted ? <SpeakerSlash weight="fill" /> : <SpeakerHigh weight="fill" />}
            <span>{isMuted ? "音声オン" : "音声オフ"}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

const productFilms = [
  {
    id: "space",
    index: "01",
    label: "設置空間",
    duration: "05 SEC",
    title: ["設置空間で見る、", "SPD01。"],
    description: "実際のオフィスに置いたときの大きさと内部空間を、映像で確認できます。",
    hlsSrc: "/assets/video/hls/space/index.m3u8",
    fallbackSrc: "/assets/video/spd01-office-textfree-v3.mp4",
    poster: "/assets/video/spd01-office-textfree-v3-poster.webp",
  },
  {
    id: "structure",
    index: "02",
    label: "構造",
    duration: "05 SEC",
    title: ["構造を、", "動きで見る。"],
    description: "天板、フレーム、ガラス、外装パネルが分かれていく順序から、組み替え式の構造を確認できます。",
    hlsSrc: "/assets/video/hls/structure/index.m3u8",
    fallbackSrc: "/assets/video/spd01-structure-textfree-v1.mp4",
    poster: "/assets/video/spd01-structure-textfree-v1-poster.webp",
  },
  {
    id: "focus",
    index: "03",
    label: "使用イメージ",
    duration: "10 SEC",
    title: ["静けさの中で、", "仕事に集中する。"],
    description: "オフィスの中で着席し、作業へ移るまでの距離感と使い心地を映像で確認できます。",
    hlsSrc: "/assets/video/hls/focus/index.m3u8",
    fallbackSrc: "/assets/video/spd01-focus-textfree-v1.mp4",
    poster: "/assets/video/spd01-focus-textfree-v1-poster.webp",
  },
] as const;

function ProductFilmSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeFilmIndex, setActiveFilmIndex] = useState(0);
  const activeFilm = productFilms[activeFilmIndex];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    let disposed = false;
    let hlsInstance: import("hls.js").default | null = null;

    const loadFallback = () => {
      if (disposed) return;
      hlsInstance?.destroy();
      hlsInstance = null;
      video.src = activeFilm.fallbackSrc;
      video.load();
    };

    const loadStream = async () => {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = activeFilm.hlsSrc;
        video.load();
        return;
      }

      try {
        const { default: Hls } = await import("hls.js");
        if (disposed) return;
        if (!Hls.isSupported()) {
          loadFallback();
          return;
        }

        const instance = new Hls({
          enableWorker: true,
          startLevel: -1,
        });
        hlsInstance = instance;
        instance.loadSource(activeFilm.hlsSrc);
        instance.attachMedia(video);
        instance.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) loadFallback();
        });
      } catch {
        loadFallback();
      }
    };

    void loadStream();

    return () => {
      disposed = true;
      hlsInstance?.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [activeFilm.fallbackSrc, activeFilm.hlsSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const pauseWhenHidden = () => {
      if (document.hidden) video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      const isReadable = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.34);
      video.controls = isReadable;
      if (!isReadable) video.pause();
    }, { threshold: [0, 0.34] });

    observer.observe(video);
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", pauseWhenHidden);
      video.pause();
    };
  }, []);

  return (
    <section
      className="post-story-section product-film-section"
      id="product-film"
      data-next-target="product-skus"
      aria-labelledby="product-film-title"
    >
      <figure className="product-film">
        <div className="product-film-media">
          <figcaption className="product-film-caption">
            <p className="product-film-eyebrow">FILM {activeFilm.index} / {String(productFilms.length).padStart(2, "0")}</p>
            <h2 id="product-film-title">{activeFilm.title[0]}<br />{activeFilm.title[1]}</h2>
            <p id="product-film-description">{activeFilm.description}</p>
          </figcaption>
          <video
            ref={videoRef}
            controls
            playsInline
            preload="metadata"
            poster={activeFilm.poster}
            aria-describedby="product-film-description"
            data-stream-source={activeFilm.hlsSrc}
          >
            お使いのブラウザーでは動画を再生できません。
            <a href={activeFilm.hlsSrc}>HLS製品映像を開く</a>
          </video>
          <div className="product-film-selector" role="group" aria-label="製品映像を選択">
            {productFilms.map((film, index) => (
              <button
                className={index === activeFilmIndex ? "is-active" : ""}
                type="button"
                key={film.id}
                onClick={() => setActiveFilmIndex(index)}
                aria-pressed={index === activeFilmIndex}
              >
                <span className="product-film-selector-index">{film.index}</span>
                <span className="product-film-selector-label">{film.label}</span>
                <span className="product-film-selector-duration">{film.duration}</span>
              </button>
            ))}
          </div>
        </div>
      </figure>
    </section>
  );
}

function CompanyProfile() {
  return (
    <section className="company-profile" id="company-info" aria-labelledby="company-profile-title">
      <div className="company-profile-heading">
        <h3 id="company-profile-title">製品・相談窓口</h3>
        <span>確認済み情報</span>
      </div>
      <dl>
        <div>
          <dt>ブランド</dt>
          <dd>{BRAND_NAME}</dd>
        </div>
        <div>
          <dt>製品分野</dt>
          <dd>静音ワークブース</dd>
        </div>
        <div>
          <dt>製品</dt>
          <dd>SPD01</dd>
        </div>
        <div>
          <dt>相談窓口</dt>
          <dd><a href="mailto:contact@snapod.jp">contact@snapod.jp</a></dd>
        </div>
      </dl>
      <p>対応地域、搬入条件、設置条件は、設置場所に応じて個別に確認します。</p>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer-rich" id="site-footer" aria-label="フッター">
      <div className="footer-main">
        <div className="footer-brand-column">
          <Brand />
          <p>組み替え式 静音ワークブース</p>
          <a className="footer-contact" href="mailto:contact@snapod.jp">
            <span>相談窓口</span>
            contact@snapod.jp
          </a>
        </div>

        <nav className="footer-nav footer-product-nav" aria-label="製品ナビゲーション">
          <h3>製品</h3>
          <div className="footer-link-grid">
            <a href="#hero">SPD01</a>
            <a href="#structure">製品構造</a>
            <a href="#acoustic">ガラスと遮音</a>
            <a href="#modular">モジュール構成</a>
            <a href="#interaction">操作体験</a>
            <a href="#product-film">製品映像</a>
            <a href="#product-skus">製品SKU</a>
          </div>
        </nav>

        <nav className="footer-nav footer-guide-nav" aria-label="ご案内">
          <h3>ご案内</h3>
          <div className="footer-guide-links">
            <a href="#consultation">導入相談</a>
            <a href="/about/">Tulikoについて</a>
            <a href="/business/">製品・事業</a>
            <a href="/cases/">配置検討例</a>
            <a href="/news/">更新情報</a>
            <a href="/contact/">お問い合わせ</a>
          </div>
        </nav>
      </div>

      <div className="footer-bottom">
        <span>© {BRAND_NAME}</span>
        <span>静けさを、仕事の中心に。</span>
        <a href="#hero">ページ上部へ <ArrowUpRight weight="bold" /></a>
      </div>
    </footer>
  );
}

type ProductSku = "SPD01" | "SPD02" | "SPD03" | "SPD04" | "SPD07" | "SPD08" | "SPD09" | "SPD12" | "SPD14";
type ProductColor = "greyGreen" | "earthBrown" | "softRed" | "black" | "white" | "khaki" | "shadowGrey" | "ars" | "gxs" | "glossGrey";

const productColors: Record<ProductColor, { label: string; swatch: string }> = {
  greyGreen: { label: "灰緑", swatch: "#8ea194" },
  earthBrown: { label: "土褐", swatch: "#79675c" },
  softRed: { label: "米紅", swatch: "#b47864" },
  black: { label: "黒", swatch: "#232524" },
  white: { label: "白", swatch: "#dad9d4" },
  khaki: { label: "カーキ", swatch: "#b5aa8c" },
  shadowGrey: { label: "陰影グレー", swatch: "#757a7b" },
  ars: { label: "ARS", swatch: "#a76558" },
  gxs: { label: "GXS", swatch: "#b28a3c" },
  glossGrey: { label: "光沢グレー", swatch: "#aeb4ae" },
};

interface ProductVariant {
  color: ProductColor;
  image: string;
}

interface ProductSkuConfig {
  sku: ProductSku;
  label: string;
  variants: readonly ProductVariant[];
}

const productSkus: readonly ProductSkuConfig[] = [
  {
    sku: "SPD01",
    label: "一人用・直線デスク",
    variants: [
      { color: "greyGreen", image: "/assets/products/catalog/spd01-grey-green.webp" },
      { color: "earthBrown", image: "/assets/products/catalog/spd01-earth-brown.webp" },
      { color: "softRed", image: "/assets/products/catalog/spd01-soft-red.webp" },
      { color: "black", image: "/assets/products/catalog/spd01-black.webp" },
    ],
  },
  {
    sku: "SPD02",
    label: "一人用・L型デスク",
    variants: [
      { color: "white", image: "/assets/products/catalog/spd02-white.webp" },
      { color: "khaki", image: "/assets/products/catalog/spd02-khaki.webp" },
      { color: "shadowGrey", image: "/assets/products/catalog/spd02-shadow-grey.webp" },
    ],
  },
  {
    sku: "SPD03",
    label: "一人用・昇降デスク",
    variants: [
      { color: "ars", image: "/assets/products/catalog/spd03-ars.webp" },
      { color: "gxs", image: "/assets/products/catalog/spd03-gxs.webp" },
      { color: "glossGrey", image: "/assets/products/catalog/spd03-gloss-grey.webp" },
    ],
  },
  {
    sku: "SPD04",
    label: "一人用・ラウンジチェア",
    variants: [
      { color: "greyGreen", image: "/assets/products/catalog/spd04-grey-green.webp" },
      { color: "earthBrown", image: "/assets/products/catalog/spd04-earth-brown.webp" },
      { color: "softRed", image: "/assets/products/catalog/spd04-soft-red.webp" },
    ],
  },
  {
    sku: "SPD07",
    label: "二人用・ミーティング",
    variants: [
      { color: "white", image: "/assets/products/catalog/spd07-white.webp" },
      { color: "shadowGrey", image: "/assets/products/catalog/spd07-shadow-grey.webp" },
      { color: "black", image: "/assets/products/catalog/spd07-black.webp" },
    ],
  },
  {
    sku: "SPD08",
    label: "二人用・昇降デスク",
    variants: [
      { color: "ars", image: "/assets/products/catalog/spd08-ars.webp" },
      { color: "gxs", image: "/assets/products/catalog/spd08-gxs.webp" },
      { color: "glossGrey", image: "/assets/products/catalog/spd08-gloss-grey.webp" },
      { color: "khaki", image: "/assets/products/catalog/spd08-khaki.webp" },
    ],
  },
  {
    sku: "SPD09",
    label: "小型ミーティング",
    variants: [
      { color: "ars", image: "/assets/products/catalog/spd09-ars.webp" },
      { color: "gxs", image: "/assets/products/catalog/spd09-gxs.webp" },
      { color: "greyGreen", image: "/assets/products/catalog/spd09-grey-green.webp" },
      { color: "glossGrey", image: "/assets/products/catalog/spd09-gloss-grey.webp" },
      { color: "earthBrown", image: "/assets/products/catalog/spd09-earth-brown.webp" },
      { color: "white", image: "/assets/products/catalog/spd09-white.webp" },
      { color: "softRed", image: "/assets/products/catalog/spd09-soft-red.webp" },
      { color: "khaki", image: "/assets/products/catalog/spd09-khaki.webp" },
      { color: "shadowGrey", image: "/assets/products/catalog/spd09-shadow-grey.webp" },
      { color: "black", image: "/assets/products/catalog/spd09-black.webp" },
    ],
  },
  {
    sku: "SPD12",
    label: "中型ミーティング",
    variants: [
      { color: "ars", image: "/assets/products/catalog/spd12-ars.webp" },
      { color: "gxs", image: "/assets/products/catalog/spd12-gxs.webp" },
      { color: "greyGreen", image: "/assets/products/catalog/spd12-grey-green.webp" },
      { color: "glossGrey", image: "/assets/products/catalog/spd12-gloss-grey.webp" },
      { color: "earthBrown", image: "/assets/products/catalog/spd12-earth-brown.webp" },
      { color: "white", image: "/assets/products/catalog/spd12-white.webp" },
      { color: "softRed", image: "/assets/products/catalog/spd12-soft-red.webp" },
      { color: "khaki", image: "/assets/products/catalog/spd12-khaki.webp" },
      { color: "shadowGrey", image: "/assets/products/catalog/spd12-shadow-grey.webp" },
      { color: "black", image: "/assets/products/catalog/spd12-black.webp" },
    ],
  },
  {
    sku: "SPD14",
    label: "大型ミーティング",
    variants: [
      { color: "ars", image: "/assets/products/catalog/spd14-ars.webp" },
      { color: "gxs", image: "/assets/products/catalog/spd14-gxs.webp" },
      { color: "greyGreen", image: "/assets/products/catalog/spd14-grey-green.webp" },
      { color: "glossGrey", image: "/assets/products/catalog/spd14-gloss-grey.webp" },
      { color: "earthBrown", image: "/assets/products/catalog/spd14-earth-brown.webp" },
      { color: "white", image: "/assets/products/catalog/spd14-white.webp" },
      { color: "softRed", image: "/assets/products/catalog/spd14-soft-red.webp" },
      { color: "khaki", image: "/assets/products/catalog/spd14-khaki.webp" },
      { color: "shadowGrey", image: "/assets/products/catalog/spd14-shadow-grey.webp" },
      { color: "black", image: "/assets/products/catalog/spd14-black.webp" },
    ],
  },
] as const;

interface ProductSelection {
  sku: ProductSku;
  color: ProductColor;
}

interface ProductSkuSectionProps {
  selection: ProductSelection;
  onSelect: (selection: ProductSelection) => void;
}

function ProductSkuSection({ selection, onSelect }: ProductSkuSectionProps) {
  const selectedIndex = productSkus.findIndex(({ sku }) => sku === selection.sku);
  const selectedProduct = productSkus[selectedIndex] || productSkus[0];
  const selectedVariant = selectedProduct.variants.find(({ color }) => color === selection.color) || selectedProduct.variants[0];
  const selectedColor = productColors[selectedVariant.color];

  const selectSku = (product: ProductSkuConfig) => {
    onSelect({ sku: product.sku, color: product.variants[0].color });
  };

  return (
    <section
      className="post-story-section product-sku-section"
      id="product-skus"
      data-next-target="consultation"
      aria-labelledby="product-sku-title"
    >
      <div className="product-sku-copy">
        <p className="post-section-index">製品ラインアップ</p>
        <h2 id="product-sku-title">9つのSKUから、<br />用途で選ぶ。</h2>
        <p className="product-sku-lead">人数、デスク形式、用途から製品を選び、掲載色を切り替えて比較できます。</p>
        <div className="product-sku-current" aria-live="polite">
          <span>選択中</span>
          <strong>{selectedProduct.sku}</strong>
          <small>
            <span>{selectedProduct.label}</span>
            <span>{selectedColor.label}</span>
            <span>掲載画像 {String(selectedIndex + 1).padStart(2, "0")} / {String(productSkus.length).padStart(2, "0")}</span>
          </small>
        </div>
      </div>

      <div className="product-sku-viewer">
        <div className="product-sku-stage-column">
          <div className="product-sku-stage" aria-live="polite">
            <img
              className="product-sku-stage-image"
              key={`${selectedProduct.sku}-${selectedVariant.color}`}
              src={selectedVariant.image}
              alt={`${selectedProduct.sku} ${selectedColor.label} 製品全体画像`}
              width="1600"
              height="1600"
            />
            <div className="product-sku-stage-label" aria-hidden="true">
              <span>{String(selectedIndex + 1).padStart(2, "0")}</span>
              <strong>{selectedProduct.sku}</strong>
            </div>
          </div>
          <fieldset className="product-color-selector">
            <div className="product-color-heading">
              <legend>カラー</legend>
              <span>SKU別の掲載色</span>
            </div>
            <div className="product-color-options">
              {selectedProduct.variants.map(({ color }) => {
                const colorInfo = productColors[color];
                return (
                  <label className="product-color-option" key={`${selectedProduct.sku}-${color}`}>
                    <input
                      type="radio"
                      name="product-color-showcase"
                      value={color}
                      checked={selectedVariant.color === color}
                      onChange={() => onSelect({ sku: selectedProduct.sku, color })}
                    />
                    <span className="product-color-option-body">
                      <i style={{ backgroundColor: colorInfo.swatch }} aria-hidden="true" />
                      <span>{colorInfo.label}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        <fieldset className="product-sku-selector">
          <legend className="sr-only">表示する製品SKU</legend>
          <div className="product-sku-options">
            {productSkus.map((product, index) => (
              <label className="product-sku-option" key={product.sku}>
                <input
                  type="radio"
                  name="product-sku-showcase"
                  value={product.sku}
                  checked={selection.sku === product.sku}
                  onChange={() => selectSku(product)}
                />
                <span className="product-sku-option-body">
                  <span className="product-sku-option-image">
                    <img
                      src={product.variants[0].image}
                      alt={`${product.sku} ${productColors[product.variants[0].color].label} 製品一覧用画像`}
                      width="1600"
                      height="1600"
                      loading="lazy"
                    />
                  </span>
                  <span className="product-sku-option-code">
                    <i>{String(index + 1).padStart(2, "0")}</i>
                    <strong>{product.sku}</strong>
                    <small>{product.label}</small>
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </section>
  );
}

function ConsultationForm({ selection }: { selection: ProductSelection }) {
  const [status, setStatus] = useState("");
  const selectedColor = productColors[selection.color];

  const buildInquiry = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const value = (name: string) => String(data.get(name) ?? "").trim();
    const company = value("company");
    const name = value("name");
    const email = value("email");
    const inquiry = value("inquiry");
    const details = value("details");
    const product = value("product") || "SPD01";
    const productColor = value("productColor") || productColors.greyGreen.label;
    const subject = `[${BRAND_NAME} 導入相談] ${product}・${productColor} / ${inquiry} / ${company}`;
    const body = [
      `${BRAND_NAME} 導入相談`,
      "",
      `ご相談製品：${product}`,
      `参考カラー：${productColor}`,
      `会社・組織名：${company}`,
      `お名前：${name}`,
      `メールアドレス：${email}`,
      `ご相談内容：${inquiry}`,
      "",
      "詳細：",
      details,
    ].join("\n");

    return { subject, body };
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { subject, body } = buildInquiry(event.currentTarget);
    setStatus("メール作成画面に移ります。開かない場合は、相談内容をコピーしてメールでお送りください。");
    window.location.href = `mailto:contact@snapod.jp?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleCopyInquiry = async (event: MouseEvent<HTMLButtonElement>) => {
    const form = event.currentTarget.form;
    if (!form || !form.reportValidity()) {
      setStatus("コピーする前に、必須項目を入力してください。");
      return;
    }

    const { subject, body } = buildInquiry(form);
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      setStatus("相談内容をコピーしました。contact@snapod.jp 宛てのメールに貼り付けて送信できます。");
    } catch {
      setStatus("コピーできませんでした。contact@snapod.jp へ直接ご連絡ください。");
    }
  };

  return (
    <form id="consultation-form" className="consultation-form" onSubmit={handleSubmit} aria-describedby="consultation-form-note">
      <input type="hidden" name="product" value={selection.sku} />
      <input type="hidden" name="productColor" value={selectedColor.label} />
      <div className="form-product-summary">
        <span>相談製品</span>
        <strong>{selection.sku} ・ {selectedColor.label}</strong>
        <a href="#product-skus">変更</a>
      </div>
      <div className="form-heading">
        <h3>相談内容</h3>
        <span><i aria-hidden="true" /> 必須項目</span>
      </div>

      <div className="form-field-grid">
        <label>
          <span>会社・組織名 <i aria-hidden="true" /></span>
          <input name="company" type="text" autoComplete="organization" required />
        </label>
        <label>
          <span>お名前 <i aria-hidden="true" /></span>
          <input name="name" type="text" autoComplete="name" required />
        </label>
      </div>

      <div className="form-field-grid form-field-grid-secondary">
        <label>
          <span>メールアドレス <i aria-hidden="true" /></span>
          <input name="email" type="email" inputMode="email" autoComplete="email" required />
        </label>

        <label>
          <span>ご相談内容 <i aria-hidden="true" /></span>
          <select name="inquiry" defaultValue="" required>
            <option value="" disabled>選択してください</option>
            <option value="導入相談">導入相談</option>
            <option value="見積・納期">見積・納期</option>
            <option value="搬入・設置">搬入・設置</option>
            <option value="製品仕様">製品仕様</option>
            <option value="その他">その他</option>
          </select>
        </label>
      </div>

      <label>
        <span>詳細 <i aria-hidden="true" /></span>
        <textarea name="details" rows={3} required />
      </label>

      <div className="form-submit-row">
        <p id="consultation-form-note">入力内容はこのページには保存されません。送信はお使いのメールアプリから行われます。</p>
        <div className="form-submit-actions">
          <button className="form-copy" type="button" onClick={handleCopyInquiry}>相談内容をコピー</button>
          <button className="form-submit" type="submit">
            メールで相談する <ArrowUpRight weight="bold" />
          </button>
        </div>
      </div>
      <p className="form-status" aria-live="polite">{status}</p>
    </form>
  );
}

function ConsultationSection({ selection }: { selection: ProductSelection }) {
  return (
    <section className="post-story-section consultation-section" id="consultation" aria-labelledby="consultation-title">
      <div className="consultation-layout">
        <div className="consultation-intro">
          <p className="post-section-index">導入相談</p>
          <h2 id="consultation-title">空間と使い方から、<br />導入を考える。</h2>
          <p className="consultation-lead">設置条件が未確定でも、現在決まっている範囲からご相談いただけます。</p>
          <CompanyProfile />
        </div>
        <div className="consultation-action-column">
          <ConsultationForm selection={selection} />
        </div>
      </div>
      <SiteFooter />
    </section>
  );
}

export function App() {
  const rootRef = useRef<HTMLDivElement>(null);
  const routeTimerRef = useRef<number | null>(null);
  const director = useMemo(() => new SceneDirector(), []);
  const [stageReady, setStageReady] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [videoIntroActive, setVideoIntroActive] = useState(true);
  const [isRouteLeaving, setIsRouteLeaving] = useState(false);
  const [productSelection, setProductSelection] = useState<ProductSelection>({ sku: "SPD01", color: "greyGreen" });
  const handleStageReady = useCallback(() => setStageReady(true), []);
  const handleLoadingComplete = useCallback(() => setLoadingComplete(true), []);
  const handleRouteChange = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    const link = event.currentTarget;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === "_blank") return;

    event.preventDefault();
    if (routeTimerRef.current !== null) return;
    setIsRouteLeaving(true);
    routeTimerRef.current = window.setTimeout(() => {
      window.location.assign(href);
    }, 260);
  }, []);

  useEffect(() => () => {
    if (routeTimerRef.current !== null) window.clearTimeout(routeTimerRef.current);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    return initMotionSystem(root, director);
  }, [director]);

  useEffect(() => {
    const root = rootRef.current;
    const postStory = root?.querySelector<HTMLElement>(".product-film-section");
    if (!root || !postStory) return undefined;
    let frame = 0;

    const updatePostStoryState = () => {
      frame = 0;
      const rect = postStory.getBoundingClientRect();
      root.classList.toggle("is-post-story", rect.top <= window.innerHeight * 0.42);
    };
    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updatePostStoryState);
    };

    updatePostStoryState();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
      root.classList.remove("is-post-story");
    };
  }, []);

  return (
    <div
      className={`app${isRouteLeaving ? " is-route-leaving" : ""}`}
      id="app-story"
      ref={rootRef}
      data-loading-complete={loadingComplete ? "true" : "false"}
      data-video-intro-active={videoIntroActive ? "true" : "false"}
      aria-busy={!loadingComplete}
    >
      <a className="skip-link" href="#main-content">本文へ移動</a>
      <WebGLStage director={director} onReady={handleStageReady} />
      <LoadingScreen ready={stageReady} onComplete={handleLoadingComplete} />
      <p className="sr-only" id="product-visual-description">
        {BRAND_NAME} 静音ワークブースの外観と、構造・遮音・モジュール構成を連続して示す三次元表示。
      </p>
      <SiteFibers paused={!loadingComplete || isRouteLeaving} />
      <div className="stage-overlay">
        <AcousticField />
        <ProductFeatureNotes />
        <StructureGuides />
      </div>
      <Header onRouteChange={handleRouteChange} />

      <main id="main-content">
        <VideoPrelude onActiveChange={setVideoIntroActive} />
        <section
          className="story-section hero-section"
          id="hero"
          data-chapter="hero"
          data-next-target="structure"
          aria-labelledby="hero-title"
        >
          <div className="section-sticky hero-layout">
            <div className="hero-copy">
              <p className="hero-kicker">組み替え式 静音ワークブース</p>
              <HeroTitle />
              <p className="hero-lead">
                {['集中と会話を守る、', '組み替え可能な', '静音ワークブース。'].map((word) => (
                  <span className="lead-word" key={word}>{word}</span>
                ))}
              </p>
              <div className="hero-spec-row" aria-label="製品概要">
                <span><small>製品</small><strong>SPD01</strong></span>
                <span><small>定員</small><strong>1人用</strong></span>
                <span><small>構成</small><strong>組み替え式</strong></span>
              </div>
            </div>
          </div>
        </section>

        <section
          className="story-section structure-section"
          id="structure"
          data-chapter="structure"
          data-next-target="acoustic"
          aria-labelledby="structure-title"
        >
          <div className="section-sticky chapter-layout chapter-left">
            <div className="chapter-copy">
              <ChapterSignal {...chapterSignals.structure} />
              <h2 id="structure-title">一つずつ、<br />理由のある構造。</h2>
              <p className="chapter-summary">
                <strong>10の主要部品を、役割ごとに分解。</strong>
                <span>天板、ガラス、吸音面、家具の構成と関係を見せます。</span>
              </p>
              <ChapterSignalFacts facts={chapterSignals.structure.facts} />
            </div>
            <div className="part-legend" aria-label="製品部品一覧">
              {partLabels.map((part) => <span key={part.name}>{part.name}</span>)}
            </div>
          </div>
        </section>

        <section
          className="story-section acoustic-section"
          id="acoustic"
          data-chapter="acoustic"
          data-next-target="modular"
          aria-labelledby="acoustic-title"
        >
          <div className="section-sticky chapter-layout chapter-left">
            <div className="chapter-copy">
              <ChapterSignal {...chapterSignals.acoustic} />
              <h2 id="acoustic-title">音は、境界で<br />小さくなる。</h2>
              <p className="chapter-summary">
                <strong>外側の波を受け止め、内側の振幅を抑える。</strong>
                <span>ガラス境界前後の音の変化を同じ進度で比較できます。</span>
              </p>
              <p className="chapter-evidence">
                波紋は原理を説明するための模式表現です。
                <a href="/about/#about-evidence">試験条件と報告原本を見る</a>
              </p>
              <ChapterSignalFacts facts={chapterSignals.acoustic.facts} />
            </div>
          </div>
        </section>

        <section
          className="story-section modular-section"
          id="modular"
          data-chapter="modular"
          data-next-target="interaction"
          aria-labelledby="modular-title"
        >
          <div className="section-sticky chapter-layout chapter-left">
            <div className="chapter-copy">
              <ChapterSignal {...chapterSignals.modular} />
              <h2 id="modular-title">組み替えて、<br />変化に応える。</h2>
              <p className="chapter-summary">
                <strong>分解と再結合を前提にしたモジュール構成。</strong>
                <span>移設やレイアウト変更にも順序を保って対応します。</span>
              </p>
              <ChapterSignalFacts facts={chapterSignals.modular.facts} />
            </div>
          </div>
        </section>

        <section
          className="story-section interaction-section"
          id="interaction"
          data-chapter="interaction"
          data-next-target="product-film"
          aria-labelledby="interaction-title"
        >
          <div className="section-sticky chapter-layout chapter-left">
            <div className="chapter-copy">
              <ChapterSignal {...chapterSignals.interaction} />
              <h2 id="interaction-title">使う位置を、<br />ひと目で。</h2>
              <p className="chapter-summary">
                <strong>扉、デスク、照明の位置関係を正面から確認。</strong>
                <span>入室から着席、作業までの動線をひと目で確かめられます。</span>
              </p>
              <ChapterSignalFacts facts={chapterSignals.interaction.facts} />
            </div>
          </div>
        </section>

        <ProductFilmSection />
        <ProductSkuSection selection={productSelection} onSelect={setProductSelection} />
        <ConsultationSection selection={productSelection} />
      </main>

      <ProgressRail />
      <div className="sr-only" aria-live="polite" data-chapter-announcer>
        {CHAPTER_IDS[0]}
      </div>
    </div>
  );
}
