import "server-only";

import type { SupportedLocale } from "@/shared/config";
import { mapWheelRoundSnapshot } from "./repository-helpers";
import { getWheelSessionByPlayerId } from "./wheel-session-repository";
import {
  getOpenWheelRoundForSession,
  getWheelRoundContext,
  requireReadyPlayerProfile,
  updateRunningRoundToPaused,
} from "./wheel-round-shared";

export async function getOpenWheelRound({
  playerId,
  locale,
}: {
  playerId: string;
  locale: SupportedLocale;
}) {
  await requireReadyPlayerProfile(playerId);

  const session = await getWheelSessionByPlayerId(playerId);
  if (!session) {
    return { round: null };
  }

  const openRound = await getOpenWheelRoundForSession(session.id, playerId);
  if (!openRound) {
    return { round: null };
  }

  const { assignment, category, task } = await getWheelRoundContext(
    openRound.id,
    playerId
  );
  const restoredRound =
    task.execution_mode === "timed" && openRound.timer_status === "running"
      ? await updateRunningRoundToPaused(openRound, playerId)
      : openRound;

  return {
    round: mapWheelRoundSnapshot({
      round: restoredRound,
      assignment,
      category,
      task,
      locale,
    }),
  };
}
