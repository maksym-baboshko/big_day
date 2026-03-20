import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const GENERATED_TYPES_FILE = path.join(
  ROOT_DIR,
  "src/features/game-session/server/supabase-types.generated.ts"
);
const GENERATED_META_FILE = path.join(
  ROOT_DIR,
  "src/features/game-session/server/supabase-types.generated.meta.json"
);
const BASELINE_SCHEMA_FILE = path.join(
  ROOT_DIR,
  "supabase/games_platform_schema.sql"
);
const MIGRATIONS_DIR = path.join(ROOT_DIR, "supabase/migrations");

function getSchemaFiles() {
  const migrationFiles = readdirSync(MIGRATIONS_DIR)
    .filter((entry) => entry.endsWith(".sql"))
    .sort()
    .map((entry) => path.join(MIGRATIONS_DIR, entry));

  return [BASELINE_SCHEMA_FILE, ...migrationFiles];
}

function getRelativeSchemaFiles() {
  return getSchemaFiles().map((filePath) => path.relative(ROOT_DIR, filePath));
}

function computeSchemaFingerprint() {
  const hash = createHash("sha256");

  for (const filePath of getSchemaFiles()) {
    const relativePath = path.relative(ROOT_DIR, filePath);
    hash.update(relativePath);
    hash.update("\n");
    hash.update(readFileSync(filePath));
    hash.update("\n---\n");
  }

  return hash.digest("hex");
}

function normalizeGeneratedTypes(content) {
  return content.replace(/\r\n/g, "\n").trimEnd() + "\n";
}

function readGeneratedMeta() {
  if (!existsSync(GENERATED_META_FILE)) {
    throw new Error(
      "Missing Supabase types metadata. Run `pnpm supabase:types:generate -- --local` or `--linked`."
    );
  }

  return JSON.parse(readFileSync(GENERATED_META_FILE, "utf8"));
}

function writeGeneratedMeta(mode) {
  const metadata = {
    schemaFingerprint: computeSchemaFingerprint(),
    sourceFiles: getRelativeSchemaFiles(),
    generatedWith: mode,
  };

  mkdirSync(path.dirname(GENERATED_META_FILE), { recursive: true });
  writeFileSync(
    GENERATED_META_FILE,
    JSON.stringify(metadata, null, 2) + "\n",
    "utf8"
  );
}

function resolveMode(args, { required = false } = {}) {
  const hasLocalFlag = args.includes("--local");
  const hasLinkedFlag = args.includes("--linked");

  if (hasLocalFlag && hasLinkedFlag) {
    throw new Error("Choose either `--local` or `--linked`, not both.");
  }

  if (hasLocalFlag) {
    return "local";
  }

  if (hasLinkedFlag) {
    return "linked";
  }

  const envMode = process.env.SUPABASE_TYPES_MODE;
  if (envMode === "local" || envMode === "linked") {
    return envMode;
  }

  if (process.env.CI === "true") {
    return "local";
  }

  if (process.env.SUPABASE_ACCESS_TOKEN) {
    return "linked";
  }

  if (required) {
    throw new Error(
      "Supabase type generation requires an explicit mode. Pass `--local` or `--linked`."
    );
  }

  return null;
}

function runSupabaseTypegen(mode) {
  const args = [
    "exec",
    "supabase",
    "gen",
    "types",
    "typescript",
    `--${mode}`,
    "--schema",
    "public",
  ];

  try {
    const output = execFileSync("pnpm", args, {
      cwd: ROOT_DIR,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    return normalizeGeneratedTypes(output);
  } catch (error) {
    const details =
      error instanceof Error && "stderr" in error
        ? String(error.stderr ?? "").trim()
        : "";

    throw new Error(
      details
        ? `Supabase type generation failed: ${details}`
        : "Supabase type generation failed."
    );
  }
}

function generateTypes(args) {
  const mode = resolveMode(args, { required: true });
  const output = runSupabaseTypegen(mode);

  mkdirSync(path.dirname(GENERATED_TYPES_FILE), { recursive: true });
  writeFileSync(GENERATED_TYPES_FILE, output, "utf8");
  writeGeneratedMeta(mode);

  console.log(
    `Updated ${path.relative(ROOT_DIR, GENERATED_TYPES_FILE)} using --${mode}.`
  );
}

function checkTypes(args) {
  const expectedFingerprint = computeSchemaFingerprint();
  const metadata = readGeneratedMeta();

  if (metadata.schemaFingerprint !== expectedFingerprint) {
    throw new Error(
      "Supabase schema changed without refreshing generated types. Run `pnpm supabase:types:generate -- --local` or `--linked`."
    );
  }

  if (!existsSync(GENERATED_TYPES_FILE)) {
    throw new Error(
      "Missing generated Supabase types file. Run `pnpm supabase:types:generate -- --local` or `--linked`."
    );
  }

  if (!args.includes("--verify-output")) {
    console.log("Supabase type fingerprint is up to date.");
    return;
  }

  const mode = resolveMode(args, { required: true });
  const committedOutput = normalizeGeneratedTypes(
    readFileSync(GENERATED_TYPES_FILE, "utf8")
  );
  const generatedOutput = runSupabaseTypegen(mode);

  if (committedOutput !== generatedOutput) {
    throw new Error(
      "Committed Supabase types differ from `supabase gen types`. Run `pnpm supabase:types:generate -- --local` or `--linked` and commit the result."
    );
  }

  console.log(`Supabase generated types match --${mode} output.`);
}

function main() {
  const [command = "check", ...args] = process.argv.slice(2);

  if (command === "generate") {
    generateTypes(args);
    return;
  }

  if (command === "check") {
    checkTypes(args);
    return;
  }

  throw new Error(
    `Unknown command "${command}". Use \`generate\` or \`check\`.`
  );
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
}
