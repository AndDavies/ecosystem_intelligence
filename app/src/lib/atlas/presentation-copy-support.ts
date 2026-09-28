import "server-only";
import {createPublicClient} from "@/lib/supabase/public";
let available: Promise<boolean> | undefined;
/** Migration capability probe, cached for this application process. A missing RPC is
 * an old schema, so no query names the additive columns and intake stays disabled.
 * Deploy/restart after migration to activate the new contract. */
export function dossierPresentationCopyAvailable() {
  return available ??= (async()=>{
    try { const {data,error}=await createPublicClient().rpc("dossier_presentation_copy_ready"); return !error && data===true; }
    catch { return false; }
  })();
}
