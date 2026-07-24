"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { parseAtlasOrganizationCandidate, parseDemandMatchCandidate, parseDemandRefreshCandidate, parseDemandSignalCandidate, parseOrganizationBundleV2, parseOrganizationRefreshCandidate, parseReviewableOrganizationCandidate, splitCandidateList } from "@/lib/atlas/candidate-schema";
import type { DemandRefreshBundleV1, DemandSignalBundleV1, OrganizationBundleV2, OrganizationRefreshBundleV1 } from "@/lib/research/pipeline-schema";
import { suggestDemandMatches } from "@/lib/atlas/demand-matching";
import { getAtlasSnapshot } from "@/lib/atlas/repository";
import { isSupportedResearchCandidateKind, researchCandidateContractIssues } from "@/lib/research/deployment-contract";
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

const typedResearchCandidateEditSchema = z.object({
  candidateId: z.string().uuid(),
  rationale: z.string().trim().min(3).max(2000),
  proposedRecordJson: z.string().trim().min(2).max(500000)
});

function normalizedIdentity(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizedWebsite(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase().replace(/\/$/, "");
}

function typedEvidenceIsComplete(record: OrganizationBundleV2 | DemandSignalBundleV1 | OrganizationRefreshBundleV1 | DemandRefreshBundleV1) {
  const sourceIds = new Set(record.sources.map((source) => source.id));
  if (record.fieldEvidence.some((evidence) => !sourceIds.has(evidence.sourceId))) return false;
  if (record.candidateKind === "organization_refresh_bundle" || record.candidateKind === "demand_refresh_bundle") {
    const evidenceIds = new Set(record.fieldEvidence.map((evidence) => evidence.id));
    return record.operations.every((operation) => operation.evidenceIds.every((evidenceId) => evidenceIds.has(evidenceId)));
  }
  const paths = new Set(record.fieldEvidence.map((evidence) => evidence.fieldPath));
  if (record.candidateKind === "organization_bundle") {
    if (!paths.has("organization.description")) return false;
    if (record.capabilities.some((capability) => !paths.has(`capabilities.${capability.slug}.summary`))) return false;
    if (record.programs.some((program) => !paths.has(`programs.${program.slug}.summary`))) return false;
    if (record.relationships.some((_, index) => !paths.has(`relationships.${index}.publicSummary`))) return false;
    return true;
  }
  if (record.candidateKind === "demand_signal_bundle") {
    if (!paths.has("demandSource.summary")) return false;
    return record.requirements.every((requirement) => paths.has(`requirements.${requirement.slug}.problemStatement`));
  }
  return false;
}

function containsNonPortableCitation(value: unknown) {
  return /turn\d+(?:search|view)\d+|【|†/.test(JSON.stringify(value));
}

function revalidateReviewPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/review");
  revalidatePath("/admin/publish");
}

