import "server-only";

export interface ServerLogContext {
  [key: string]: unknown;
}

export interface ServerLogEntry {
  scope: string;
  event: string;
  requestId?: string | null;
  context?: ServerLogContext;
  error?: unknown;
}

export interface ServerLogPayload {
  timestamp: string;
  level: "info" | "error";
  scope: string;
  event: string;
  requestId: string | null;
  context: ServerLogContext;
  error: unknown;
}

function serializeError(error: unknown): unknown {
  if (error instanceof Error) {
    const cause =
      "cause" in error && error.cause !== undefined
        ? serializeError(error.cause)
        : undefined;

    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? null,
      ...(cause !== undefined ? { cause } : {}),
    };
  }

  return error ?? null;
}

export function createServerLogPayload(
  level: ServerLogPayload["level"],
  entry: ServerLogEntry
): ServerLogPayload {
  return {
    timestamp: new Date().toISOString(),
    level,
    scope: entry.scope,
    event: entry.event,
    requestId: entry.requestId ?? null,
    context: entry.context ?? {},
    error: entry.error === undefined ? null : serializeError(entry.error),
  };
}

export function logServerInfo(entry: ServerLogEntry): void {
  console.info(createServerLogPayload("info", entry));
}

export function logServerError(entry: ServerLogEntry): void {
  console.error(createServerLogPayload("error", entry));
}
