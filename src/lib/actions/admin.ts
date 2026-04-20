"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function triggerEnrichmentRun(entityType: string, entityId: string) {
  const profile = await requireProfile("admin");

  if (!hasSupabaseEnv()) {
    return;
  }

  const supabase = createAdminClient();
  await supabase.from("ai_runs").insert({
    entity_type: entityType,
    entity_id: entityId,
    status: "queued",
    prompt_version: "v1"
  });

  await supabase.from("audit_log").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    actor_name: profile.fullName,
    event_type: "ai_run_queued",
    entity_type: entityType,
    entity_id: entityId,
    summary: "Queued enrichment run."
  });

  revalidatePath("/admin/enrichment");

}
