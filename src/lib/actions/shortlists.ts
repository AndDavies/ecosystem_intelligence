"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { ShortlistItemStatus } from "@/types/domain";

const validStatuses: ShortlistItemStatus[] = ["watch", "validate", "engage", "hold"];

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalStringValue(formData: FormData, key: string) {
  const value = getStringValue(formData, key);
  return value.length ? value : null;
}

function getStatusValue(formData: FormData) {
  const value = getStringValue(formData, "status") as ShortlistItemStatus;
  return validStatuses.includes(value) ? value : "watch";
}

function isMissingShortlistSchemaError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: unknown; message?: unknown };
  return (
    candidate.code === "PGRST205" ||
    (typeof candidate.message === "string" &&
      (candidate.message.includes("public.shortlists") || candidate.message.includes("public.shortlist_items")))
  );
}

function appendQueryFlag(path: string, key: string, value: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(value)}`;
}

function handleShortlistWriteError(error: unknown, pagePath: string): never {
  if (isMissingShortlistSchemaError(error)) {
    redirect(appendQueryFlag(pagePath, "shortlistSetup", "missing-schema"));
  }

  throw error;
}

function revalidateShortlistPaths(pagePath?: string, shortlistId?: string) {
  revalidatePath("/app");
  revalidatePath("/shortlists");
  revalidatePath("/use-cases/[slug]", "page");
  revalidatePath("/use-cases/[slug]/briefing", "page");

  if (shortlistId) {
    revalidatePath(`/shortlists/${shortlistId}`);
  }

  if (pagePath?.startsWith("/")) {
    revalidatePath(pagePath);
  }
}

async function createDefaultShortlist(input: {
  useCaseId: string;
  useCaseName: string;
  actor: Awaited<ReturnType<typeof requireProfile>>;
}) {
  const supabase = createAdminClient();
  const id = randomUUID();
  const now = new Date().toISOString();
  const { error } = await supabase.from("shortlists").insert({
    id,
    name: `${input.useCaseName || "Use Case"} BD validation shortlist`,
    use_case_id: input.useCaseId,
    description: "Working list created from the BD validation briefing workflow.",
    creator_id: input.actor.id,
    creator_email: input.actor.email,
    creator_name: input.actor.fullName,
    created_at: now,
    updated_at: now
  });

  if (error) {
    throw error;
  }

  return id;
}

export async function createShortlist(formData: FormData) {
  const actor = await requireProfile();
  const useCaseId = getStringValue(formData, "useCaseId");
  const name = getStringValue(formData, "name") || "BD validation shortlist";
  const description = getOptionalStringValue(formData, "description");

  if (!hasSupabaseEnv()) {
    redirect("/shortlists?mock=1");
  }

  const supabase = createAdminClient();
  const id = randomUUID();
  const now = new Date().toISOString();
  const { error } = await supabase.from("shortlists").insert({
    id,
    name,
    use_case_id: useCaseId,
    description,
    creator_id: actor.id,
    creator_email: actor.email,
    creator_name: actor.fullName,
    created_at: now,
    updated_at: now
  });

  if (error) {
    handleShortlistWriteError(error, "/shortlists");
  }

  revalidateShortlistPaths(undefined, id);
  redirect(`/shortlists/${id}?shortlistCreated=1`);
}

export async function addShortlistItem(formData: FormData) {
  const actor = await requireProfile();
  const useCaseId = getStringValue(formData, "useCaseId");
  const useCaseName = getStringValue(formData, "useCaseName");
  const pagePath = getStringValue(formData, "pagePath") || "/shortlists";
  const capabilityId = getOptionalStringValue(formData, "capabilityId");
  const companyId = getOptionalStringValue(formData, "companyId");
  let shortlistId = getStringValue(formData, "shortlistId");

  if (!hasSupabaseEnv()) {
    redirect(`${pagePath}?mock=1`);
  }

  if (!shortlistId) {
    try {
      shortlistId = await createDefaultShortlist({ useCaseId, useCaseName, actor });
    } catch (error) {
      handleShortlistWriteError(error, pagePath);
    }
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const existingQuery = supabase
    .from("shortlist_items")
    .select("id")
    .eq("shortlist_id", shortlistId)
    .limit(1);
  const { data: existingRows, error: existingError } = capabilityId
    ? await existingQuery.eq("capability_id", capabilityId)
    : await existingQuery.is("capability_id", null).eq("company_id", companyId);

  if (existingError) {
    handleShortlistWriteError(existingError, pagePath);
  }

  const payload = {
    status: getStatusValue(formData),
    owner: getOptionalStringValue(formData, "owner"),
    next_step: getOptionalStringValue(formData, "nextStep"),
    due_date: getOptionalStringValue(formData, "dueDate"),
    rationale: getOptionalStringValue(formData, "rationale"),
    updated_at: now
  };
  const existingId = existingRows?.[0]?.id;
  const { error } = existingId
    ? await supabase.from("shortlist_items").update(payload).eq("id", existingId)
    : await supabase.from("shortlist_items").insert({
        id: randomUUID(),
        shortlist_id: shortlistId,
        capability_id: capabilityId,
        company_id: companyId,
        ...payload,
        created_at: now
      });

  if (error) {
    handleShortlistWriteError(error, pagePath);
  }

  await supabase.from("shortlists").update({ updated_at: now }).eq("id", shortlistId);
  revalidateShortlistPaths(pagePath, shortlistId);
  redirect(appendQueryFlag(pagePath, "shortlistItem", existingId ? "updated" : "added"));
}

export async function updateShortlistItem(formData: FormData) {
  await requireProfile();
  const itemId = getStringValue(formData, "itemId");
  const shortlistId = getStringValue(formData, "shortlistId");
  const pagePath = getStringValue(formData, "pagePath") || `/shortlists/${shortlistId}`;

  if (!hasSupabaseEnv()) {
    redirect(`${pagePath}?mock=1`);
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("shortlist_items")
    .update({
      status: getStatusValue(formData),
      owner: getOptionalStringValue(formData, "owner"),
      next_step: getOptionalStringValue(formData, "nextStep"),
      due_date: getOptionalStringValue(formData, "dueDate"),
      rationale: getOptionalStringValue(formData, "rationale"),
      updated_at: now
    })
    .eq("id", itemId);

  if (error) {
    handleShortlistWriteError(error, pagePath);
  }

  await supabase.from("shortlists").update({ updated_at: now }).eq("id", shortlistId);
  revalidateShortlistPaths(pagePath, shortlistId);
  redirect(appendQueryFlag(pagePath, "shortlistItem", "saved"));
}

export async function removeShortlistItem(formData: FormData) {
  await requireProfile();
  const itemId = getStringValue(formData, "itemId");
  const shortlistId = getStringValue(formData, "shortlistId");
  const pagePath = getStringValue(formData, "pagePath") || `/shortlists/${shortlistId}`;

  if (!hasSupabaseEnv()) {
    redirect(`${pagePath}?mock=1`);
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("shortlist_items").delete().eq("id", itemId);

  if (error) {
    handleShortlistWriteError(error, pagePath);
  }

  await supabase.from("shortlists").update({ updated_at: new Date().toISOString() }).eq("id", shortlistId);
  revalidateShortlistPaths(pagePath, shortlistId);
  redirect(appendQueryFlag(pagePath, "shortlistItem", "removed"));
}

export async function deleteShortlist(formData: FormData) {
  await requireProfile();
  const shortlistId = getStringValue(formData, "shortlistId");

  if (!hasSupabaseEnv()) {
    redirect("/shortlists?mock=1");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("shortlists").delete().eq("id", shortlistId);

  if (error) {
    handleShortlistWriteError(error, "/shortlists");
  }

  revalidateShortlistPaths("/shortlists", shortlistId);
  redirect("/shortlists?shortlistDeleted=1");
}
