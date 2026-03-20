import "server-only";

export function getRequestId(request: Request): string {
  const explicitRequestId = request.headers.get("x-request-id")?.trim();

  if (explicitRequestId) {
    return explicitRequestId;
  }

  const vercelRequestId = request.headers.get("x-vercel-id")?.trim();

  if (vercelRequestId) {
    return vercelRequestId;
  }

  return crypto.randomUUID();
}
