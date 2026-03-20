import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

export const CURRENT_E2E_NICKNAME_PREFIX = "test-e2e-";
export const CURRENT_SMOKE_NICKNAME_PREFIX = "test-smoke-";

const LEGACY_NICKNAME_PREFIXES = [
  "smoke ",
  "player-",
  "wheel-",
  "live-",
];

const NICKNAME_PREFIX_GROUPS = {
  e2e: [CURRENT_E2E_NICKNAME_PREFIX],
  smoke: [CURRENT_SMOKE_NICKNAME_PREFIX],
  legacy: LEGACY_NICKNAME_PREFIXES,
};

const ANSWER_PREFIX_GROUPS = {
  e2e: [],
  smoke: ["test-smoke-answer-"],
  legacy: ["smoke answer "],
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function getRequiredEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key]?.trim();

    if (value) {
      return value;
    }
  }

  throw new Error(
    `Missing required environment variable. Tried: ${keys.join(", ")}`
  );
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function matchesPrefix(value, prefixes) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return false;
  }

  return prefixes.some((prefix) => normalizedValue.startsWith(prefix));
}

function chunk(values, size = 100) {
  const chunks = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

function createAdminClient() {
  loadEnvFile(path.join(process.cwd(), ".env.local"));

  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv(
    "SUPABASE_SECRET_KEY",
    "SUPABASE_SERVICE_ROLE_KEY"
  );

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function resolvePrefixGroups(scopes = ["all"]) {
  if (scopes.includes("all")) {
    return {
      nicknamePrefixes: Object.values(NICKNAME_PREFIX_GROUPS).flat(),
      answerPrefixes: Object.values(ANSWER_PREFIX_GROUPS).flat(),
    };
  }

  const nicknamePrefixes = scopes.flatMap(
    (scope) => NICKNAME_PREFIX_GROUPS[scope] ?? []
  );
  const answerPrefixes = scopes.flatMap(
    (scope) => ANSWER_PREFIX_GROUPS[scope] ?? []
  );

  return {
    nicknamePrefixes,
    answerPrefixes,
  };
}

async function deleteByValues(supabase, table, column, values) {
  if (values.length === 0) {
    return;
  }

  for (const batch of chunk(values)) {
    const { error } = await supabase.from(table).delete().in(column, batch);

    if (error) {
      throw error;
    }
  }
}

async function deleteAuthUsers(supabase, userIds) {
  for (const userId of userIds) {
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (!error) {
      continue;
    }

    const message = error.message?.toLowerCase?.() ?? "";
    if (message.includes("not found")) {
      continue;
    }

    throw error;
  }
}

export async function cleanupAutomatedTestRuntimeData(options = {}) {
  const { logger = console, scopes = ["all"] } = options;
  const supabase = createAdminClient();
  const { nicknamePrefixes, answerPrefixes } = resolvePrefixGroups(scopes);

  const { data: profiles, error: profilesError } = await supabase
    .from("player_profiles")
    .select("id, display_name");

  if (profilesError) {
    throw profilesError;
  }

  const targetProfiles = (profiles ?? []).filter((profile) =>
    matchesPrefix(profile.display_name, nicknamePrefixes)
  );
  const targetPlayerIds = targetProfiles.map((profile) => profile.id);

  const { data: activityEvents, error: activityEventsError } = await supabase
    .from("activity_events")
    .select("id, player_id, snapshot_name, snapshot_answer_text");

  if (activityEventsError) {
    throw activityEventsError;
  }

  const targetPlayerIdSet = new Set(targetPlayerIds);
  const targetActivityEventIds = (activityEvents ?? [])
    .filter((event) => {
      if (event.player_id && targetPlayerIdSet.has(event.player_id)) {
        return true;
      }

      return (
        matchesPrefix(event.snapshot_name, nicknamePrefixes) ||
        matchesPrefix(event.snapshot_answer_text, answerPrefixes)
      );
    })
    .map((event) => event.id);

  const rateLimitIdentifiers = targetPlayerIds.map((playerId) => `user:${playerId}`);

  await deleteByValues(supabase, "request_rate_limits", "identifier", rateLimitIdentifiers);
  await deleteByValues(supabase, "activity_events", "id", targetActivityEventIds);
  await deleteByValues(supabase, "xp_transactions", "player_id", targetPlayerIds);
  await deleteByValues(
    supabase,
    "wheel_player_task_history",
    "player_id",
    targetPlayerIds
  );
  await deleteByValues(supabase, "player_profiles", "id", targetPlayerIds);
  await deleteAuthUsers(supabase, targetPlayerIds);

  if (logger && (targetPlayerIds.length > 0 || targetActivityEventIds.length > 0)) {
    logger.log(
      `[cleanup] Removed ${targetPlayerIds.length} automated-test players and ${targetActivityEventIds.length} activity events.`
    );
  }

  return {
    removedPlayers: targetPlayerIds.length,
    removedActivityEvents: targetActivityEventIds.length,
  };
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  cleanupAutomatedTestRuntimeData().catch((error) => {
    if (error instanceof Error) {
      console.error(error.stack ?? error.message);
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  });
}
