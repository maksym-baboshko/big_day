import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

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
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

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

  throw new Error(`Missing required environment variable. Tried: ${keys.join(", ")}`);
}

async function requestJson(url, init = {}) {
  const response = await fetchOrThrow(url, init, url);
  const payload = await response
    .json()
    .catch(() => null);

  return { response, payload };
}

async function fetchOrThrow(url, init = {}, label = url) {
  try {
    return await fetch(url, init);
  } catch (error) {
    const parts = [];

    if (error instanceof Error && error.message) {
      parts.push(error.message);
    }

    if (error instanceof Error && "cause" in error && error.cause) {
      parts.push(`cause: ${String(error.cause)}`);
    }

    const details = parts.length > 0 ? ` ${parts.join(" | ")}` : "";
    throw new Error(`Failed to reach ${label} (${url}).${details}`);
  }
}

function getCandidateBaseUrls(baseUrl) {
  const candidates = [baseUrl];

  try {
    const parsed = new URL(baseUrl);

    if (parsed.hostname === "localhost") {
      parsed.hostname = "127.0.0.1";
      candidates.push(parsed.toString().replace(/\/$/, ""));
    }
  } catch {
    return candidates;
  }

  return [...new Set(candidates)];
}

async function verifyLocalDevServer() {
  const candidates = getCandidateBaseUrls(DEFAULT_BASE_URL);
  const failures = [];

  for (const baseUrl of candidates) {
    const url = `${baseUrl}/games`;

    try {
      const response = await fetchOrThrow(
        url,
        { cache: "no-store" },
        "the local Next.js server"
      );

      assertOk(
        response,
        null,
        `Smoke check failed for ${url}. Make sure the local app is running`
      );

      return baseUrl;
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  }

  throw new Error(
    [
      "Failed to reach the local Next.js server.",
      `Tried base URLs: ${candidates.join(", ")}.`,
      "If your app is running on another host or port, set SMOKE_BASE_URL explicitly.",
      ...failures,
    ].join(" ")
  );
}

function assertOk(response, payload, message) {
  if (!response.ok) {
    const payloadMessage =
      payload && typeof payload === "object" && typeof payload.error === "string"
        ? `: ${payload.error}`
        : "";

    throw new Error(`${message} (${response.status})${payloadMessage}`);
  }
}

async function waitForLiveEvent(baseUrl, nickname, attempts = 8, delayMs = 1000) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const liveSnapshotResponse = await fetchOrThrow(
      `${baseUrl}/api/live?leaderboardLimit=10&feedLimit=5`,
      {
        method: "GET",
        cache: "no-store",
      },
      "the local live snapshot route"
    );
    const liveSnapshot = {
      response: liveSnapshotResponse,
      payload: await liveSnapshotResponse.json().catch(() => null),
    };
    assertOk(liveSnapshot.response, liveSnapshot.payload, "Failed to read live snapshot");

    const liveEvent = liveSnapshot.payload?.feed?.find?.((event) => event.playerName === nickname);
    if (liveEvent) {
      return liveEvent;
    }

    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error("Live snapshot does not contain the smoke-test player event.");
}

async function main() {
  loadEnvFile(path.join(process.cwd(), ".env.local"));

  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const publishableKey = getRequiredEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );

  const baseUrl = await verifyLocalDevServer();

  const supabase = createClient(supabaseUrl, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let authResult;
  try {
    authResult = await supabase.auth.signInAnonymously();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fetch failure";
    throw new Error(
      `Failed to sign in anonymously with Supabase (${supabaseUrl}). ${message}`
    );
  }

  if (authResult.error || !authResult.data.session?.access_token) {
    throw authResult.error ?? new Error("Anonymous auth session is missing.");
  }

  const accessToken = authResult.data.session.access_token;
  const authHeaders = {
    Authorization: `Bearer ${accessToken}`,
  };

  const pagesToCheck = [
    `${baseUrl}/live`,
    `${baseUrl}/api/live?leaderboardLimit=10&feedLimit=5`,
  ];

  for (const url of pagesToCheck) {
    const response = await fetchOrThrow(
      url,
      { cache: "no-store" },
      url
    );
    assertOk(response, null, `Smoke check failed for ${url}`);
  }

  const initialPlayer = await requestJson(
    `${baseUrl}/api/games/player?locale=uk`,
    {
      method: "GET",
      cache: "no-store",
      headers: authHeaders,
    }
  );
  assertOk(initialPlayer.response, initialPlayer.payload, "Failed to bootstrap player profile");

  const nickname = `Smoke ${new Date().toLocaleTimeString("en-GB", {
    hour12: false,
  })}`;

  const savedPlayer = await requestJson(`${baseUrl}/api/games/player`, {
    method: "POST",
    cache: "no-store",
    headers: {
      ...authHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nickname,
      locale: "uk",
    }),
  });
  assertOk(savedPlayer.response, savedPlayer.payload, "Failed to save player profile");

  const wheelStart = await requestJson(`${baseUrl}/api/games/wheel`, {
    method: "POST",
    cache: "no-store",
    headers: {
      ...authHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      locale: "uk",
    }),
  });
  assertOk(wheelStart.response, wheelStart.payload, "Failed to start wheel round");

  const round = wheelStart.payload?.round;
  if (!round?.roundId || !round.task) {
    throw new Error("Wheel round payload is missing the round snapshot.");
  }

  let activeRound = round;
  if (round.task.executionMode === "timed") {
    const timerStart = await requestJson(
      `${baseUrl}/api/games/wheel/${round.roundId}/timer`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locale: "uk",
        }),
      }
    );
    assertOk(timerStart.response, timerStart.payload, "Failed to start timed wheel round");
    activeRound = timerStart.payload?.round ?? round;
  }

  let resolution = "completed";
  let responseText = null;
  let remainingSeconds = null;

  if (activeRound.task.executionMode === "deferred" && activeRound.task.allowPromise) {
    resolution = "promised";
  } else if (activeRound.task.responseMode === "text_input") {
    responseText = `Smoke answer ${Date.now()}`;
  } else if (
    activeRound.task.responseMode === "choice"
    && Array.isArray(activeRound.task.choiceOptions)
    && activeRound.task.choiceOptions.length > 0
  ) {
    responseText = activeRound.task.choiceOptions[0];
  }

  if (activeRound.task.executionMode === "timed") {
    remainingSeconds = Math.max((activeRound.task.timerSeconds ?? 1) - 1, 0);
  }

  const wheelResolve = await requestJson(
    `${baseUrl}/api/games/wheel/${activeRound.roundId}`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locale: "uk",
        resolution,
        responseText,
        remainingSeconds,
      }),
    }
  );
  assertOk(wheelResolve.response, wheelResolve.payload, "Failed to resolve wheel round");

  const leaderboard = await requestJson(
    `${baseUrl}/api/games/leaderboard?game=wheel-of-fortune&topLimit=5&radius=2`,
    {
      method: "GET",
      cache: "no-store",
      headers: authHeaders,
    }
  );
  assertOk(leaderboard.response, leaderboard.payload, "Failed to read game leaderboard");

  const liveEvent = await waitForLiveEvent(baseUrl, nickname);

  console.log(JSON.stringify({
    ok: true,
    nickname,
    roundId: activeRound.roundId,
    resolution,
    liveEventType: liveEvent.eventType,
  }, null, 2));
}

main().catch((error) => {
  if (error instanceof Error) {
    console.error(error.stack ?? error.message);
  } else {
    console.error("Smoke test failed.");
  }
  process.exitCode = 1;
});
