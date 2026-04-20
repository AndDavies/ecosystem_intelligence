"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";

const lowImpactEditSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  fieldName: z.string().min(1),
  value: z.string().min(1)
});

const highImpactEditSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  changedFields: z.array(z.string()).min(1),
  beforeValue: z.record(z.string(), z.unknown()),
  afterValue: z.record(z.string(), z.unknown())
});

export async function saveLowImpactEdit(input: z.infer<typeof lowImpactEditSchema>) {
  const payload = lowImpactEditSchema.parse(input);
  const profile = await requireProfile("editor");

  if (!hasSupabaseEnv()) {
    return {
      success: true,
      message: `Saved ${payload.fieldName} update in development mode.`
    };
  }

  const supabase = createAdminClient();

  await supabase
    .from(payload.entityType)
    .update({
      [payload.fieldName]: payload.value,
      last_updated_at: new Date().toISOString()
    })
    .eq("id", payload.entityId);

  await supabase.from("audit_log").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    actor_name: profile.fullName,
    event_type: "low_impact_edit",
    entity_type: payload.entityType,
    entity_id: payload.entityId,
    summary: `Updated ${payload.fieldName}.`
  });

  revalidatePath("/app");
  revalidatePath("/use-cases");

  return { success: true };
}

export async function submitHighImpactChange(input: z.infer<typeof highImpactEditSchema>) {
  const payload = highImpactEditSchema.parse(input);
  const profile = await requireProfile("editor");

  if (!hasSupabaseEnv()) {
    return {
      success: true,
      message: "Change request captured in development mode."
    };
  }

  const supabase = createAdminClient();

  await supabase.from("change_requests").insert({
    entity_type: payload.entityType,
    entity_id: payload.entityId,
    changed_fields: payload.changedFields,
    before_value: payload.beforeValue,
    after_value: payload.afterValue,
    requester_name: profile.fullName ?? profile.email,
    requester_email: profile.email,
    status: "pending"
  });

  await supabase.from("audit_log").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    actor_name: profile.fullName,
    event_type: "high_impact_change_requested",
    entity_type: payload.entityType,
    entity_id: payload.entityId,
    summary: `Submitted review request for ${payload.changedFields.join(", ")}.`
  });

  revalidatePath("/review");

  return { success: true };
}

export async function reviewChangeRequest(changeRequestId: string, decision: "approved" | "rejected") {
  const profile = await requireProfile("reviewer");

  if (!hasSupabaseEnv()) {
    return;
  }

  const supabase = createAdminClient();
  const { data: request } = await supabase
    .from("change_requests")
    .select("*")
    .eq("id", changeRequestId)
    .single();

  if (!request) {
    return;
  }

  if (decision === "approved") {
    await supabase
      .from(request.entity_type)
      .update(request.after_value)
      .eq("id", request.entity_id);
  }

  await supabase
    .from("change_requests")
    .update({
      status: decision,
      reviewer_name: profile.fullName ?? profile.email,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", changeRequestId);

  await supabase.from("audit_log").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    actor_name: profile.fullName,
    event_type: `change_request_${decision}`,
    entity_type: request.entity_type,
    entity_id: request.entity_id,
    summary: `${decision === "approved" ? "Approved" : "Rejected"} high-impact change.`
  });

  revalidatePath("/review");
  revalidatePath("/use-cases");

}

export async function requestRefresh(entityType: string, entityId: string) {
  const profile = await requireProfile("editor");

  if (!hasSupabaseEnv()) {
    return;
  }

  const supabase = createAdminClient();
  await supabase.from("change_requests").insert({
    entity_type: entityType,
    entity_id: entityId,
    changed_fields: ["refresh_requested"],
    before_value: {},
    after_value: { refresh_requested: true },
    requester_name: profile.fullName ?? profile.email,
    requester_email: profile.email,
    status: "pending"
  });

  await supabase.from("audit_log").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    actor_name: profile.fullName,
    event_type: "refresh_requested",
    entity_type: entityType,
    entity_id: entityId,
    summary: "Requested manual refresh."
  });

  revalidatePath("/review");

}