export async function stageDemandMatchSuggestions() {
  const user = await requireAtlasStaff("reviewer");
  const supabase = await createClient({ writeCookies: true });
  const [snapshot, candidateResult] = await Promise.all([
    getAtlasSnapshot(),
    supabase
      .from("candidate_changes")
      .select("proposed_record")
      .eq("candidate_kind", "demand_match_bundle")
      .in("status", ["pending", "approved", "published"])
  ]);
  const existingPairs = new Set<string>();
  snapshot.demandRequirements.forEach((requirement) => requirement.matches.forEach(({ capability }) => existingPairs.add(`${capability.id}:${requirement.id}`)));
  (candidateResult.data ?? []).forEach((row) => {
    const parsed = parseDemandMatchCandidate(row.proposed_record);
    if (parsed.success) existingPairs.add(`${parsed.data.capabilityId}:${parsed.data.demandRequirementId}`);
  });
  const suggestions = suggestDemandMatches(snapshot.organizations, snapshot.demandRequirements, existingPairs).slice(0, 20);
  if (!suggestions.length) redirect("/admin/demand-matches?status=no-new-suggestions");

  const now = new Date().toISOString();
  const { data: run, error: runError } = await supabase
    .from("research_runs")
    .insert({
      run_type: "targeted",
      scope: { workflow: "demand_match_suggestions", maximum_candidates: 20 },
      selected_gap: { published_match_count: snapshot.demandRequirements.reduce((count, requirement) => count + requirement.matches.length, 0) },
      status: "running",
      started_at: now,
      created_by: user.id
    })
    .select("id")
    .single();
  if (runError || !run) redirect("/admin/demand-matches?error=stage-failed");

  const { error } = await supabase.from("candidate_changes").insert(suggestions.map((suggestion) => ({
    research_run_id: run.id,
    candidate_kind: "demand_match_bundle",
    target_entity_type: "capability_demand_match",
    proposed_record: suggestion,
    field_evidence: suggestion.matchedConcepts.map((concept) => ({ field: "matchedConcepts", value: concept, source: "reviewed capability and public demand text" })),
    duplicate_check: { status: "clear", checkedAt: now, key: `${suggestion.capabilityId}:${suggestion.demandRequirementId}` },
    confidence: "needs_review",
    reviewer_rationale: suggestion.reviewerRationale,
    status: "pending"
  })));
  if (error) {
    await supabase.from("research_runs").update({
      status: "failed",
      completed_at: new Date().toISOString(),
      failure_note: "Candidate staging failed before any public record changed."
    }).eq("id", run.id);
    redirect("/admin/demand-matches?error=stage-failed");
  }
  await supabase.from("research_runs").update({
    status: "completed",
    completed_at: new Date().toISOString(),
    counters: { candidate_count: suggestions.length }
  }).eq("id", run.id);
  await supabase.from("audit_events").insert({
    actor_id: user.id,
    actor_role: user.role,
    event_type: "demand_match_suggestions_staged",
    entity_type: "research_run",
    entity_id: run.id,
    summary: `Staged ${suggestions.length} private technology-to-demand suggestions for review.`,
    metadata: { candidate_count: suggestions.length, publication_changed: false }
  });
  revalidateReviewPaths();
  revalidatePath("/admin/demand-matches");
  redirect(`/admin/demand-matches?success=${suggestions.length}`);
}

const publishDemandMatchSchema = z.object({
  candidateId: z.string().uuid(),
  rationale: z.string().trim().min(20).max(2000)
});

