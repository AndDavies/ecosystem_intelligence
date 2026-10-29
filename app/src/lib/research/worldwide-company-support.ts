import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

let available: Promise<boolean> | undefined;
/** Advertise only after the additive intake and location-role migration exists. */
export function worldwideCompaniesAvailable() {
  return available ??= (async () => {
    try {
      const { data, error } = await createPublicClient().rpc("research_worldwide_companies_ready");
      return !error && data === true;
    } catch { return false; }
  })();
}
