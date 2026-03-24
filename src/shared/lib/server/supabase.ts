import "server-only";

import { createClient } from "@supabase/supabase-js";

function getSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  );
}

function getSupabaseServiceKey(): string {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let adminClient: ReturnType<typeof createClient<any, any, any>> | null = null;

export function getSupabaseAdminClient() {
  if (!adminClient) {
    const url = getSupabaseUrl();
    const key = getSupabaseServiceKey();

    if (!url || !key) {
      throw new Error(
        "Supabase admin client: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required."
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adminClient = createClient<any, any, any>(url, key, {
      auth: { persistSession: false },
    });
  }

  return adminClient;
}
