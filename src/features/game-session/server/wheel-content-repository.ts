import "server-only";

import type {
  GameSessionRow,
  WheelCategoryRow,
  WheelPlayerTaskHistoryRow,
  WheelTaskRow,
} from "./types";
import { getSupabaseAdminClient } from "./supabase";
import {
  WHEEL_CATEGORY_SELECT,
  WHEEL_TASK_SELECT,
} from "./queries";
import { updateWheelSession } from "./wheel-session-repository";

export async function getActiveWheelCategories() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wheel_categories")
    .select(WHEEL_CATEGORY_SELECT)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as WheelCategoryRow[];
}

export async function getActiveWheelTasks() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wheel_tasks")
    .select(WHEEL_TASK_SELECT)
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  return (data ?? []) as WheelTaskRow[];
}

export async function getWheelTaskById(taskId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wheel_tasks")
    .select(WHEEL_TASK_SELECT)
    .eq("id", taskId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as WheelTaskRow | null) ?? null;
}

export async function getWheelCategoryById(categoryId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wheel_categories")
    .select(WHEEL_CATEGORY_SELECT)
    .eq("id", categoryId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as WheelCategoryRow | null) ?? null;
}

export async function getWheelHistoryForCycle(sessionId: string, cycleNumber: number) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wheel_player_task_history")
    .select("session_id, player_id, task_id, round_id, cycle_number, assigned_at")
    .eq("session_id", sessionId)
    .eq("cycle_number", cycleNumber);

  if (error) {
    throw error;
  }

  return (data ?? []) as WheelPlayerTaskHistoryRow[];
}

export async function getRecentWheelHistoryForSession(sessionId: string, limit = 20) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wheel_player_task_history")
    .select("session_id, player_id, task_id, round_id, cycle_number, assigned_at")
    .eq("session_id", sessionId)
    .order("assigned_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as WheelPlayerTaskHistoryRow[];
}

export function buildSelectableTaskGroups({
  categories,
  tasks,
  usedTaskIds,
  recentTaskIds,
}: {
  categories: readonly WheelCategoryRow[];
  tasks: readonly WheelTaskRow[];
  usedTaskIds: Set<string>;
  recentTaskIds: Set<string>;
}) {
  return categories
    .map((category) => {
      const eligibleTasks = tasks.filter(
        (task) => task.category_id === category.id && !usedTaskIds.has(task.id)
      );

      if (eligibleTasks.length === 0) {
        return null;
      }

      const preferredTasks = eligibleTasks.filter((task) => !recentTaskIds.has(task.id));

      return {
        category,
        tasks: preferredTasks.length > 0 ? preferredTasks : eligibleTasks,
      };
    })
    .filter(Boolean) as { category: WheelCategoryRow; tasks: WheelTaskRow[] }[];
}

export async function ensureWheelSessionCycle(
  session: GameSessionRow,
  totalTaskCount: number
) {
  let cycleNumber = session.current_cycle;
  let cycleHistory = await getWheelHistoryForCycle(session.id, cycleNumber);

  if (cycleHistory.length < totalTaskCount) {
    return { session, cycleNumber, cycleHistory };
  }

  const updatedSession = await updateWheelSession(session.id, {
    current_cycle: session.current_cycle + 1,
  });

  cycleNumber = updatedSession.current_cycle;
  cycleHistory = [];

  return { session: updatedSession, cycleNumber, cycleHistory };
}
