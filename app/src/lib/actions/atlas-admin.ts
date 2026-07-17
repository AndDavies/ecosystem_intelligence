"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { parseAtlasOrganizationCandidate, splitCandidateList } from "@/lib/atlas/candidate-schema";
import { createClient } from "@/lib/supabase/server";

const intakeSchema = z.object({
  sourceUrl: z.string().url().optional(),
  sourceVisibility: z.enum(["public", "permissioned", "internal"]),
  notes: z.string().trim().max(2000).optional()
});

function safeFilename(value: string) {
  return value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "document";
}

export async function stageSourceIntake(formData: FormData) {
  const user = await requireAtlasStaff("editor");
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();
  const parsed = intakeSchema.safeParse({
    sourceUrl: sourceUrl || undefined,
    sourceVisibility: String(formData.get("sourceVisibility") ?? "public"),
    notes: String(formData.get("notes") ?? "").trim() || undefined
  });
  const document = formData.get("document");
  const hasDocument = document instanceof File && document.size > 0;
  if (!parsed.success || (!parsed.data.sourceUrl && !hasDocument)) redirect("/admin/intake?error=invalid-source");

  const supabase = await createClient({ writeCookies: true });
  let storagePath: string | null = null;
  if (hasDocument) {
    storagePath = `${user.id}/${Date.now()}-${safeFilename(document.name)}`;
    const { error } = await supabase.storage.from("atlas-private-intake").upload(storagePath, document, {
      contentType: document.type || "application/octet-stream",
      upsert: false
    });
    if (error) redirect("/admin/intake?error=upload-failed");
  }

  const { data: run, error: runError } = await supabase
    .from("research_runs")
    .insert({
      run_type: "manual",
      scope: { intake_type: hasDocument ? "document" : "url", source_visibility: parsed.data.sourceVisibility },
      status: "queued",
      created_by: user.id
    })
    .select("id")
    .single();
  if (runError || !run) redirect("/admin/intake?error=stage-failed");

  const { error: candidateError } = await supabase.from("candidate_changes").insert({
    research_run_id: run.id,
    candidate_kind: "source_intake",
    proposed_record: {
      canonical_url: parsed.data.sourceUrl ?? null,
      private_storage_path: storagePath,
      source_visibility: parsed.data.sourceVisibility,
      editor_notes: parsed.data.notes ?? null
    },
    field_evidence: [],
    duplicate_check: { status: "pending" },
    confidence: "needs_review",
    status: "pending"
  });
  if (candidateError) redirect("/admin/intake?error=stage-failed");

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    actor_role: user.role,
    event_type: "source_intake_staged",
    entity_type: "research_run",
    entity_id: run.id,
    summary: "Editor staged a source for extraction and review.",
    metadata: { source_visibility: parsed.data.sourceVisibility, has_document: hasDocument, has_url: Boolean(parsed.data.sourceUrl) }
  });
  revalidatePath("/admin");
  revalidatePath("/admin/intake");
  revalidatePath("/admin/review");
  redirect("/admin/intake?success=staged");
}

const reviewSchema = z.object({
  candidateId: z.string().uuid(),
  decision: z.enum(["accept", "reject", "defer"]),
  rationale: z.string().trim().min(3).max(2000)
});

const candidateEditSchema = z.object({
  candidateId: z.string().uuid(),
  rationale: z.string().trim().min(3).max(2000),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(40).max(4000),
  websiteUrl: z.string().url().startsWith("https://"),
  city: z.string().trim().min(1).max(160),
  provinceTerritory: z.string().trim().min(1).max(160),
  latitude: z.coerce.number().min(41).max(84),
  longitude: z.coerce.number().min(-142).max(-52),
  confidence: z.enum(["high", "moderate"]),
  capabilityName: z.string().trim().min(1).max(240),
  capabilitySummary: z.string().trim().min(40).max(4000),
  capabilityType: z.string().trim().min(1).max(240),
  technicalDomainSlug: z.string().trim().min(1),
  clusterSlug: z.string().trim().max(240).optional(),
  sourceTitle: z.string().trim().min(1).max(500),
  sourceUrl: z.string().url().startsWith("https://"),
  sourcePublisher: z.string().trim().min(1).max(240),
  sourceExcerpt: z.string().trim().min(30).max(4000)
});

function revalidateReviewPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/review");
  revalidatePath("/admin/publish");
}

