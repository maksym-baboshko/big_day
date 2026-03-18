import "server-only";

import { getSupabaseAdminClient } from "./supabase";

export class UnauthorizedGameRequestError extends Error {
  constructor() {
    super("The game request is not authenticated.");
    this.name = "UnauthorizedGameRequestError";
  }
}

function readBearerToken(request: Request) {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedGameRequestError();
  }

  const token = header.slice("Bearer ".length).trim();

  if (!token) {
    throw new UnauthorizedGameRequestError();
  }

  return token;
}

export async function requireAuthenticatedGameUser(request: Request) {
  const token = readBearerToken(request);
  const supabase = getSupabaseAdminClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new UnauthorizedGameRequestError();
  }

  return user;
}