export async function publishDemandMatchCandidate(formData: FormData) {
  const user = await requireAtlasStaff("reviewer");
  const parsed = publishDemandMatchSchema.safeParse({
    candidateId: String(formData.get("candidateId") ?? ""),
    rationale: String(formData.get("rationale") ?? "")
  });
  if (!parsed.success) redirect("/admin/review?error=invalid-demand-match");
  const supabase = await createClient({ writeCookies: true });
  const { error } = await supabase.rpc("publish_reviewed_demand_match_candidate", {
    p_candidate_id: parsed.data.candidateId,
    p_reviewer_id: user.id,
    p_reviewer_rationale: parsed.data.rationale
  });
  if (error) redirect("/admin/review?error=demand-match-publication-failed");

  revalidateTag("atlas-public");
  revalidateReviewPaths();
  revalidatePath("/");
  revalidatePath("/organizations/[slug]", "page");
  revalidatePath("/capabilities/[slug]", "page");
  revalidatePath("/demand");
  revalidatePath("/demand/[slug]", "page");
  revalidatePath("/admin/demand-matches");
  redirect("/admin/review?success=demand-match-published");
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
    .select("id, candidate_kind, schema_version, proposed_record, duplicate_check, status")
    .eq("id", parsed.data.candidateId)
    .single();
  if (!candidate || candidate.status === "published" || candidate.status === "superseded") {
    redirect("/admin/review?error=invalid-review");
  }
  if (parsed.data.decision === "accept" && (
    !isSupportedResearchCandidateKind(candidate.candidate_kind)
    || researchCandidateContractIssues([{ candidate_kind: candidate.candidate_kind, schema_version: candidate.schema_version }]).length > 0
  )) {
    redirect("/admin/review?error=unsupported-candidate");
  }
  if (parsed.data.decision === "accept" && ["organization_bundle", "demand_signal_bundle", "organization_refresh_bundle", "demand_refresh_bundle"].includes(candidate.candidate_kind)) {
    const validCandidate = candidate.candidate_kind === "organization_bundle"
      ? parseReviewableOrganizationCandidate(candidate.proposed_record)
      : candidate.candidate_kind === "demand_signal_bundle"
        ? parseDemandSignalCandidate(candidate.proposed_record).success
        : candidate.candidate_kind === "organization_refresh_bundle"
          ? parseOrganizationRefreshCandidate(candidate.proposed_record).success
          : parseDemandRefreshCandidate(candidate.proposed_record).success;
    if (!validCandidate) {
      redirect("/admin/review?error=invalid-candidate");
    }
    const duplicateCheck = candidate.duplicate_check as { status?: string } | null;
    if (!["clear", "merged"].includes(duplicateCheck?.status ?? "")) {
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
  const { error: statusError } = await supabase.from("candidate_changes").update({ status, updated_at: new Date().toISOString() }).eq("id", parsed.data.candidateId);
  if (statusError) redirect("/admin/review?error=review-failed");
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
  if (parsed.data.decision === "accept") redirect("/admin/review?success=accepted");
  redirect(`/admin/review?success=${parsed.data.decision === "reject" ? "rejected" : "deferred"}`);
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

export async function editTypedResearchCandidate(formData: FormData) {
  const user = await requireAtlasStaff("reviewer");
  const submitted = typedResearchCandidateEditSchema.safeParse({
    candidateId: String(formData.get("candidateId") ?? ""),
    rationale: String(formData.get("rationale") ?? ""),
    proposedRecordJson: String(formData.get("proposedRecordJson") ?? "")
  });
  if (!submitted.success) redirect("/admin/review?error=invalid-edit");

  let proposedValue: unknown;
  try {
    proposedValue = JSON.parse(submitted.data.proposedRecordJson);
  } catch {
    redirect("/admin/review?error=invalid-edit");
  }

  const supabase = await createClient({ writeCookies: true });
  const { data: candidate } = await supabase
    .from("candidate_changes")
    .select("id, candidate_kind, proposed_record, status")
    .eq("id", submitted.data.candidateId)
    .single();
  if (!candidate || candidate.status !== "pending" || !["organization_bundle", "demand_signal_bundle", "organization_refresh_bundle", "demand_refresh_bundle"].includes(candidate.candidate_kind)) {
    redirect("/admin/review?error=invalid-edit");
  }

  const organization = candidate.candidate_kind === "organization_bundle" ? parseOrganizationBundleV2(proposedValue) : null;
  const demand = candidate.candidate_kind === "demand_signal_bundle" ? parseDemandSignalCandidate(proposedValue) : null;
  const organizationRefresh = candidate.candidate_kind === "organization_refresh_bundle" ? parseOrganizationRefreshCandidate(proposedValue) : null;
  const demandRefresh = candidate.candidate_kind === "demand_refresh_bundle" ? parseDemandRefreshCandidate(proposedValue) : null;
  const parsedRecord = organization?.success ? organization.data : demand?.success ? demand.data : organizationRefresh?.success ? organizationRefresh.data : demandRefresh?.success ? demandRefresh.data : null;
  if (!parsedRecord || parsedRecord.candidateId !== (candidate.proposed_record as { candidateId?: string } | null)?.candidateId || !typedEvidenceIsComplete(parsedRecord) || containsNonPortableCitation(parsedRecord)) {
    redirect("/admin/review?error=invalid-edit");
  }

  const [{ data: domains }, { data: missions }] = await Promise.all([
    supabase.from("technical_domains").select("slug").eq("publication_status", "published"),
    supabase.from("mission_areas").select("slug").eq("publication_status", "published")
  ]);
  const domainSlugs = new Set((domains ?? []).map((domain) => domain.slug));
  const missionSlugs = new Set((missions ?? []).map((mission) => mission.slug));
  const taxonomyIsValid = parsedRecord.candidateKind === "organization_bundle"
    ? parsedRecord.capabilities.every((capability) =>
        capability.technicalDomainSlugs.every((slug) => domainSlugs.has(slug))
        && capability.missionMatches.every((match) => missionSlugs.has(match.missionAreaSlug)))
    : parsedRecord.candidateKind === "demand_signal_bundle" ? parsedRecord.requirements.every((requirement) =>
        requirement.technicalDomainSlugs.every((slug) => domainSlugs.has(slug))
        && requirement.missionAreaSlugs.every((slug) => missionSlugs.has(slug)))
      : parsedRecord.candidateKind === "organization_refresh_bundle" ? parsedRecord.operations.every((operation) => {
          if (operation.operation !== "add_child" || operation.entityType !== "capability") return true;
          const value = operation.value as { technicalDomainSlugs?: unknown; missionMatches?: unknown };
          const operationDomains = Array.isArray(value.technicalDomainSlugs) ? value.technicalDomainSlugs : [];
          const operationMissions = Array.isArray(value.missionMatches) ? value.missionMatches : [];
          return operationDomains.every((slug) => typeof slug === "string" && domainSlugs.has(slug))
            && operationMissions.every((match) => Boolean(match && typeof match === "object" && "missionAreaSlug" in match && typeof match.missionAreaSlug === "string" && missionSlugs.has(match.missionAreaSlug)));
        }) : true;
  if (!taxonomyIsValid) redirect("/admin/review?error=invalid-edit");

  let duplicateCheck = parsedRecord.duplicateCheck;
  if (parsedRecord.candidateKind === "organization_bundle") {
    const { data: organizations } = await supabase.from("organizations").select("id, name, slug, website_url").limit(2000);
    const candidateName = normalizedIdentity(parsedRecord.organization.name);
    const candidateWebsite = normalizedWebsite(parsedRecord.organization.websiteUrl);
    const matches = (organizations ?? []).filter((existing) =>
      existing.slug === parsedRecord.organization.slug
      || normalizedIdentity(existing.name) === candidateName
      || normalizedWebsite(existing.website_url) === candidateWebsite);
    duplicateCheck = {
      ...parsedRecord.duplicateCheck,
      status: matches.length ? "possible_match" : "clear",
      checkedAt: new Date().toISOString(),
      matches: matches.map((match) => ({ id: match.id, name: match.name, matchedBy: "edited organization identity" })),
      note: matches.length
        ? "The edited identity may match a published organization and requires merge or duplicate resolution."
        : "The edited identity was rechecked against published organizations and no likely duplicate was found."
    };
    parsedRecord.duplicateCheck = duplicateCheck;
  } else if (parsedRecord.candidateKind === "demand_signal_bundle") {
    const { data: demandSources } = await supabase.from("demand_sources").select("id, slug, title").limit(2000);
    const demandName = normalizedIdentity(parsedRecord.demandSource.title);
    const hasPublishedMatch = (demandSources ?? []).some((source) =>
      source.slug === parsedRecord.demandSource.slug || normalizedIdentity(source.title) === demandName);
    if (hasPublishedMatch) redirect("/admin/review?error=duplicate-unresolved");
    duplicateCheck = {
      ...parsedRecord.duplicateCheck,
      status: "clear",
      checkedAt: new Date().toISOString(),
      matches: [],
      note: "The edited public-demand identity was rechecked against published demand sources and no likely duplicate was found."
    };
    parsedRecord.duplicateCheck = duplicateCheck;
  } else {
    duplicateCheck = parsedRecord.duplicateCheck;
  }

  const { error: updateError } = await supabase
    .from("candidate_changes")
    .update({
      proposed_record: parsedRecord,
      field_evidence: parsedRecord.fieldEvidence,
      duplicate_check: duplicateCheck,
      reviewer_rationale: parsedRecord.reviewerRationale,
      confidence: parsedRecord.confidence,
      status: "pending",
      updated_at: new Date().toISOString()
    })
    .eq("id", candidate.id);
  if (updateError) redirect("/admin/review?error=edit-failed");

  await supabase.from("review_decisions").insert({
    candidate_change_id: candidate.id,
    reviewer_id: user.id,
    decision: "edit",
    field_decisions: [{ field: "proposed_record", decision: "edited" }],
    rationale: submitted.data.rationale
  });
  await supabase.from("audit_events").insert({
    actor_id: user.id,
    actor_role: user.role,
    event_type: "typed_candidate_edited",
    entity_type: "candidate_change",
    entity_id: candidate.id,
    summary: "Reviewer edited a typed research candidate.",
    metadata: { candidate_kind: candidate.candidate_kind, publication_changed: false }
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
  candidateIds: z.array(z.string().uuid()).min(1).max(50)
});

export async function publishApprovedCandidates(formData: FormData) {
  const user = await requireAtlasStaff("reviewer");
  const parsed = publishSchema.safeParse({
    candidateIds: formData.getAll("candidateId").map(String)
  });
  if (!parsed.success) redirect("/admin/publish?error=selection");
  const supabase = await createClient({ writeCookies: true });
  const uniqueCandidateIds = [...new Set(parsed.data.candidateIds)];
  if (uniqueCandidateIds.length !== parsed.data.candidateIds.length) redirect("/admin/publish?error=selection");
  const { data: selectedCandidates, error: selectionError } = await supabase
    .from("candidate_changes")
    .select("id, candidate_kind, schema_version, proposed_record, duplicate_check, status")
    .in("id", uniqueCandidateIds);
  if (selectionError || selectedCandidates?.length !== uniqueCandidateIds.length) redirect("/admin/publish?error=selection");

  const invalidSelection = selectedCandidates.some((candidate) => {
    if (candidate.status !== "approved") return true;
    if (researchCandidateContractIssues([{ candidate_kind: candidate.candidate_kind, schema_version: candidate.schema_version }]).length) return true;
    const duplicateStatus = (candidate.duplicate_check as { status?: string } | null)?.status;
    if (!["clear", "merged"].includes(duplicateStatus ?? "")) return true;
    if (candidate.candidate_kind === "organization_bundle") return !parseReviewableOrganizationCandidate(candidate.proposed_record);
    if (candidate.candidate_kind === "demand_signal_bundle") return !parseDemandSignalCandidate(candidate.proposed_record).success;
    if (candidate.candidate_kind === "organization_refresh_bundle") return !parseOrganizationRefreshCandidate(candidate.proposed_record).success;
    if (candidate.candidate_kind === "demand_refresh_bundle") return !parseDemandRefreshCandidate(candidate.proposed_record).success;
    return true;
  });
  if (invalidSelection) redirect("/admin/publish?error=publication-failed");

  const { error } = await supabase.rpc("publish_reviewed_research_candidates", {
    p_candidate_ids: uniqueCandidateIds,
    p_reviewer_id: user.id
  });
  if (error) redirect("/admin/publish?error=publication-failed");
  revalidateTag("atlas-public");
  revalidateReviewPaths();
  revalidatePath("/");
  revalidatePath("/organizations");
  revalidatePath("/organizations/[slug]", "page");
  revalidatePath("/demand");
  revalidatePath("/demand/[slug]", "page");
  revalidatePath("/sitemap.xml");
  redirect(`/admin/publish?success=${uniqueCandidateIds.length}`);
}
