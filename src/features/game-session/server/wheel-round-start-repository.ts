import "server-only";

import type { SupportedLocale } from "@/shared/config";
import type { WheelRoundAssignmentRow } from "./types";
import {
  buildWeightedCategoryPool,
  getCategorySpinAngle,
  getWheelRoundPayload,
  mapWheelRoundSnapshot,
  normalizeOptionalResponseText,
  pickRandomItem,
  type JsonObject,
} from "./repository-helpers";
import { getSupabaseAdminClient } from "./supabase";
import {
  buildSelectableTaskGroups,
  ensureWheelSessionCycle,
  getActiveWheelCategories,
  getActiveWheelTasks,
  getRecentWheelHistoryForSession,
} from "./wheel-content-repository";
import { getOrCreateWheelSession } from "./wheel-session-repository";
import {
  getOpenWheelRoundForSession,
  getWheelRoundById,
  getWheelRoundContext,
  requireReadyPlayerProfile,
  WheelTasksDepletedError,
} from "./wheel-round-shared";

export async function startWheelRound({
  playerId,
  locale,
}: {
  playerId: string;
  locale: SupportedLocale;
}) {
  const supabase = getSupabaseAdminClient();
  await requireReadyPlayerProfile(playerId);

  const session = await getOrCreateWheelSession(playerId);
  const existingOpenRound = await getOpenWheelRoundForSession(session.id, playerId);

  if (existingOpenRound) {
    const { assignment, category, task } = await getWheelRoundContext(
      existingOpenRound.id,
      playerId
    );

    return {
      round: mapWheelRoundSnapshot({
        round: existingOpenRound,
        assignment,
        category,
        task,
        locale,
      }),
    };
  }

  const [categories, tasks, recentHistory] = await Promise.all([
    getActiveWheelCategories(),
    getActiveWheelTasks(),
    getRecentWheelHistoryForSession(session.id, 20),
  ]);

  if (categories.length === 0 || tasks.length === 0) {
    throw new WheelTasksDepletedError();
  }

  const sessionState = await ensureWheelSessionCycle(session, tasks.length);
  const usedTaskIds = new Set(sessionState.cycleHistory.map((entry) => entry.task_id));
  const recentTaskIds = new Set(recentHistory.map((entry) => entry.task_id));
  const availableGroups = buildSelectableTaskGroups({
    categories,
    tasks,
    usedTaskIds,
    recentTaskIds,
  });

  if (availableGroups.length === 0) {
    throw new WheelTasksDepletedError();
  }

  const weightedCategories = buildWeightedCategoryPool(
    availableGroups.map((group) => group.category)
  );
  const selectedCategory = pickRandomItem(weightedCategories);
  const selectedGroup = availableGroups.find(
    (group) => group.category.id === selectedCategory.id
  );

  if (!selectedGroup || selectedGroup.tasks.length === 0) {
    throw new WheelTasksDepletedError();
  }

  const selectedTask = pickRandomItem(selectedGroup.tasks);
  const spinAngle = getCategorySpinAngle(categories, selectedCategory.id);
  const selectionRank = sessionState.cycleHistory.length + 1;
  const startedAt = new Date().toISOString();
  const isTimedTask = selectedTask.execution_mode === "timed";
  const roundMetadata = {
    source: "wheel-round",
    locale,
    categorySlug: selectedCategory.slug,
    taskKey: selectedTask.task_key,
    cycleNumber: sessionState.cycleNumber,
    selectionRank,
  } satisfies JsonObject;
  const roundPayload = getWheelRoundPayload({
    round: {
      session_id: sessionState.session.id,
      timer_status: isTimedTask ? "idle" : "none",
      timer_duration_seconds: selectedTask.timer_seconds,
      timer_remaining_seconds: selectedTask.timer_seconds,
      timer_last_started_at: null,
      timer_last_paused_at: null,
    },
    assignment: {
      spin_angle: spinAngle,
      cycle_number: sessionState.cycleNumber,
      selection_rank: selectionRank,
    },
    category: selectedCategory,
    task: selectedTask,
    locale,
  });

  const { data: roundId, error: roundError } = await supabase.rpc(
    "start_wheel_round_atomic",
    {
      p_session_id: sessionState.session.id,
      p_player_id: playerId,
      p_started_at: startedAt,
      p_category_id: selectedCategory.id,
      p_task_id: selectedTask.id,
      p_spin_angle: spinAngle,
      p_cycle_number: sessionState.cycleNumber,
      p_selection_rank: selectionRank,
      p_timer_status: isTimedTask ? "idle" : "none",
      p_timer_duration_seconds: selectedTask.timer_seconds,
      p_timer_remaining_seconds: selectedTask.timer_seconds,
      p_round_metadata: roundMetadata,
      p_activity_payload: roundPayload,
    }
  );

  if (roundError) {
    if (roundError.code === "23505") {
      const latestOpenRound = await getOpenWheelRoundForSession(
        sessionState.session.id,
        playerId
      );

      if (latestOpenRound) {
        const { assignment, category, task } = await getWheelRoundContext(
          latestOpenRound.id,
          playerId
        );

        return {
          round: mapWheelRoundSnapshot({
            round: latestOpenRound,
            assignment,
            category,
            task,
            locale,
          }),
        };
      }
    }

    throw roundError;
  }

  const createdRoundId = normalizeOptionalResponseText(roundId);
  if (!createdRoundId) {
    throw new Error("Failed to create wheel round atomically.");
  }

  const roundRecord = await getWheelRoundById(createdRoundId, playerId);
  if (!roundRecord) {
    throw new Error("Failed to read wheel round after atomic start.");
  }

  const assignment: WheelRoundAssignmentRow = {
    round_id: roundRecord.id,
    category_id: selectedCategory.id,
    task_id: selectedTask.id,
    spin_angle: spinAngle,
    cycle_number: sessionState.cycleNumber,
    selection_rank: selectionRank,
    created_at: startedAt,
  };

  return {
    round: mapWheelRoundSnapshot({
      round: roundRecord,
      assignment,
      category: selectedCategory,
      task: selectedTask,
      locale,
    }),
  };
}
