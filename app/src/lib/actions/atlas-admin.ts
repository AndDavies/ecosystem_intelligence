"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAtlasStaff } from "@/lib/atlas/auth";
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

export async function reviewAtlasCandidate(formData: FormData) {
  const user = await requireAtlasStaff("reviewer");
  const parsed = reviewSchema.safeParse({
    candidateId: String(formData.get("candidateId") ?? ""),
    decision: String(formData.get("decision") ?? ""),
    rationale: String(formData.get("rationale") ?? "")
  });
  if (!parsed.success) redirect("/admin/review?error=invalid-review");
  const supabase = await createClient({ writeCookies: true });
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
  revalidatePath("/admin");
  revalidatePath("/admin/review");
}
