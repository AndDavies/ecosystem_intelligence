import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicKey } from "@/lib/supabase/env";

export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    getSupabasePublicKey(),
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false
      },
      global: {
        headers: { "X-Client-Info": "ecosystem-intelligence-public-atlas" }
      }
    }
  );
}
