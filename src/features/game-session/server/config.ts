import "server-only";

export class SupabaseConfigurationError extends Error {
  constructor() {
    super("Supabase is not configured.");
    this.name = "SupabaseConfigurationError";
  }
}

export function getSupabaseServerConfig() {
  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    null;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    null;

  if (!url || !secretKey) {
    throw new SupabaseConfigurationError();
  }

  return {
    url,
    serviceRoleKey: secretKey,
  };
}
