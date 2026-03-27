export type RevealDirection =
  | "up"
  | "down"
  | "left"
  | "right"
  | "up-left"
  | "up-right"
  | "down-left"
  | "down-right";

export interface RevealBaseProps {
  children: React.ReactNode;
  className?: string;
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  blur?: boolean;
}

export interface InViewRevealProps extends RevealBaseProps {
  threshold?: number;
  once?: boolean;
}

const OFFSETS: Record<RevealDirection, { x: number; y: number }> = {
  up: { x: 0, y: 100 },
  down: { x: 0, y: -100 },
  left: { x: 100, y: 0 },
  right: { x: -100, y: 0 },
  "up-left": { x: 80, y: 80 },
  "up-right": { x: -80, y: 80 },
  "down-left": { x: 80, y: -80 },
  "down-right": { x: -80, y: -80 },
};

const LITE_OFFSETS: Record<RevealDirection, { x: number; y: number }> = {
  up: { x: 0, y: 24 },
  down: { x: 0, y: -24 },
  left: { x: 24, y: 0 },
  right: { x: -24, y: 0 },
  "up-left": { x: 20, y: 20 },
  "up-right": { x: -20, y: 20 },
  "down-left": { x: 20, y: -20 },
  "down-right": { x: -20, y: -20 },
};

export function getNavigationType(): NavigationTimingType | null {
  if (typeof window === "undefined") {
    return null;
  }

  const navigationEntry = window.performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;

  if (!navigationEntry || !("type" in navigationEntry)) {
    return null;
  }

  return navigationEntry.type;
}

export function buildThresholds(threshold: number): number[] {
  const normalizedThreshold = Math.min(Math.max(threshold, 0), 1);

  return Array.from(new Set([0, normalizedThreshold, 1]));
}

export function getIntersectionRatio(node: Element): number {
  const { innerHeight, innerWidth } = window;
  const rect = node.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return 0;
  }

  const intersectionWidth = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0));
  const intersectionHeight = Math.max(
    0,
    Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0),
  );
  const intersectionArea = intersectionWidth * intersectionHeight;
  const elementArea = rect.width * rect.height;

  if (elementArea === 0) {
    return 0;
  }

  return intersectionArea / elementArea;
}

export function formatTranslate(x: number, y: number): string {
  return `translate3d(${x}px, ${y}px, 0)`;
}

export function resolveRevealMotion(
  direction: RevealDirection,
  liteMotion: boolean,
  duration: number,
  delay: number,
  blur: boolean,
): {
  x: number;
  y: number;
  duration: number;
  delay: number;
  backdropBlur: string | undefined;
} {
  const { x, y } = (liteMotion ? LITE_OFFSETS : OFFSETS)[direction];

  return {
    x,
    y,
    duration: liteMotion ? Math.min(duration, 0.45) : duration,
    delay: liteMotion ? Math.min(delay, 0.12) : delay,
    backdropBlur: blur && !liteMotion ? "blur(18px)" : undefined,
  };
}
