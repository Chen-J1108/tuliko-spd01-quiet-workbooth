type AnimeTargets = string | Element | NodeListOf<Element> | Element[];

type AnimeEffectOptions = {
  root?: ParentNode;
  distance?: number;
  scale?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
  exit?: boolean;
};

type AnimeEffectInstance = {
  revert?: () => void;
} | null;

export function revealOnScroll(targets: AnimeTargets, options?: AnimeEffectOptions): IntersectionObserver | null;
export function hoverLift(targets: AnimeTargets, options?: AnimeEffectOptions): () => void;
export function accordionTransition(targets: AnimeTargets, options?: AnimeEffectOptions): AnimeEffectInstance;
export function slideTransition(targets: AnimeTargets, options?: AnimeEffectOptions): AnimeEffectInstance;
export function productSwap(targets: AnimeTargets, options?: AnimeEffectOptions): AnimeEffectInstance;
