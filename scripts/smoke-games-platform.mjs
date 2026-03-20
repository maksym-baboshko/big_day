import childProcess from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  cleanupAutomatedTestRuntimeData,
  CURRENT_SMOKE_NICKNAME_PREFIX,
} from "./cleanup-automated-test-data.mjs";
import {
  SmokeRequestError,
  assertOk,
  createSmokeRunState,
  formatSmokeError,
  runSmokeStep,
  toSmokeStepError,
} from "./smoke-games-platform-helpers.mjs";

const EXTERNAL_BASE_URL = process.env.SMOKE_BASE_URL?.trim() || null;
const SMOKE_SERVER_HOST = "127.0.0.1";
const DEFAULT_SMOKE_PORT = Number(process.env.SMOKE_PORT ?? 3000);
const SERVER_READY_TIMEOUT_MS = 120_000;
const SERVER_SHUTDOWN_TIMEOUT_MS = 10_000;
const SMOKE_READY_PATH = "/en/games";
const SMOKE_LIVE_PAGE_PATH = "/en/live";
const NEXT_BUILD_ID_PATH = path.join(process.cwd(), ".next/BUILD_ID");
const SMOKE_CLEANUP_SCOPES = ["smoke", "legacy"];

function createBaseUrl(port) {
  return `http://${SMOKE_SERVER_HOST}:${port}`;
}

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
    throw new SmokeRequestError(`Failed to reach ${label} (${url}).${details}`, {
      url,
    });
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

async function verifyLocalDevServer(baseUrl, label = "the local Next.js server") {
  const candidates = getCandidateBaseUrls(baseUrl);
  const failures = [];

  for (const baseUrl of candidates) {
    const url = `${baseUrl}${SMOKE_READY_PATH}`;

    try {
      const response = await fetchOrThrow(
        url,
        { cache: "no-store" },
        label
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
      `Failed to reach ${label}.`,
      `Tried base URLs: ${candidates.join(", ")}.`,
      "If your app is running on another host or port, set SMOKE_BASE_URL explicitly.",
      ...failures,
    ].join(" ")
  );
}

async function waitForServerReady(
  baseUrl,
  label,
  timeoutMs = SERVER_READY_TIMEOUT_MS,
  pollIntervalMs = 1000
) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      return await verifyLocalDevServer(baseUrl, label);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  throw lastError ?? new Error(`Timed out waiting for ${label} to become ready.`);
}

function checkPortAvailability(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", (error) => {
      server.close();

      if (error && typeof error === "object" && "code" in error && error.code === "EADDRINUSE") {
        resolve(false);
        return;
      }

      reject(error);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, SMOKE_SERVER_HOST);
  });
}

async function getAvailablePort(preferredPort) {
  if (await checkPortAvailability(preferredPort)) {
    return preferredPort;
  }

  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", reject);
    server.once("listening", () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Failed to allocate a smoke-test port.")));
        return;
      }

      server.close(() => resolve(address.port));
    });

    server.listen(0, SMOKE_SERVER_HOST);
  });
}

function hasProductionBuild() {
  return fs.existsSync(NEXT_BUILD_ID_PATH);
}

function createLogBuffer(limit = 200) {
  const entries = [];

  return {
    push(line) {
      if (!line) {
        return;
      }

      entries.push(line);
      if (entries.length > limit) {
        entries.shift();
      }
    },
    dump() {
      return entries.join("\n");
    },
  };
}

function pipeServerLogs(stream, prefix, buffer) {
  let pending = "";

  stream.on("data", (chunk) => {
    const text = `${pending}${chunk}`;
    const lines = text.split(/\r?\n/);
    pending = lines.pop() ?? "";

    for (const line of lines) {
      const formatted = `${prefix} ${line}`;
      buffer.push(formatted);
      console.error(formatted);
    }
  });

  stream.on("end", () => {
    if (!pending) {
      return;
    }

    const formatted = `${prefix} ${pending}`;
    buffer.push(formatted);
    console.error(formatted);
  });
}

