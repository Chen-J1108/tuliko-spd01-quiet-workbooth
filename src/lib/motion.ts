import {
  animate,
  createTimeline,
  stagger,
  random,
  onScroll,
  createScope,
  createDrawable,
  createMotionPath,
  morphTo,
} from "animejs";
import type { SceneDirector } from "../scene-director";
import { CHAPTER_IDS, clamp01, rangeProgress, smoothstep } from "../scene-director";
import { LOADING_COMPLETE_EVENT } from "../loading-events";
import {
  PRODUCT_BOUNDARY_EVENT,
  type ProductScreenBoundary,
} from "../product-boundary";

type Pausable = {
  pause?: () => unknown;
  resume?: () => unknown;
  revert?: () => unknown;
  completed?: boolean;
};

const query = <T extends Element>(root: Element, selector: string) => root.querySelector<T>(selector);
const queryAll = <T extends Element>(root: Element, selector: string) => [...root.querySelectorAll<T>(selector)];

export function initMotionSystem(root: HTMLElement, director: SceneDirector) {
  const sections = CHAPTER_IDS
    .map((id) => query<HTMLElement>(root, `#${id}`))
    .filter((section): section is HTMLElement => Boolean(section));
  const progressRail = query<HTMLElement>(root, "[data-progress-rail]");
  const progressTrack = query<HTMLElement>(root, ".progress-track");
  const progressCursor = query<HTMLElement>(root, "[data-progress-cursor]");
  const progressAnchors = queryAll<HTMLAnchorElement>(root, "[data-progress-anchor]");
  const teaserSections = queryAll<HTMLElement>(root, "[data-next-target]");
  const announcer = query<HTMLElement>(root, "[data-chapter-announcer]");
  const productReference = query<HTMLImageElement>(root, ".webgl-reference");
  const activeTimers = new Set<Pausable>();
  let activeIndex = -1;
  let initialFrame = 0;
  let settleFrame = 0;
  let scrollFrame = 0;
  let hasPlayedIllumination = false;
  let hasPlayedHeroCopy = false;
  let hasPlayedProductIntro = false;
  let hasPlayedWaveReveal = false;
  let hasPlayedLightScan = false;
  let hasHeroModelBoundary = false;

  const track = <T extends Pausable>(item: T) => {
    activeTimers.add(item);
    return item;
  };

  const syncHeroModelBoundary = (event: Event) => {
    if (root.dataset.chapter !== "hero") return;
    const boundary = (event as CustomEvent<ProductScreenBoundary>).detail;
    if (!boundary || boundary.right <= boundary.left || boundary.bottom <= boundary.top) return;

    hasHeroModelBoundary = true;
    const width = boundary.right - boundary.left;
    const height = boundary.bottom - boundary.top;
    root.style.setProperty("--hero-shell-left", `${boundary.left.toFixed(2)}px`);
    root.style.setProperty("--hero-shell-right", `${boundary.right.toFixed(2)}px`);
    // The front-facing GLB has a broad door opening. Keep the quiet glass
    // traces safely within its visible frame rather than using the former
    // three-quarter raster's asymmetric crop ratios.
    root.style.setProperty("--hero-glass-left", `${(boundary.left + width * 0.11).toFixed(2)}px`);
    root.style.setProperty("--hero-glass-top", `${(boundary.top + height * 0.1).toFixed(2)}px`);
    root.style.setProperty("--hero-glass-width", `${(width * 0.76).toFixed(2)}px`);
    root.style.setProperty("--hero-glass-height", `${(height * 0.8).toFixed(2)}px`);
  };

  const syncHeroProductBoundary = () => {
    if (hasHeroModelBoundary) return;
    if (!productReference) return;
    const rect = productReference.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;

    // Use layout coordinates rather than the client rectangle so the product
    // boundary stays stable while the one-time lighting reveal is running.
    const imageLeft = productReference.offsetLeft - rect.width * 0.5;
    const imageTop = productReference.offsetTop - rect.height * 0.5;

    // Ratios are measured from the authoritative transparent SPD01 WebP.
    // They deliberately describe the visible shell and front-glass opening,
    // not the image element's transparent padding.
    const shellLeft = imageLeft + rect.width * 0.22;
    const shellRight = imageLeft + rect.width * 0.78;
    const glassLeft = imageLeft + rect.width * 0.24;
    const glassRight = imageLeft + rect.width * 0.55;
    const glassTop = imageTop + rect.height * 0.13;
    const glassBottom = imageTop + rect.height * 0.87;

    root.style.setProperty("--hero-shell-left", `${shellLeft.toFixed(2)}px`);
    root.style.setProperty("--hero-shell-right", `${shellRight.toFixed(2)}px`);
    root.style.setProperty("--hero-glass-left", `${glassLeft.toFixed(2)}px`);
    root.style.setProperty("--hero-glass-top", `${glassTop.toFixed(2)}px`);
    root.style.setProperty("--hero-glass-width", `${Math.max(1, glassRight - glassLeft).toFixed(2)}px`);
    root.style.setProperty("--hero-glass-height", `${Math.max(1, glassBottom - glassTop).toFixed(2)}px`);
  };

  window.addEventListener(PRODUCT_BOUNDARY_EVENT, syncHeroModelBoundary);

  const applyScrollState = () => {
    const viewportHeight = Math.max(1, window.innerHeight);
    const stackedLayout = window.matchMedia("(max-width: 900px)").matches;
    // The video prelude sits before the five-chapter story and intentionally
    // does not become a sixth progress state. Start the global rail at #hero,
    // so its cursor remains at zero while the prelude is on screen.
    const storyStart = sections[0]?.offsetTop ?? 0;
    const maximumScroll = Math.max(1, document.documentElement.scrollHeight - viewportHeight - storyStart);
    const pageProgress = clamp01((window.scrollY - storyStart) / maximumScroll);
    const sectionRects = sections.map((section) => section.getBoundingClientRect());
    const sectionProgresses = sectionRects.map((rect) => {
      const pinnedDistance = Math.max(1, rect.height - viewportHeight);
      return clamp01(-rect.top / pinnedDistance);
    });
    let baseIndex = 0;

    sections.forEach((section, index) => {
      const rect = sectionRects[index];
      const progress = sectionProgresses[index] ?? 0;
      section.style.setProperty("--section-progress", progress.toFixed(5));
      const heroCopyVisibility = section.id === "hero"
        ? 1 - smoothstep(rangeProgress(progress, 0.24, 0.38))
        : 0;
      section.style.setProperty("--hero-copy-visibility", heroCopyVisibility.toFixed(5));
      // Every product chapter starts reading as soon as it takes ownership of
      // the persistent stage. A small negative start makes the incoming copy
      // visible during the outgoing chapter's CSS crossfade, so a wheel tick
      // never produces an unexplained product-only frame.
      const isProductChapter = section.id !== "hero";
      const copyIn = smoothstep(rangeProgress(
        progress,
        isProductChapter ? -0.025 : 0.06,
        isProductChapter ? 0.04 : 0.18,
      ));
      const contentProgress = director.snapshot.reducedMotion
        ? 1
        : smoothstep(rangeProgress(
            progress,
            isProductChapter ? -0.045 : 0.035,
            isProductChapter ? 0.07 : 0.22,
          ));
      section.style.setProperty("--chapter-content-progress", contentProgress.toFixed(5));
      // Copy remains anchored to the product through the whole chapter. This
      // follows the reference site's continuous stage logic: the object changes
      // state while its explanation persists, then both hand off together.
      const interactionVisibility = section.id === "interaction"
        ? copyIn * (1 - smoothstep(rangeProgress(progress, stackedLayout ? 0.88 : 0.9, 0.985)))
        : 0;
      const copyVisibility = section.id === "interaction"
        ? interactionVisibility
        : copyIn;
      section.style.setProperty("--chapter-copy-visibility", copyVisibility.toFixed(5));
      section.style.setProperty("--interaction-content-visibility", interactionVisibility.toFixed(5));
      if (rect.top <= 1) baseIndex = index;
    });

    let activeTease = 0;
    const compactLayout = window.matchMedia("(max-width: 699px)").matches;
    teaserSections.forEach((section) => {
      const storyIndex = sections.indexOf(section);
      let rawTease = 0;

      if (storyIndex >= 0) {
        const rect = sectionRects[storyIndex];
        const pinnedDistance = Math.max(1, rect.height - viewportHeight);
        const sectionProgress = clamp01(-rect.top / pinnedDistance);
        // Reserve the last 15% for the next visual state. This is a shared,
        // reversible state overlap, not a new DOM preview or a hard cut.
        rawTease = rangeProgress(sectionProgress, compactLayout ? 0.83 : 0.85, 1);
      } else {
        const nextId = section.dataset.nextTarget;
        const nextSection = nextId ? document.getElementById(nextId) : null;
        if (nextSection) {
          const nextTop = nextSection.getBoundingClientRect().top;
          const triggerLine = viewportHeight * (compactLayout ? 0.9 : 0.86);
          const revealDistance = viewportHeight * (compactLayout ? 0.14 : 0.18);
          rawTease = clamp01((triggerLine - nextTop) / Math.max(1, revealDistance));
        }
      }

      const tease = director.snapshot.reducedMotion
        ? (rawTease > 0 ? 1 : 0)
        : smoothstep(rawTease);
      section.style.setProperty("--section-tease", tease.toFixed(5));
      section.toggleAttribute("data-teaser-visible", tease > 0.015);
      if (storyIndex === baseIndex) activeTease = tease;
    });

    const followingIndex = Math.min(sections.length - 1, baseIndex + 1);
    const transitionProgress = followingIndex === baseIndex
      ? 0
      : smoothstep(rangeProgress(sectionProgresses[baseIndex] ?? 0, 0.85, 1));
    const nextIndex = baseIndex;
    const activeSection = sections[baseIndex];
    const activeRect = sectionRects[baseIndex];
    const localProgress = activeRect
      ? clamp01(-activeRect.top / Math.max(1, activeRect.height - viewportHeight))
      : 0;
    // The chapter rail describes only the pinned product story—not the video,
    // catalogue and consultation content below it. Each chapter starts exactly
    // at its labelled stop and the cursor travels toward the following stop.
    const storyProgress = baseIndex >= sections.length - 1
      ? 1
      : clamp01((baseIndex + localProgress) / Math.max(1, sections.length - 1));
    // The authoritative GLB is front-facing from the first frame. The local
    // three-quarter product image remains available solely as a load-error
    // fallback, so the hero no longer contradicts the direct product view.
    const heroModelMix = 1;
    const rasterOpacity = 0;
    const glbOpacity = 1;
    const desktopLayout = window.matchMedia("(min-width: 901px)").matches;
    // The hero keeps a wider left sound-field runway and reserves the right
    // gutter for the single global rail. Subsequent chapter centres preserve
    // their established functional clearances.
    const heroExtraShiftPx = desktopLayout
      ? Number.parseFloat(getComputedStyle(root).getPropertyValue("--hero-extra-shift-x")) || 0
      : 0;
    const heroExtraShiftPercent = heroExtraShiftPx / Math.max(1, window.innerWidth) * 100;
    const stageCenters = [70 + heroExtraShiftPercent, 54, 68, 50, 52.5];
    const stageCenter = desktopLayout
      ? stageCenters[baseIndex] + (stageCenters[followingIndex] - stageCenters[baseIndex]) * transitionProgress
      : 50;
    const heroProgress = sectionProgresses[0] ?? 0;
    // Product callouts are a full narrative beat, not a transient overlap.
    // Enter after the hero statement, hold through most of the pinned runway,
    // and leave only when the structure chapter is about to take ownership.
    const heroDetailVisibility = smoothstep(rangeProgress(heroProgress, 0.3, 0.4))
      * (1 - smoothstep(rangeProgress(heroProgress, 0.94, 0.99)));
    const narrative = baseIndex + transitionProgress;
    const structureProgress = sectionProgresses[1] ?? 0;
    // The exploded inspection needs a lower, header-safe stage. Once the
    // booth reassembles, return it to the acoustic chapter's vertical datum
    // so the product does not jump between two consecutive assembled views.
    const structureReassembly = smoothstep(rangeProgress(structureProgress, 0.84, 0.94));
    const structureStageShiftY = 50 * (1 - structureReassembly);
    const guideEnter = smoothstep(rangeProgress(structureProgress, 0.28, 0.32));
    // Keep the guide layer available for a sparse second annotation pass
    // during the spatial inspection. Individual cues still guarantee only
    // one focused component at a time once the full turn begins.
    const guideExit = 1 - smoothstep(rangeProgress(structureProgress, 0.84, 0.87));
    const guideVisibility = director.snapshot.reducedMotion
      ? (baseIndex === 1 ? 1 : 0)
      : guideEnter * guideExit;
    director.setChapter(nextIndex, localProgress, pageProgress, narrative, structureProgress);
    root.dataset.chapter = CHAPTER_IDS[baseIndex];
    root.style.setProperty("--page-progress", pageProgress.toFixed(6));
    root.style.setProperty("--story-progress", storyProgress.toFixed(6));
    root.style.setProperty("--chapter-progress", localProgress.toFixed(6));
    root.style.setProperty("--active-tease", activeTease.toFixed(6));
    root.style.setProperty("--state-overlap", transitionProgress.toFixed(6));
    root.style.setProperty("--hero-model-mix", heroModelMix.toFixed(6));
    root.style.setProperty("--hero-raster-opacity", rasterOpacity.toFixed(6));
    root.style.setProperty("--hero-glb-opacity", glbOpacity.toFixed(6));
    root.style.setProperty("--hero-detail-visibility", heroDetailVisibility.toFixed(6));
    root.style.setProperty("--structure-guide-visibility", guideVisibility.toFixed(6));
    root.style.setProperty("--structure-guide-progress", structureProgress.toFixed(6));
    root.style.setProperty("--structure-stage-shift-y", `${structureStageShiftY.toFixed(2)}px`);
    root.style.setProperty("--stage-center-x", `${stageCenter.toFixed(3)}%`);
    syncHeroProductBoundary();

    sections.forEach((section, index) => section.classList.toggle("is-active", index === nextIndex));
    progressAnchors.forEach((anchor, index) => {
      const weight = index === baseIndex
        ? 1 - transitionProgress
        : index === followingIndex
          ? transitionProgress
          : 0;
      const current = index === nextIndex;
      anchor.style.setProperty("--anchor-opacity", (0.42 + weight * 0.58).toFixed(4));
      anchor.style.setProperty("--anchor-scale", (0.64 + weight * 0.36).toFixed(4));
      anchor.classList.toggle("is-active", current);
      if (current) anchor.setAttribute("aria-current", "location");
      else anchor.removeAttribute("aria-current");
    });

    if (progressCursor && progressTrack) {
      const travel = desktopLayout
        ? Math.max(0, progressTrack.clientHeight - progressCursor.offsetHeight)
        : Math.max(0, progressTrack.clientWidth - progressCursor.offsetWidth);
      const distance = (travel * storyProgress).toFixed(2);
      progressCursor.style.transform = desktopLayout
        ? `translate3d(0, ${distance}px, 0)`
        : `translate3d(${distance}px, 0, 0)`;
    }
    progressRail?.setAttribute("aria-label", `製品ストーリー進捗 ${Math.round(storyProgress * 100)}%`);

    if (activeIndex !== nextIndex) {
      activeIndex = nextIndex;
      if (announcer) announcer.textContent = sections[nextIndex]?.getAttribute("aria-label") || CHAPTER_IDS[nextIndex];
    }
  };

  const pageObserver = onScroll({
    target: root,
    enter: "top top",
    leave: "bottom bottom",
    repeat: true,
    onEnter: applyScrollState,
    onUpdate: applyScrollState,
    onResize: applyScrollState,
  });

  // ScrollObserver supplies lifecycle and resize integration, while the native
  // event is the authoritative browsing clock. Some Chromium builds do not
  // emit Anime.js observer updates for every unlinked wheel step; the rAF gate
  // keeps all product, copy and navigation state on the same visual frame.
  const scheduleScrollState = () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      applyScrollState();
    });
  };
  window.addEventListener("scroll", scheduleScrollState, { passive: true });

  const pageResizeObserver = new ResizeObserver(() => {
    pageObserver.refresh();
    applyScrollState();
  });
  pageResizeObserver.observe(root);
  productReference?.addEventListener("load", applyScrollState);

  const scope = createScope({
    root,
    mediaQueries: {
      desktop: "(min-width: 901px)",
      mobile: "(max-width: 900px)",
      compact: "(max-width: 699px)",
      reduced: "(prefers-reduced-motion: reduce)",
    },
  });

  scope.add((self) => {
    if (!self) return undefined;
    const reduced = self.matches.reduced;
    const mobile = self.matches.mobile;
    const compact = self.matches.compact;
    const localTimers: Pausable[] = [];
    let waitingForLoading = false;
    const keep = <T extends Pausable>(timer: T) => {
      localTimers.push(timer);
      return track(timer);
    };

    director.setEnvironment({ reducedMotion: reduced, mobile, compact });
    root.classList.toggle("is-reduced-motion", reduced);
    root.classList.toggle("is-compact-render", compact);

    const playHeroEntrance = () => {
      waitingForLoading = false;
      const startsAtHero = (!window.location.hash || window.location.hash === "#hero")
        && window.scrollY < window.innerHeight * 0.45;

      if (!startsAtHero) {
        // A direct anchor refresh must expose the requested chapter immediately.
        director.snapshot.illumination = 1;
        hasPlayedIllumination = true;
        hasPlayedHeroCopy = true;
        hasPlayedProductIntro = true;
        hasPlayedWaveReveal = true;
        hasPlayedLightScan = true;
        return;
      }

      if (!hasPlayedIllumination) {
        hasPlayedIllumination = true;
        director.snapshot.illumination = 0;
        const intro = keep(createTimeline({ defaults: { ease: "outExpo" } }));
        intro
          .add(director.snapshot, {
            illumination: 0.34,
            duration: 520,
            ease: "outQuad",
          }, 80)
          .add(director.snapshot, {
            illumination: 1,
            duration: 1120,
            ease: "inOutQuad",
          }, 420);
      } else {
        director.snapshot.illumination = 1;
      }

      if (!hasPlayedHeroCopy) {
        hasPlayedHeroCopy = true;
        const copyIntro = keep(createTimeline({ defaults: { ease: "outExpo" } }));
        copyIntro
          .add(".hero-kicker", {
            opacity: [0, 1],
            translateY: [12, 0],
            duration: compact ? 520 : 680,
          }, 160)
          .add(".hero-copy h1", {
            opacity: [0, 1],
            translateY: [22, 0],
            duration: compact ? 760 : 980,
          }, 260)
          .add(".hero-lead", {
            opacity: [0, 1],
            translateY: [16, 0],
            duration: compact ? 620 : 760,
          }, 480)
          .add(".hero-spec-row > span", {
            opacity: [0, 1],
            translateY: [10, 0],
            duration: compact ? 420 : 520,
            delay: stagger(compact ? 55 : 75),
          }, 680);
      }

      if (!hasPlayedProductIntro) {
        hasPlayedProductIntro = true;
        const productIntro = keep(createTimeline({ defaults: { ease: "outExpo" } }));
        productIntro
          .add("[data-product-reveal]", {
            opacity: [0.04, 1],
            filter: [
              "brightness(0.22) saturate(0.62) contrast(1.1)",
              "brightness(1) saturate(1) contrast(1)",
            ],
            duration: compact ? 1180 : 1520,
          }, 40)
          .add(".product-intro-scan", {
            translateY: compact ? ["18lvh", "76lvh"] : ["10lvh", "88lvh"],
            scaleX: [0.28, 1, 0.46],
            opacity: [0, 0.74, 0],
            duration: compact ? 980 : 1320,
            ease: "inOutQuad",
          }, 120);
      }

      if (!hasPlayedWaveReveal) {
        hasPlayedWaveReveal = true;
        const waveReveal = keep(createTimeline({ defaults: { ease: "outQuad" } }));
        waveReveal
          .add(".incoming-wave-energy", {
            scaleX: [0, 1],
            duration: () => random(compact ? 680 : 820, compact ? 820 : 980),
            delay: stagger(compact ? 34 : 46, { from: "first" }),
          }, 560)
          .add(".incoming-wave-line", {
            scaleX: [0, 1],
            duration: () => random(compact ? 620 : 760, compact ? 760 : 900),
            delay: stagger(compact ? 34 : 46, { from: "first" }),
          }, 560)
          .add(".incoming-wave-boundary", {
            opacity: [0, 1],
            scaleY: [0.12, 1],
            duration: 360,
          }, 980)
          .add(".quiet-glass-line", {
            scaleX: [0, 1],
            duration: () => random(compact ? 560 : 680, compact ? 700 : 820),
            delay: stagger(compact ? 24 : 32, { from: "first" }),
          }, 1080)
          .add(".outgoing-wave-line", {
            scaleX: [0, 1],
            duration: () => random(compact ? 680 : 840, compact ? 820 : 1040),
            delay: stagger(compact ? 30 : 38, { from: "first" }),
          }, 1320);
      }

      if (!hasPlayedLightScan) {
        hasPlayedLightScan = true;
        keep(animate(".hero-light-scan", {
          translateX: ["-150%", "250%"],
          translateY: ["-20%", "16%"],
          rotate: 0,
          opacity: [0, 0.64, 0],
          duration: compact ? 1800 : 2300,
          delay: 720,
          ease: "inOutQuad",
        }));
      }
    };

    const handleLoadingComplete = () => playHeroEntrance();

    if (reduced) {
      director.snapshot.illumination = 1;
      hasPlayedIllumination = true;
      hasPlayedHeroCopy = true;
      hasPlayedProductIntro = true;
      hasPlayedWaveReveal = true;
      hasPlayedLightScan = true;
    } else {
      if (root.dataset.loadingComplete === "true") playHeroEntrance();
      else {
        waitingForLoading = true;
        root.addEventListener(LOADING_COMPLETE_EVENT, handleLoadingComplete, { once: true });
      }

      keep(animate(".incoming-wave-flow", {
        strokeDashoffset: [0, -100],
        duration: compact ? 1900 : 2200,
        delay: stagger(compact ? 90 : 130, { from: "first" }),
        ease: "linear",
        loop: true,
      }));

      keep(animate(".quiet-glass-flow", {
        strokeDashoffset: [0, -100],
        duration: compact ? 2300 : 2700,
        delay: stagger(compact ? 80 : 115, { from: "first" }),
        ease: "linear",
        loop: true,
      }));

      keep(animate(".outgoing-wave-flow", {
        strokeDashoffset: [0, -100],
        duration: compact ? 2800 : 3300,
        delay: stagger(compact ? 100 : 145, { from: "first" }),
        ease: "linear",
        loop: true,
      }));

      keep(animate(".incoming-wave-lane", {
        scaleY: [0.92, 1.075],
        duration: compact ? 1600 : 2050,
        delay: stagger(compact ? 86 : 125, { from: "first" }),
        ease: "inOutSine",
        alternate: true,
        loop: true,
      }));

      keep(animate(".quiet-glass-lane", {
        scaleY: [0.965, 1.04],
        duration: compact ? 2050 : 2450,
        delay: stagger(compact ? 100 : 145, { from: "first" }),
        ease: "inOutSine",
        alternate: true,
        loop: true,
      }));

      keep(animate(".outgoing-wave-lane", {
        scaleY: [0.98, 1.03],
        duration: compact ? 2450 : 3050,
        delay: stagger(compact ? 110 : 160, { from: "first" }),
        ease: "inOutSine",
        alternate: true,
        loop: true,
      }));

      const guideRings = queryAll<SVGCircleElement>(root, ".guide-target-ring");
      if (guideRings.length) {
        const guideScroll = onScroll({
          target: query<HTMLElement>(root, "#structure") || undefined,
          enter: "top top",
          leave: "bottom bottom",
          sync: true,
        });
        keep(animate(createDrawable(guideRings), {
          draw: ["0 0", "0 1"],
          duration: 1000,
          ease: "linear",
          autoplay: guideScroll,
        }));
      }

      const acousticSection = query<HTMLElement>(root, "#acoustic");
      const openWave = query<SVGPathElement>(root, "#glass-wave-path");
      const quietWave = query<SVGPathElement>(root, "#glass-wave-quiet-target");
      if (openWave && quietWave && acousticSection) {
        const morphScroll = onScroll({
          target: acousticSection,
          enter: "top top",
          leave: "bottom bottom",
          sync: true,
        });
        keep(animate(openWave, {
          d: morphTo(quietWave),
          duration: 1000,
          ease: "linear",
          autoplay: morphScroll,
        }));

      }

    }

    applyScrollState();
    return () => {
      if (waitingForLoading) root.removeEventListener(LOADING_COMPLETE_EVENT, handleLoadingComplete);
      localTimers.forEach((timer) => activeTimers.delete(timer));
    };
  });

  const handleVisibility = () => {
    const visible = !document.hidden;
    root.classList.toggle("is-page-hidden", !visible);
    director.setEnvironment({ visible });
    activeTimers.forEach((timer) => {
      if (!visible) timer.pause?.();
      else if (!timer.completed) timer.resume?.();
    });
  };

  document.addEventListener("visibilitychange", handleVisibility);
  handleVisibility();

  const syncHashState = (forcePosition = false) => {
    const hash = window.location.hash.slice(1);
    const target = hash ? document.getElementById(hash) : null;
    if (forcePosition && target) {
      const isStoryReadingTarget = target.classList.contains("story-section") && target.id !== "hero";
      const pinnedDistance = Math.max(0, target.offsetHeight - window.innerHeight);
      const readingOffset = isStoryReadingTarget ? pinnedDistance * 0.16 : 0;
      window.scrollTo({
        top: target.offsetTop + readingOffset,
        behavior: "instant" as ScrollBehavior,
      });
    }
    pageObserver.refresh();
    applyScrollState();
    settleFrame = requestAnimationFrame(applyScrollState);
  };

  const handleHashChange = () => {
    if (settleFrame) cancelAnimationFrame(settleFrame);
    settleFrame = requestAnimationFrame(() => syncHashState(true));
  };

  window.addEventListener("hashchange", handleHashChange);
  initialFrame = requestAnimationFrame(() => {
    syncHashState(true);
  });

  return () => {
    if (initialFrame) cancelAnimationFrame(initialFrame);
    if (settleFrame) cancelAnimationFrame(settleFrame);
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("scroll", scheduleScrollState);
    window.removeEventListener("hashchange", handleHashChange);
    window.removeEventListener(PRODUCT_BOUNDARY_EVENT, syncHeroModelBoundary);
    productReference?.removeEventListener("load", applyScrollState);
    pageResizeObserver.disconnect();
    pageObserver.revert();
    scope.revert();
    activeTimers.clear();
  };
}
