const MAX_PAYLOAD_SNIPPET_LENGTH = 400;

function createPayloadSnippet(payload) {
  if (payload == null) {
    return null;
  }

  const rawPayload =
    typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);

  if (rawPayload.length <= MAX_PAYLOAD_SNIPPET_LENGTH) {
    return rawPayload;
  }

  return `${rawPayload.slice(0, MAX_PAYLOAD_SNIPPET_LENGTH)}…`;
}

export class SmokeRequestError extends Error {
  constructor(message, { payload = null, status = null, url = null } = {}) {
    super(message);
    this.name = "SmokeRequestError";
    this.payloadSnippet = createPayloadSnippet(payload);
    this.status = status;
    this.url = url;
  }
}

export class SmokeStepError extends Error {
  constructor(message, { cause = null, failingStep, stepsCompleted } = {}) {
    super(message);
    this.name = "SmokeStepError";
    this.cause = cause;
    this.failingStep = failingStep ?? "unknown";
    this.stepsCompleted = [...(stepsCompleted ?? [])];
    this.lastSuccessfulStep = this.stepsCompleted.at(-1) ?? null;
  }
}

export function createSmokeRunState() {
  return {
    currentStep: null,
    stepsCompleted: [],
  };
}

export function toSmokeStepError(error, state, failingStep = state.currentStep) {
  if (error instanceof SmokeStepError) {
    return error;
  }

  const message =
    error instanceof Error && error.message
      ? error.message
      : "Smoke test failed.";

  return new SmokeStepError(message, {
    cause: error,
    failingStep,
    stepsCompleted: state.stepsCompleted,
  });
}

export async function runSmokeStep(state, step, run) {
  state.currentStep = step;

  try {
    const result = await run();
    state.stepsCompleted.push(step);
    return result;
  } catch (error) {
    throw toSmokeStepError(error, state, step);
  }
}

export function assertOk(response, payload, message, { url = null } = {}) {
  if (response.ok) {
    return;
  }

  const payloadMessage =
    payload && typeof payload === "object" && typeof payload.error === "string"
      ? `: ${payload.error}`
      : "";

  throw new SmokeRequestError(`${message} (${response.status})${payloadMessage}`, {
    payload,
    status: response.status,
    url: url ?? response.url ?? null,
  });
}

export function formatSmokeError(
  error,
  { serverLogDump = "", stepsCompleted = [] } = {}
) {
  const normalizedError =
    error instanceof SmokeStepError
      ? error
      : new SmokeStepError(
          error instanceof Error ? error.message : "Smoke test failed.",
          { cause: error, stepsCompleted }
        );

  const lines = [
    `Smoke test failed at step \`${normalizedError.failingStep}\`.`,
    `Last successful step: \`${normalizedError.lastSuccessfulStep ?? "none"}\`.`,
  ];

  if (normalizedError.stepsCompleted.length > 0) {
    lines.push(`Completed steps: ${normalizedError.stepsCompleted.join(", ")}.`);
  }

  const requestError =
    normalizedError.cause instanceof SmokeRequestError
      ? normalizedError.cause
      : normalizedError instanceof SmokeRequestError
        ? normalizedError
        : null;

  if (requestError?.status != null) {
    lines.push(`HTTP status: ${requestError.status}.`);
  }

  if (requestError?.url) {
    lines.push(`Request URL: ${requestError.url}.`);
  }

  if (requestError?.payloadSnippet) {
    lines.push(`Payload snippet:\n${requestError.payloadSnippet}`);
  }

  lines.push(normalizedError.message);

  if (serverLogDump) {
    lines.push(`Recent server logs:\n${serverLogDump}`);
  }

  return lines.join("\n");
}