async function startManagedServerProcess(port, commandArgs, label) {
  const baseUrl = createBaseUrl(port);
  const logBuffer = createLogBuffer();
  const child = childProcess.spawn("pnpm", commandArgs, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  pipeServerLogs(child.stdout, "[smoke server]", logBuffer);
  pipeServerLogs(child.stderr, "[smoke server]", logBuffer);

  let exited = false;
  child.once("exit", () => {
    exited = true;
  });

  try {
    await waitForServerReady(baseUrl, label);
  } catch (error) {
    if (!exited) {
      child.kill("SIGTERM");
    }

    const logs = logBuffer.dump();
    const details = logs ? `\n\nRecent server logs:\n${logs}` : "";
    throw new Error(
      `${error instanceof Error ? error.message : "Managed smoke server failed to start."}${details}`
    );
  }

  return {
    baseUrl,
    child,
    logBuffer,
    async stop() {
      if (exited || child.exitCode !== null) {
        return;
      }

      child.kill("SIGTERM");

      await Promise.race([
        new Promise((resolve) => {
          child.once("exit", resolve);
        }),
        new Promise((resolve) => {
          setTimeout(() => {
            if (child.exitCode === null) {
              child.kill("SIGKILL");
            }
            resolve();
          }, SERVER_SHUTDOWN_TIMEOUT_MS);
        }),
      ]);
    },
  };
}

async function startManagedServer() {
  const port = await getAvailablePort(DEFAULT_SMOKE_PORT);

  try {
    return await startManagedServerProcess(
      port,
      ["exec", "next", "dev", "--hostname", SMOKE_SERVER_HOST, "--port", String(port)],
      "the managed smoke dev server"
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!message.includes("Unable to acquire lock")) {
      throw error;
    }

    if (!hasProductionBuild()) {
      throw new Error(
        [
          "Detected an existing Next.js dev lock while starting the managed smoke server.",
          "Run `pnpm build` first or set `SMOKE_BASE_URL` to an already running app.",
        ].join(" ")
      );
    }

    console.error(
      "[smoke server] Existing Next.js dev lock detected. Falling back to `next start` using the current production build."
    );

    return startManagedServerProcess(
      port,
      ["exec", "next", "start", "--hostname", SMOKE_SERVER_HOST, "--port", String(port)],
      "the managed smoke production server"
    );
  }
}

async function waitForLiveEvent(baseUrl, nickname, attempts = 8, delayMs = 1000) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const url = `${baseUrl}/api/live?leaderboardLimit=10&feedLimit=5`;
    const liveSnapshotResponse = await fetchOrThrow(
      url,
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
    assertOk(liveSnapshot.response, liveSnapshot.payload, "Failed to read live snapshot", {
      url,
    });

    const liveEvent = liveSnapshot.payload?.feed?.find?.((event) => event.playerName === nickname);
    if (liveEvent) {
      return liveEvent;
    }

    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new SmokeRequestError(
    "Live snapshot does not contain the smoke-test player event.",
    {
      url: `${baseUrl}/api/live?leaderboardLimit=10&feedLimit=5`,
    }
  );
}

async function main() {
  loadEnvFile(path.join(process.cwd(), ".env.local"));
  const smokeRun = createSmokeRunState();
  let primaryError = null;

  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const publishableKey = getRequiredEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );

  let managedServer = null;
  let baseUrl = null;
  let smokeSummary = null;

  try {
    await runSmokeStep(smokeRun, "cleanup_before", async () => {
      await cleanupAutomatedTestRuntimeData({
        scopes: SMOKE_CLEANUP_SCOPES,
      });
    });

    managedServer = EXTERNAL_BASE_URL ? null : await startManagedServer();
    baseUrl = managedServer
      ? managedServer.baseUrl
      : await verifyLocalDevServer(EXTERNAL_BASE_URL);

    const supabase = createClient(supabaseUrl, publishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const authResult = await runSmokeStep(smokeRun, "auth", async () => {
      try {
        const result = await supabase.auth.signInAnonymously();

        if (result.error || !result.data.session?.access_token) {
          throw result.error ?? new Error("Anonymous auth session is missing.");
        }

        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown fetch failure";
        throw new SmokeRequestError(
          `Failed to sign in anonymously with Supabase (${supabaseUrl}). ${message}`,
          { url: supabaseUrl }
        );
      }
    });

    const accessToken = authResult.data.session.access_token;
    const authHeaders = {
      Authorization: `Bearer ${accessToken}`,
    };

    const pagesToCheck = [
      `${baseUrl}${SMOKE_LIVE_PAGE_PATH}`,
      `${baseUrl}/api/live?leaderboardLimit=10&feedLimit=5`,
    ];

    await runSmokeStep(smokeRun, "health_check", async () => {
      for (const url of pagesToCheck) {
        const response = await fetchOrThrow(url, { cache: "no-store" }, url);
        assertOk(response, null, `Smoke check failed for ${url}`, { url });
      }
    });

    await runSmokeStep(smokeRun, "bootstrap_player", async () => requestJson(
      `${baseUrl}/api/games/player?locale=uk`,
      {
        method: "GET",
        cache: "no-store",
        headers: authHeaders,
      }
    ).then((result) => {
      assertOk(
        result.response,
        result.payload,
        "Failed to bootstrap player profile",
        { url: `${baseUrl}/api/games/player?locale=uk` }
      );
      return result;
    }));

    const nickname = `${CURRENT_SMOKE_NICKNAME_PREFIX}${new Date().toLocaleTimeString("en-GB", {
      hour12: false,
    })}`.slice(0, 40);

    await runSmokeStep(smokeRun, "save_player", async () => {
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
      assertOk(savedPlayer.response, savedPlayer.payload, "Failed to save player profile", {
        url: `${baseUrl}/api/games/player`,
      });
      return savedPlayer;
    });

    const wheelStart = await runSmokeStep(smokeRun, "start_round", async () => {
      const result = await requestJson(`${baseUrl}/api/games/wheel`, {
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
      assertOk(result.response, result.payload, "Failed to start wheel round", {
        url: `${baseUrl}/api/games/wheel`,
      });
      const round = result.payload?.round;
      if (!round?.roundId || !round.task) {
        throw new Error("Wheel round payload is missing the round snapshot.");
      }
      return round;
    });

    let activeRound = wheelStart;
    if (wheelStart.task.executionMode === "timed") {
      const timerUrl = `${baseUrl}/api/games/wheel/${wheelStart.roundId}/timer`;
      const timerStart = await runSmokeStep(smokeRun, "start_timer", async () => {
        const result = await requestJson(timerUrl, {
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
        assertOk(
          result.response,
          result.payload,
          "Failed to start timed wheel round",
          { url: timerUrl }
        );
        return result.payload?.round ?? wheelStart;
      });
      activeRound = timerStart;
    }

    let resolution = "completed";
    let responseText = null;

    if (activeRound.task.executionMode === "deferred" && activeRound.task.allowPromise) {
      resolution = "promised";
    } else if (activeRound.task.responseMode === "text_input") {
      responseText = `test-smoke-answer-${Date.now()}`;
    } else if (
      activeRound.task.responseMode === "choice"
      && Array.isArray(activeRound.task.choiceOptions)
      && activeRound.task.choiceOptions.length > 0
    ) {
      responseText = activeRound.task.choiceOptions[0];
    }

    const resolveUrl = `${baseUrl}/api/games/wheel/${activeRound.roundId}`;
    await runSmokeStep(smokeRun, "resolve_round", async () => {
      const wheelResolve = await requestJson(resolveUrl, {
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
        }),
      }
      );
      assertOk(wheelResolve.response, wheelResolve.payload, "Failed to resolve wheel round", {
        url: resolveUrl,
      });
      return wheelResolve;
    });

    await runSmokeStep(smokeRun, "leaderboard", async () => requestJson(
      `${baseUrl}/api/games/leaderboard?game=wheel-of-fortune&topLimit=5&radius=2`,
      {
        method: "GET",
        cache: "no-store",
        headers: authHeaders,
      }
    ).then((result) => {
      assertOk(
        result.response,
        result.payload,
        "Failed to read game leaderboard",
        { url: `${baseUrl}/api/games/leaderboard?game=wheel-of-fortune&topLimit=5&radius=2` }
      );
      return result;
    }));

    const liveEvent = await runSmokeStep(smokeRun, "live_snapshot", async () =>
      waitForLiveEvent(baseUrl, nickname)
    );

    smokeSummary = {
      ok: true,
      baseUrl,
      nickname,
      roundId: activeRound.roundId,
      resolution,
      liveEventType: liveEvent.eventType,
    };
  } catch (error) {
    primaryError = toSmokeStepError(error, smokeRun);

    if (managedServer?.logBuffer?.dump?.()) {
      primaryError.serverLogDump = managedServer.logBuffer.dump();
    }
  } finally {
    try {
      await runSmokeStep(smokeRun, "cleanup_after", async () => {
        await cleanupAutomatedTestRuntimeData({
          scopes: SMOKE_CLEANUP_SCOPES,
        });
      });
    } catch (error) {
      const cleanupError = toSmokeStepError(error, smokeRun, "cleanup_after");

      if (!primaryError) {
        primaryError = cleanupError;
      } else {
        console.error(
          formatSmokeError(cleanupError, {
            serverLogDump: managedServer?.logBuffer?.dump?.() ?? "",
          })
        );
      }
    }

    await managedServer?.stop();
  }

  if (primaryError) {
    throw primaryError;
  }

  console.log(JSON.stringify({
    ...smokeSummary,
    stepsCompleted: smokeRun.stepsCompleted,
  }, null, 2));
}

main().catch((error) => {
  console.error(
    formatSmokeError(error, {
      serverLogDump:
        error && typeof error === "object" && "serverLogDump" in error
          ? error.serverLogDump
          : "",
    })
  );
  process.exitCode = 1;
});
