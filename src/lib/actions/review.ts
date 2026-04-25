"use server";

import path from "node:path";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import {
  buildImpactChanges,
  entityConfig,
  getEntityConfig,
  normalizeFieldValue,
  type SupportedEntityType
} from "@/lib/review/change-routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import {
  candidateBatchDir,
  loadCandidateBatch,
  promoteCandidateBatch,
  type CandidatePromotionTableRows
} from "../../../scripts/ingestion-candidates";
import { loadSeedData } from "../../../scripts/seed-utils";

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function insertAuditEvent(input: {
  actorId: string;
  actorEmail: string;
  actorName: string | null;
  eventType: string;
  entityType: string;
  entityId: string;
  summary: string;
}) {
  if (!hasSupabaseEnv()) {
    return;
  }

  const supabase = createAdminClient();
  await supabase.from("audit_log").insert({
    actor_id: input.actorId,
    actor_email: input.actorEmail,
    actor_name: input.actorName,
    event_type: input.eventType,
    entity_type: input.entityType,
    entity_id: input.entityId,
    summary: input.summary
  });
}

function revalidateOperationalPaths(pagePath = "") {
  revalidatePath("/app");
  revalidatePath("/review");
  revalidatePath("/domains");
  revalidatePath("/domains/[slug]", "page");
  revalidatePath("/companies");
  revalidatePath("/use-cases");
  revalidatePath("/use-cases/[slug]", "page");
  revalidatePath("/capabilities/[id]", "page");
  revalidatePath("/companies/[id]", "page");

  if (pagePath.startsWith("/")) {
    revalidatePath(pagePath);
  }
}

async function applyLowImpactUpdate(input: {
  entityType: SupportedEntityType;
  entityId: string;
  updates: Record<string, string | null>;
  actor: Awaited<ReturnType<typeof requireProfile>>;
  pagePath: string;
}) {
  const config = getEntityConfig(input.entityType);
  const changedFields = Object.keys(input.updates);

  if (!changedFields.length) {
    return;
  }

  if (!hasSupabaseEnv()) {
    revalidateOperationalPaths(input.pagePath);
    return;
  }

  const supabase = createAdminClient();
  const updatePayload: Record<string, string | null> = {
    ...input.updates
  };

  if (config.table === "capabilities" || config.table === "companies") {
    updatePayload.last_updated_at = new Date().toISOString();
  }

  await supabase.from(config.table).update(updatePayload).eq("id", input.entityId);

  await insertAuditEvent({
    actorId: input.actor.id,
    actorEmail: input.actor.email,
    actorName: input.actor.fullName,
    eventType: "low_impact_edit",
    entityType: input.entityType,
    entityId: input.entityId,
    summary: `Updated ${changedFields.join(", ")}.`
  });

  revalidateOperationalPaths(input.pagePath);
}

async function createHighImpactRequest(input: {
  entityType: SupportedEntityType;
  entityId: string;
  beforeValue: Record<string, unknown>;
  afterValue: Record<string, unknown>;
  actor: Awaited<ReturnType<typeof requireProfile>>;
  pagePath: string;
}) {
  const changedFields = Object.keys(input.afterValue);

  if (!changedFields.length) {
    return;
  }

  if (!hasSupabaseEnv()) {
    revalidateOperationalPaths(input.pagePath);
    return;
  }

  const supabase = createAdminClient();

  await supabase.from("change_requests").insert({
    entity_type: input.entityType,
    entity_id: input.entityId,
    changed_fields: changedFields,
    before_value: input.beforeValue,
    after_value: input.afterValue,
    requester_name: input.actor.fullName ?? input.actor.email,
    requester_email: input.actor.email,
    status: "pending"
  });

  await insertAuditEvent({
    actorId: input.actor.id,
    actorEmail: input.actor.email,
    actorName: input.actor.fullName,
    eventType: "high_impact_change_requested",
    entityType: input.entityType,
    entityId: input.entityId,
    summary: `Submitted review request for ${changedFields.join(", ")}.`
  });

  revalidateOperationalPaths(input.pagePath);
}

export async function saveCapabilityDetails(formData: FormData) {
  const profile = await requireProfile("editor");
  const entityType: SupportedEntityType = "capability";
  const entityId = getStringValue(formData, "entityId");
  const pagePath = getStringValue(formData, "pagePath");

  const fields = ["summary", "company_facing_context"] as const;
  const updates = Object.fromEntries(
    fields
      .map((fieldName) => {
        const nextValue = normalizeFieldValue(entityType, fieldName, getStringValue(formData, fieldName));
        const currentValue = normalizeFieldValue(
          entityType,
          fieldName,
          getStringValue(formData, `current_${fieldName}`)
        );

        if (nextValue === currentValue) {
          return null;
        }

        return [fieldName, nextValue];
      })
      .filter((value): value is [string, string | null] => Boolean(value))
  );

  await applyLowImpactUpdate({
    entityType,
    entityId,
    updates,
    actor: profile,
    pagePath
  });
}

