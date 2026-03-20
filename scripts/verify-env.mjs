import fs from "node:fs";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const shouldCheckSmoke = args.has("--smoke") || args.size === 0;
const shouldCheckRsvp = args.has("--rsvp");
const repoRoot = process.cwd();

const requiredGamesEnv = [
  ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"],
  [
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ],
  ["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
];

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

function readFirstEnv(keys) {
  for (const key of keys) {
    const value = process.env[key]?.trim();

    if (value) {
      return { key, value };
    }
  }

  return null;
}

function readConfiguredSeedPaths(configText) {
  const match = configText.match(/^\s*sql_paths\s*=\s*\[(.*)\]\s*$/m);

  if (!match) {
    return [];
  }

  return Array.from(match[1].matchAll(/"([^"]+)"/g), ([, value]) => value);
}

loadEnvFile(path.join(repoRoot, ".env.local"));
loadEnvFile(path.join(repoRoot, ".env"));

const okLines = [];
const warningLines = [];
const errorLines = [];

function ok(message) {
  okLines.push(`[ok] ${message}`);
}

function warn(message) {
  warningLines.push(`[warn] ${message}`);
}

function fail(message) {
  errorLines.push(`[error] ${message}`);
}

if (shouldCheckSmoke) {
  for (const keys of requiredGamesEnv) {
    const envValue = readFirstEnv(keys);

    if (!envValue) {
      fail(`Missing required games env. Set one of: ${keys.join(", ")}`);
      continue;
    }

    ok(`Games env available via ${envValue.key}`);
  }

  const supabaseConfigPath = path.join(repoRoot, "supabase", "config.toml");

  if (!fs.existsSync(supabaseConfigPath)) {
    fail("Missing supabase/config.toml.");
  } else {
    const supabaseConfig = fs.readFileSync(supabaseConfigPath, "utf8");
    const anonymousSignInsMatch = supabaseConfig.match(
      /^\s*enable_anonymous_sign_ins\s*=\s*(true|false)\s*$/m
    );

    if (anonymousSignInsMatch?.[1] !== "true") {
      fail(
        "Local Supabase auth must keep enable_anonymous_sign_ins = true for games smoke checks."
      );
    } else {
      ok("Local Supabase anonymous sign-ins are enabled.");
    }

    const seedPaths = readConfiguredSeedPaths(supabaseConfig);

    if (seedPaths.length === 0) {
      warn("No Supabase seed files are configured in supabase/config.toml.");
    }

    for (const seedPath of seedPaths) {
      const normalizedSeedPath = seedPath.replace(/^\.\//, "");
      const absoluteSeedPath = path.join(repoRoot, "supabase", normalizedSeedPath);

      if (!fs.existsSync(absoluteSeedPath)) {
        fail(`Configured Supabase seed file is missing: supabase/${normalizedSeedPath}`);
      } else {
        ok(`Supabase seed file exists: supabase/${normalizedSeedPath}`);
      }
    }
  }
}

if (shouldCheckRsvp) {
  const deliveryMode = process.env.RSVP_DELIVERY_MODE?.trim() ?? "mock";

  if (deliveryMode === "mock") {
    ok("RSVP delivery is in mock mode.");
  } else {
    const resendApiKey = readFirstEnv(["RESEND_API_KEY"]);
    const rsvpToEmails = readFirstEnv(["RSVP_TO_EMAILS"]);

    if (!resendApiKey) {
      fail("Missing RESEND_API_KEY for non-mock RSVP delivery.");
    } else {
      ok(`RSVP delivery env available via ${resendApiKey.key}`);
    }

    if (!rsvpToEmails) {
      fail("Missing RSVP_TO_EMAILS for non-mock RSVP delivery.");
    } else {
      ok(`RSVP recipients env available via ${rsvpToEmails.key}`);
    }
  }
}

for (const line of okLines) {
  console.log(line);
}

for (const line of warningLines) {
  console.warn(line);
}

if (errorLines.length > 0) {
  for (const line of errorLines) {
    console.error(line);
  }

  process.exitCode = 1;
} else if (okLines.length > 0 || warningLines.length > 0) {
  console.log("[done] Environment checks passed.");
}