export async function reviewAtlasCandidate(formData: FormData) {
  const user = await requireAtlasStaff("reviewer");
  const parsed = reviewSchema.safeParse({
    candidateId: String(formData.get("candidateId") ?? ""),
    decision: String(formData.get("decision") ?? ""),
    rationale: String(formData.get("rationale") ?? "")
  });
  if (!parsed.success) redirect("/admin/review?error=invalid-review");
  const supabase = await createClient({ writeCookies: true });
  const { data: candidate } = await supabase
    .from("candidate_changes")
    .select("id, candidate_kind, proposed_record, duplicate_check, status")
    .eq("id", parsed.data.candidateId)
    .single();
  if (!candidate || candidate.status === "published" || candidate.status === "superseded") {
    redirect("/admin/review?error=invalid-review");
  }
  if (parsed.data.decision === "accept" && candidate.candidate_kind === "organization_bundle") {
    if (!parseAtlasOrganizationCandidate(candidate.proposed_record).success) {
      redirect("/admin/review?error=invalid-candidate");
    }
    const duplicateCheck = candidate.duplicate_check as { status?: string } | null;
    if (duplicateCheck?.status === "possible_match") {
      redirect("/admin/review?error=duplicate-unresolved");
    }
  }
  const status = parsed.data.decision === "accept" ? "approved" : parsed.data.decision === "reject" ? "rejected" : "pending";

  const { error: decisionError } = await supabase.from("review_decisions").insert({
    candidate_change_id: parsed.data.candidateId,
    reviewer_id: user.id,
    decision: parsed.data.decision,
    field_decisions: [],
    rationale: parsed.data.rationale
  });
  if (decisionError) redirect("/admin/review?error=review-failed");
  await supabase.from("candidate_changes").update({ status, updated_at: new Date().toISOString() }).eq("id", parsed.data.candidateId);
  await supabase.from("audit_events").insert({
    actor_id: user.id,
    actor_role: user.role,
    event_type: "candidate_reviewed",
    entity_type: "candidate_change",
    entity_id: parsed.data.candidateId,
    summary: `Reviewer recorded a ${parsed.data.decision} decision.`,
    metadata: { decision: parsed.data.decision, publication_changed: false }
  });
  revalidateReviewPaths();
}