export async function saveCompanyDetails(formData: FormData) {
  const profile = await requireProfile("editor");
  const entityType: SupportedEntityType = "company";
  const entityId = getStringValue(formData, "entityId");
  const pagePath = getStringValue(formData, "pagePath");

  const fields = [
    "overview",
    "market_context",
    "website_url",
    "public_contact_email",
    "public_contact_phone"
  ] as const;

  const updates = Object.fromEntries(
    fields
      .map((fieldName) => {
        const nextValue = normalizeFieldValue(entityType, fieldName, getStringValue(formData, fieldName));
        const currentValue = normalizeFieldValue(
          entityType,
          fieldName,
          getStringValue(formData, `current_${fieldName}`)
        );

        if (nextValue === currentValue) {
          return null;
        }

        return [fieldName, nextValue];
      })
      .filter((value): value is [string, string | null] => Boolean(value))
  );

  await applyLowImpactUpdate({
    entityType,
    entityId,
    updates,
    actor: profile,
    pagePath
  });
}

export async function submitCapabilityMappingEdit(formData: FormData) {
  const profile = await requireProfile("editor");
  const entityType: SupportedEntityType = "capability_use_case";
  const entityId = getStringValue(formData, "entityId");
  const pagePath = getStringValue(formData, "pagePath");
  const config = getEntityConfig(entityType);
  const allFields = [...config.lowImpactFields, ...config.highImpactFields];
  const nextValues = Object.fromEntries(
    allFields.map((fieldName) => [fieldName, getStringValue(formData, fieldName)])
  );
  const currentValues = Object.fromEntries(
    allFields.map((fieldName) => [fieldName, getStringValue(formData, `current_${fieldName}`)])
  );
  const { lowImpactUpdates, highImpactBefore, highImpactAfter } = buildImpactChanges({
    entityType,
    nextValues,
    currentValues
  });

  if (Object.keys(lowImpactUpdates).length) {
    await applyLowImpactUpdate({
      entityType,
      entityId,
      updates: lowImpactUpdates,
      actor: profile,
      pagePath
    });
  }

  if (Object.keys(highImpactAfter).length) {
    await createHighImpactRequest({
      entityType,
      entityId,
      beforeValue: highImpactBefore,
      afterValue: highImpactAfter,
      actor: profile,
      pagePath
    });
  }
}

export async function reviewChangeRequest(changeRequestId: string, decision: "approved" | "rejected") {
  const profile = await requireProfile("reviewer");

  if (!hasSupabaseEnv()) {
    revalidateOperationalPaths("/review");
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

  const entityType = request.entity_type as SupportedEntityType;
  const config = entityType in entityConfig ? getEntityConfig(entityType) : null;
  const isRefreshRequest = Array.isArray(request.changed_fields) && request.changed_fields.includes("refresh_requested");

  if (decision === "approved" && config && !isRefreshRequest) {
    const updatePayload =
      config.table === "capabilities" || config.table === "companies"
        ? {
            ...(request.after_value as Record<string, unknown>),
            last_updated_at: new Date().toISOString()
          }
        : (request.after_value as Record<string, unknown>);

    await supabase.from(config.table).update(updatePayload).eq("id", request.entity_id);
  }

  await supabase
    .from("change_requests")
    .update({
      status: decision,
      reviewer_name: profile.fullName ?? profile.email,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", changeRequestId);

  await insertAuditEvent({
    actorId: profile.id,
    actorEmail: profile.email,
    actorName: profile.fullName,
    eventType: `change_request_${decision}`,
    entityType: request.entity_type,
    entityId: request.entity_id,
    summary: `${decision === "approved" ? "Approved" : "Rejected"} change request.`
  });

  revalidateOperationalPaths("/review");
}

function resolveCandidateBatchPath(candidateFilePath: string) {
  const root = path.resolve(candidateBatchDir);
  const resolved = path.resolve(process.cwd(), candidateFilePath);

  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error("Candidate batch must live inside data/ingestion/candidate-batches.");
  }

  return resolved;
}

async function upsertPromotedCandidateRows(tables: CandidatePromotionTableRows[]) {
  if (!hasSupabaseEnv()) {
    return;
  }

  const supabase = createAdminClient();

  for (const table of tables) {
    if (!table.rows.length) {
      continue;
    }

    const { error } = await supabase.from(table.tableName).upsert(table.rows, {
      onConflict: "id"
    });

    if (error) {
      throw error;
    }
  }
}

export async function promoteIngestionCandidate(formData: FormData) {
  const profile = await requireProfile("reviewer");
  const candidateFilePath = getStringValue(formData, "candidateFilePath");
  const resolvedPath = resolveCandidateBatchPath(candidateFilePath);
  const batch = await loadCandidateBatch(resolvedPath);
  const reviewerName = profile.fullName ?? profile.email;

  const promotion = await promoteCandidateBatch({
    batch,
    filePath: resolvedPath,
    reviewer: reviewerName,
    seedData: await loadSeedData(),
    beforeWrite: upsertPromotedCandidateRows
  });

  await insertAuditEvent({
    actorId: profile.id,
    actorEmail: profile.email,
    actorName: profile.fullName,
    eventType: "ingestion_candidate_promoted",
    entityType: "ingestion_candidate",
    entityId: batch.batchId,
    summary: `Promoted ${promotion.result.counts.companies} companies, ${promotion.result.counts.capabilities} capabilities, and ${promotion.result.counts.mappings} mappings from ${batch.title}.`
  });

  revalidateOperationalPaths("/review");
}

export async function requestRefresh(entityType: string, entityId: string) {
  const profile = await requireProfile("editor");

  if (!hasSupabaseEnv()) {
    revalidateOperationalPaths("/review");
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

  await insertAuditEvent({
    actorId: profile.id,
    actorEmail: profile.email,
    actorName: profile.fullName,
    eventType: "refresh_requested",
    entityType,
    entityId,
    summary: "Requested manual refresh."
  });

  revalidateOperationalPaths("/review");
}
