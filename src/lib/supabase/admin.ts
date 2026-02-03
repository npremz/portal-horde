import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

// Admin client with service role key - use only server-side
export function createAdminClient() {
  const env = getServerEnv();
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