export async function editAtlasCandidate(formData: FormData) {
  const user = await requireAtlasStaff("reviewer");
  const parsed = candidateEditSchema.safeParse({
    candidateId: String(formData.get("candidateId") ?? ""),
    rationale: String(formData.get("rationale") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    websiteUrl: String(formData.get("websiteUrl") ?? ""),
    city: String(formData.get("city") ?? ""),
    provinceTerritory: String(formData.get("provinceTerritory") ?? ""),
    latitude: String(formData.get("latitude") ?? ""),
    longitude: String(formData.get("longitude") ?? ""),
    confidence: String(formData.get("confidence") ?? ""),
    capabilityName: String(formData.get("capabilityName") ?? ""),
    capabilitySummary: String(formData.get("capabilitySummary") ?? ""),
    capabilityType: String(formData.get("capabilityType") ?? ""),
    technicalDomainSlug: String(formData.get("technicalDomainSlug") ?? ""),
    clusterSlug: String(formData.get("clusterSlug") ?? ""),
    sourceTitle: String(formData.get("sourceTitle") ?? ""),
    sourceUrl: String(formData.get("sourceUrl") ?? ""),
    sourcePublisher: String(formData.get("sourcePublisher") ?? ""),
    sourceExcerpt: String(formData.get("sourceExcerpt") ?? "")
  });
  if (!parsed.success) redirect("/admin/review?error=invalid-edit");

  const supabase = await createClient({ writeCookies: true });
  const { data: candidate } = await supabase
    .from("candidate_changes")
    .select("id, proposed_record, status")
    .eq("id", parsed.data.candidateId)
    .single();
  const current = parseAtlasOrganizationCandidate(candidate?.proposed_record);
  if (!candidate || !current.success || candidate.status === "published" || candidate.status === "superseded") {
    redirect("/admin/review?error=invalid-edit");
  }

  const proposed = {
    ...current.data,
    name: parsed.data.name,
    description: parsed.data.description,
    websiteUrl: parsed.data.websiteUrl,
    city: parsed.data.city,
    provinceTerritory: parsed.data.provinceTerritory,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    confidence: parsed.data.confidence,
    capability: {
      ...current.data.capability,
      name: parsed.data.capabilityName,
      summary: parsed.data.capabilitySummary,
      type: parsed.data.capabilityType,
      features: splitCandidateList(formData.get("features")),
      applications: splitCandidateList(formData.get("applications")),
      tags: splitCandidateList(formData.get("tags")),
      technicalDomainSlug: parsed.data.technicalDomainSlug,
      additionalTechnicalDomainSlugs: splitCandidateList(formData.get("additionalTechnicalDomainSlugs")),
      clusterSlug: parsed.data.clusterSlug || null
    },
    source: {
      ...current.data.source,
      title: parsed.data.sourceTitle,
      url: parsed.data.sourceUrl,
      publisher: parsed.data.sourcePublisher,
      excerpt: parsed.data.sourceExcerpt
    }
  };
  const validated = parseAtlasOrganizationCandidate(proposed);
  if (!validated.success) redirect("/admin/review?error=invalid-edit");

  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name, slug, website_url")
    .limit(1000);
  const normalizedName = validated.data.name.trim().toLowerCase();
  const normalizedWebsite = validated.data.websiteUrl.replace(/\/$/, "").toLowerCase();
  const duplicateMatches = (organizations ?? []).filter((organization) =>
    organization.slug === validated.data.slug ||
    String(organization.name).trim().toLowerCase() === normalizedName ||
    String(organization.website_url ?? "").replace(/\/$/, "").toLowerCase() === normalizedWebsite
  );
  const duplicateCheck = {
    status: duplicateMatches.length ? "possible_match" : "clear",
    checkedAt: new Date().toISOString(),
    matches: duplicateMatches.map((organization) => ({ id: organization.id, name: organization.name, slug: organization.slug }))
  };

  const before = current.data;
  const changedFields = Object.keys(validated.data).filter((key) =>
    JSON.stringify(before[key as keyof typeof before]) !== JSON.stringify(validated.data[key as keyof typeof validated.data])
  );
  const { error: updateError } = await supabase
    .from("candidate_changes")
    .update({ proposed_record: validated.data, duplicate_check: duplicateCheck, confidence: validated.data.confidence, status: "pending" })
    .eq("id", candidate.id);
  if (updateError) redirect("/admin/review?error=edit-failed");

  await supabase.from("review_decisions").insert({
    candidate_change_id: candidate.id,
    reviewer_id: user.id,
    decision: "edit",
    field_decisions: changedFields.map((field) => ({ field, decision: "edited" })),
    rationale: parsed.data.rationale
  });
  await supabase.from("audit_events").insert({
    actor_id: user.id,
    actor_role: user.role,
    event_type: "candidate_edited",
    entity_type: "candidate_change",
    entity_id: candidate.id,
    summary: "Reviewer edited a staged organization candidate.",
    metadata: { changed_fields: changedFields, publication_changed: false }
  });
  revalidateReviewPaths();
  redirect("/admin/review?success=edited");
}

const mergeSchema = z.object({
  candidateId: z.string().uuid(),
  canonicalOrganizationId: z.string().uuid(),
  rationale: z.string().trim().min(3).max(2000)
});

export async function mergeAtlasCandidate(formData: FormData) {
  const user = await requireAtlasStaff("reviewer");
  const parsed = mergeSchema.safeParse({
    candidateId: String(formData.get("candidateId") ?? ""),
    canonicalOrganizationId: String(formData.get("canonicalOrganizationId") ?? ""),
    rationale: String(formData.get("rationale") ?? "")
  });
  if (!parsed.success) redirect("/admin/review?error=invalid-merge");
  const supabase = await createClient({ writeCookies: true });
  const { data: organization } = await supabase.from("organizations").select("id, name, slug").eq("id", parsed.data.canonicalOrganizationId).single();
  if (!organization) redirect("/admin/review?error=invalid-merge");

  const { error } = await supabase
    .from("candidate_changes")
    .update({
      status: "superseded",
      target_entity_type: "organization",
      target_entity_id: organization.id,
      duplicate_check: { status: "merged", canonicalOrganization: organization, resolvedAt: new Date().toISOString() }
    })
    .eq("id", parsed.data.candidateId)
    .in("status", ["pending", "approved"]);
  if (error) redirect("/admin/review?error=merge-failed");
  await supabase.from("review_decisions").insert({
    candidate_change_id: parsed.data.candidateId,
    reviewer_id: user.id,
    decision: "merge",
    field_decisions: [],
    rationale: parsed.data.rationale
  });
  await supabase.from("audit_events").insert({
    actor_id: user.id,
    actor_role: user.role,
    event_type: "candidate_merged",
    entity_type: "candidate_change",
    entity_id: parsed.data.candidateId,
    summary: `Reviewer merged a duplicate candidate into ${organization.name}.`,
    metadata: { canonical_organization_id: organization.id, publication_changed: false }
  });
  revalidateReviewPaths();
  redirect("/admin/review?success=merged");
}

const publishSchema = z.object({
  candidateIds: z.array(z.string().uuid()).min(1).max(50),
  confirmation: z.string().trim()
});

export async function publishApprovedCandidates(formData: FormData) {
  const user = await requireAtlasStaff("reviewer");
  const parsed = publishSchema.safeParse({
    candidateIds: formData.getAll("candidateId").map(String),
    confirmation: String(formData.get("confirmation") ?? "")
  });
  if (!parsed.success || parsed.data.confirmation !== `PUBLISH ${parsed.data.candidateIds.length}`) {
    redirect("/admin/publish?error=confirmation");
  }
  const supabase = await createClient({ writeCookies: true });
  const { error } = await supabase.rpc("publish_approved_organization_candidates", {
    p_candidate_ids: parsed.data.candidateIds,
    p_reviewer_id: user.id
  });
  if (error) redirect("/admin/publish?error=publication-failed");
  revalidateTag("atlas-public");
  revalidateReviewPaths();
  revalidatePath("/");
  revalidatePath("/organizations");
  redirect(`/admin/publish?success=${parsed.data.candidateIds.length}`);
}
