import { WHEEL_CONTENT_CATEGORIES } from "@/shared/config";
import type {
  GameApiErrorCode,
  WheelRoundResolution,
  WheelRoundResolveApiResponse,
  WheelRoundSnapshot,
} from "@/features/game-session";

export const wheelEase = [0.22, 1, 0.36, 1] as const;
export const WHEEL_VISUAL_SEGMENT_COUNT = WHEEL_CONTENT_CATEGORIES.length + 1;
export const SEGMENT_PALETTE = ["#caa76a", "#5c3e22"] as const;

export type ResolvedRound = WheelRoundResolveApiResponse["round"];

export interface RecentResultItem {
  roundId: string;
  prompt: string;
  categorySlug: string;
  categoryTitle: string;
  resolution: WheelRoundResolution;
  xpDelta: number;
}

export function polarToCartesian(radius: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: 50 + radius * Math.cos(rad), y: 50 + radius * Math.sin(rad) };
}

export function describeSlice(startAngle: number, endAngle: number) {
  const s = polarToCartesian(48.5, endAngle);
  const e = polarToCartesian(48.5, startAngle);
  const large = endAngle - startAngle <= 180 ? 0 : 1;
  return `M 50 50 L ${s.x} ${s.y} A 48.5 48.5 0 ${large} 0 ${e.x} ${e.y} Z`;
}

export function buildWheelRotation(
  currentRotation: number,
  selectedIndex: number,
  segmentAngle: number
) {
  const norm = ((currentRotation % 360) + 360) % 360;
  const target = selectedIndex * segmentAngle + segmentAngle / 2;
  const delta = (360 - target - norm + 360) % 360;
  return currentRotation + 5 * 360 + delta;
}

export async function readApiErrorCode(res: Response): Promise<GameApiErrorCode> {
  try {
    const payload = (await res.json()) as { code?: GameApiErrorCode };
    return payload.code ?? "PERSISTENCE_ERROR";
  } catch {
    return "PERSISTENCE_ERROR";
  }
}

export function getAvatarMonogram(avatarKey: string, fallbackName: string) {
  const keyMonogram = avatarKey
    .split("-")
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

  if (keyMonogram.length > 0) {
    return keyMonogram;
  }

  return fallbackName.trim().charAt(0).toUpperCase();
}

export function getCategoryIndex(categorySlug: string) {
  return WHEEL_CONTENT_CATEGORIES.findIndex(
    (category) => category.slug === categorySlug
  );
}

export function getCategoryColor(categorySlug: string) {
  const categoryIndex = getCategoryIndex(categorySlug);
  return SEGMENT_PALETTE[
    (categoryIndex >= 0 ? categoryIndex : 0) % SEGMENT_PALETTE.length
  ];
}

export function getInteractionLabelKey(task: Pick<
  WheelRoundSnapshot["task"],
  "interactionType" | "responseMode"
>) {
  if (task.responseMode === "choice") {
    return "interaction_choice";
  }

  switch (task.interactionType) {
    case "confirm":
      return "interaction_confirm";
    case "text_input":
      return "interaction_text_input";
    case "timer":
      return "interaction_timer";
    case "async_task":
      return "interaction_async_task";
  }
}

export function getResolutionKey(resolution: WheelRoundResolution) {
  switch (resolution) {
    case "completed":
      return "resolution_completed";
    case "promised":
      return "resolution_promised";
    case "skipped":
      return "resolution_skipped";
  }
}

export function getStatusMessageKey({
  isPreparingRound,
  isResolving,
  isSpinning,
}: {
  isPreparingRound: boolean;
  isResolving: boolean;
  isSpinning: boolean;
}) {
  if (isPreparingRound) {
    return "preparing_round";
  }

  if (isResolving) {
    return "saving_result";
  }

  if (isSpinning) {
    return "spinning_cta";
  }

  return null;
}

export function getWheelErrorMessage(
  errorCode: GameApiErrorCode | null,
  t: (key: string, values?: Record<string, string | number>) => string
) {
  switch (errorCode) {
    case "SUPABASE_NOT_CONFIGURED":
      return t("errors.storage_unavailable");
    case "RATE_LIMITED":
      return t("errors.rate_limited");
    case "NO_TASKS_LEFT":
      return t("errors.no_tasks_left");
    case "PLAYER_NOT_FOUND":
    case "UNAUTHORIZED":
      return t("errors.session_required");
    case "ROUND_ALREADY_RESOLVED":
    case "ROUND_NOT_FOUND":
    case "INVALID_DATA":
    case "PERSISTENCE_ERROR":
      return t("errors.generic");
    default:
      return null;
  }
}

export function getDisplayRound(
  activeRound: WheelRoundSnapshot | null,
  resolvedRound: ResolvedRound | null
) {
  return resolvedRound ?? activeRound;
}
