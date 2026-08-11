import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { deriveNarrativeStatus } from "@/lib/atlas/narrative-coverage";

describe("admin publication workflow", () => {
  it("publishes an explicitly selected approved subset with one button and no typed confirmation", async () => {
    const page = await readFile(path.resolve("src/app/admin/publish/page.tsx"), "utf8");
    const action = await readFile(path.resolve("src/lib/actions/atlas-admin.ts"), "utf8");

    expect(page).toContain("Publish selected records");
    expect(page).toContain('type="checkbox" name="candidateId"');
    expect(page).toContain("defaultChecked");
    expect(page).toContain("only that selected set");
    expect(page).not.toContain('name="confirmation"');
    expect(action).not.toContain("PUBLISH ${parsed.data.candidateIds.length}");
  });

  it("guards normalized alias duplicates before and during publication", async () => {
    const schema = await readFile(path.resolve("src/lib/research/pipeline-schema.ts"), "utf8");
    const migration = await readFile(path.resolve("supabase/migrations/20260724153110_harden_candidate_alias_publication.sql"), "utf8");

    expect(schema).toContain("duplicates '${previous}' after normalization");
    expect(migration).toContain("distinct on (lower(regexp_replace(trim(alias_value)");
    expect(migration).toContain("on conflict do nothing");
  });

  it("preflights missing canonical demand-issuer parents before an atomic publication runs", async () => {
    const action = await readFile(path.resolve("src/lib/actions/atlas-admin.ts"), "utf8");
    const publishPage = await readFile(path.resolve("src/app/admin/publish/page.tsx"), "utf8");
    const dependencies = await readFile(path.resolve("src/lib/atlas/demand-issuer-dependencies.ts"), "utf8");
    const migration = await readFile(path.resolve("supabase/migrations/20260724153123_add_nrc_demand_issuer_hierarchy.sql"), "utf8");

    expect(action).toContain("findMissingDemandIssuerDependencies");
    expect(action).toContain("missing-demand-issuer");
    expect(publishPage).toContain("Unselect them to publish an unrelated ready subset now.");
    expect(publishPage).not.toContain("disabled={missingIssuerDependencies.length > 0}");
    expect(dependencies).toContain("before an atomic publication begins");
    expect(migration).toContain("national-research-council-canada");
    expect(migration).toContain("government-of-canada");
  });

  it("shows candidate types and gives the reviewer direct live-record confirmation", async () => {
    const reviewPage = await readFile(path.resolve("src/app/admin/review/page.tsx"), "utf8");
    const publishPage = await readFile(path.resolve("src/app/admin/publish/page.tsx"), "utf8");
    const adminActions = await readFile(path.resolve("src/lib/actions/atlas-admin.ts"), "utf8");

    expect(reviewPage).toContain("Organization candidates");
    expect(reviewPage).toContain("Demand-signal candidates");
    expect(reviewPage).toContain("Record refreshes");
    expect(reviewPage).toContain("Open target record");
    expect(reviewPage).toContain("Open live profile");
    expect(reviewPage).toContain("What publication will do");
    expect(reviewPage).toContain("RefreshOperationReview");
    expect(reviewPage).toContain("Current");
    expect(reviewPage).toContain("Proposed");
    expect(reviewPage).toContain("Review evidence and provenance");
    expect(reviewPage).toContain("Technical payload");
    const refreshCard = reviewPage.slice(reviewPage.indexOf("function RefreshCandidateCard"), reviewPage.indexOf("function GenericCandidateCard"));
    expect(refreshCard.match(/<ReviewerRationale/g) ?? []).toHaveLength(0);
    expect(refreshCard).toContain("defaultValue={candidate.reviewer_rationale ?? record.reviewerRationale}");
    expect(refreshCard).toContain("Suggested from the candidate&apos;s evidence-bounded research brief");
    expect(refreshCard).toContain("rewrite it to match a defer or reject decision");
    expect(refreshCard).toContain("Research decision brief");
    expect(refreshCard).toContain("Sources in packet");
    expect(refreshCard).toContain("available for review");
    expect(refreshCard).not.toContain("eight-source floor");
    expect(refreshCard).toContain("Declared source channels");
    expect(reviewPage).toContain("Validated refresh payload");
    expect(reviewPage).toContain("fully revalidated, and restaged");
    expect(refreshCard).toContain("Signal basis");
    expect(refreshCard).toContain("source.locator");
    expect(refreshCard).toContain("Open source");
    expect(refreshCard).toContain('source.publishedAt ? source.publishedAt.slice(0, 10) : "Undated"');
    expect(refreshCard).toContain("minLength={20}");
    expect(refreshCard).toContain("Reviewer decision rationale");
    expect(reviewPage).toContain("Persistent review queue");
    expect(reviewPage).toContain("pending candidates across");
    expect(reviewPage).toContain("not only the 20 records displayed on a page");
    expect(reviewPage).toContain("reviewResearchRunCandidates");
    expect(reviewPage).toContain("Accept all {batch.pendingCount}");
    expect(reviewPage).toContain("Publication remains a separate action");
    const publishApprovedAction = adminActions.slice(adminActions.indexOf("export async function publishApprovedCandidates"));
    expect(publishApprovedAction).toContain("organizationSlugs.forEach((slug) => revalidateTag(atlasOrganizationCacheTag(slug)))");
    expect(publishApprovedAction).toContain("organizationSlugs.forEach((slug) => revalidatePath(`/organizations/${slug}`))");
    expect(publishApprovedAction).not.toContain('revalidatePath("/organizations/[slug]", "page")');
    const reviewSchema = adminActions.slice(adminActions.indexOf("const reviewSchema"), adminActions.indexOf("const candidateEditSchema"));
    expect(reviewSchema).toContain("rationale: z.string().trim().min(20).max(2000)");
    const organizationActions = await readFile(path.resolve("src/lib/actions/atlas-organizations.ts"), "utf8");
    expect(organizationActions).toContain("activation-requires-reviewed-publish");
    expect(publishPage).toContain("Recent publications");
    expect(publishPage).toContain("row.kind === \"refresh\" ? \"updated record\" : \"organization\"");
    expect(publishPage).toContain("no redeploy is required");
    expect(publishPage).toContain('"organization_refresh_bundle", "demand_refresh_bundle"');
  });

  it("accepts one completed research run atomically while preserving the publication checkpoint", async () => {
    const action = await readFile(path.resolve("src/lib/actions/atlas-admin.ts"), "utf8");
    const migration = await readFile(path.resolve("supabase/migrations/20260811105452_bind_batch_review_to_exact_candidate_set.sql"), "utf8");
    const publishPage = await readFile(path.resolve("src/app/admin/publish/page.tsx"), "utf8");

    expect(action).toContain("export async function reviewResearchRunCandidates");
    expect(action).toContain('candidate.reviewer_rationale?.trim().length');
    expect(action).toContain('supabase.rpc("review_research_run_candidates"');
    expect(action).toContain("p_candidate_ids: candidates.map");
    expect(migration).toContain("for update");
    expect(migration).toContain("current_candidate_ids is distinct from requested_candidate_ids");
    expect(migration).toContain("insert into public.review_decisions");
    expect(migration).toContain("set status = 'approved'");
    expect(migration).toContain("'publication_changed', false");
    expect(migration).not.toContain("set status = 'published'");
    expect(publishPage).toContain("approved candidates across");
    expect(publishPage).toContain("Each research batch stays distinct at publication");
  });

  it("makes the accepted-to-publish handoff visible and fails closed for unknown candidate types", async () => {
    const reviewPage = await readFile(path.resolve("src/app/admin/review/page.tsx"), "utf8");
    const overviewPage = await readFile(path.resolve("src/app/admin/page.tsx"), "utf8");
    const publishPage = await readFile(path.resolve("src/app/admin/publish/page.tsx"), "utf8");
    const action = await readFile(path.resolve("src/lib/actions/atlas-admin.ts"), "utf8");
    const contractRoute = await readFile(path.resolve("src/app/api/system/research-contract/route.ts"), "utf8");

    expect(reviewPage).toContain("Continue to the Publication checkpoint");
    expect(reviewPage).toContain("This candidate type has no complete review and publication interface. It cannot be accepted.");
    const genericCard = reviewPage.slice(reviewPage.indexOf("function GenericCandidateCard"), reviewPage.indexOf("function TypedCandidateEditor"));
    expect(genericCard).not.toContain('value="accept"');
    expect(action).toContain("isSupportedResearchCandidateKind");
    expect(action).toContain("researchCandidateContractIssues");
    expect(action).toContain("selectedCandidates.some");
    expect(publishPage).toContain("candidate.candidate_kind === \"organization_refresh_bundle\"");
    expect(action).toContain("unsupported-candidate");
    expect(overviewPage).toContain("waiting at the Publication checkpoint");
    expect(contractRoute).toContain("researchReviewContract");
  });

  it("keeps local migration names aligned with the applied production history", async () => {
    await expect(readFile(path.resolve("supabase/migrations/20260723105823_signal_refresh_pipeline.sql"), "utf8")).resolves.toContain("organization_refresh_bundle_v1");
    await expect(readFile(path.resolve("supabase/migrations/20260723111826_preserve_nonorganization_candidate_targets.sql"), "utf8")).resolves.toContain("preserve_candidate_published_organization_reference");
    await expect(readFile(path.resolve("supabase/migrations/20260723104555_signal_refresh_pipeline.sql"), "utf8")).rejects.toThrow();
    await expect(readFile(path.resolve("supabase/migrations/20260723111800_preserve_nonorganization_candidate_targets.sql"), "utf8")).rejects.toThrow();
  });

  it("keeps refresh publication independent of private helper permissions", async () => {
    const migration = await readFile(path.resolve("supabase/migrations/20260729133000_remove_refresh_publication_helper_permission_dependency.sql"), "utf8");
    const hardening = await readFile(path.resolve("supabase/migrations/20260731193003_soft_beta_security_and_rls_hardening.sql"), "utf8");
    const dossierPublication = await readFile(path.resolve("supabase/migrations/20260809222938_research_organization_v3_publication.sql"), "utf8");

    expect(migration).toContain("create or replace function public.publish_reviewed_refresh_candidates");
    expect(migration).toContain("exact_baseline := case candidate_row.candidate_kind");
    expect(migration).not.toContain("private.refresh_candidate_baseline_text(");
    expect(migration).toContain("security invoker");
    expect(migration).toContain("grant execute on function public.publish_reviewed_refresh_candidates(uuid[], uuid) to authenticated");
    expect(hardening).toContain("using errcode = 'P0001'");
    expect(hardening).not.toContain("using errcode = '40001'");
    expect(dossierPublication).toContain("has a stale baseline.'");
    expect(dossierPublication).toContain("using errcode = 'P0001'");
    expect(dossierPublication).not.toContain("using errcode = '40001'");
  });

  it("grants the trusted staging worker only the private refresh baseline parser it invokes", async () => {
    const migration = await readFile(path.resolve("supabase/migrations/20260802154618_grant_refresh_staging_helper_to_service_role.sql"), "utf8");

    expect(migration).toContain("grant execute on function private.refresh_candidate_baseline_text(text, jsonb)");
    expect(migration).toContain("to service_role");
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).not.toContain("security definer");
    expect(migration).not.toContain("public.stage_research_candidates_for_review");
  });

  it("lets reviewers enrich complete typed candidates before accepting them", async () => {
    const reviewPage = await readFile(path.resolve("src/app/admin/review/page.tsx"), "utf8");
    const action = await readFile(path.resolve("src/lib/actions/atlas-admin.ts"), "utf8");

    expect(reviewPage).toContain("editTypedResearchCandidate");
    expect(reviewPage).toContain("Edit complete typed candidate");
    expect(reviewPage).toContain("Validate and save edits");
    expect(action).toContain("export async function editTypedResearchCandidate");
    expect(action).toContain("typedEvidenceIsComplete");
    expect(action).toContain("parseOrganizationBundleV2");
  });

  it("keeps public indexes bounded and revalidates only affected detail routes after publication", async () => {
    const demandPage = await readFile(path.resolve("src/app/demand/page.tsx"), "utf8");
    const organizationsPage = await readFile(path.resolve("src/app/organizations/page.tsx"), "utf8");
    const action = await readFile(path.resolve("src/lib/actions/atlas-admin.ts"), "utf8");
    const demandMatchAction = action.slice(
      action.indexOf("export async function publishDemandMatchCandidate"),
      action.indexOf("export async function reviewAtlasCandidate")
    );
    const candidatePublicationAction = action.slice(action.indexOf("export async function publishApprovedCandidates"));

    expect(demandPage).toContain('export const dynamic = "force-dynamic"');
    expect(demandPage).not.toContain("five public NATO problem families");
    expect(organizationsPage).toContain("export const revalidate = 60");
    expect(candidatePublicationAction).toContain("organizationSlugs.forEach((slug) => revalidateTag(atlasOrganizationCacheTag(slug)))");
    expect(candidatePublicationAction).toContain('candidate.candidate_kind === "demand_refresh_bundle"');
    expect(candidatePublicationAction).toContain("if (invalidatesOrganizationDossiers) revalidateTag(atlasOrganizationGlobalCacheTag)");
    expect(candidatePublicationAction).toContain("organizationSlugs.forEach((slug) => revalidatePath(`/organizations/${slug}`))");
    expect(candidatePublicationAction).toContain("demandSlugs.forEach((slug) => revalidatePath(`/demand/${slug}`))");
    expect(candidatePublicationAction).not.toContain('revalidatePath("/organizations")');
    expect(candidatePublicationAction).not.toContain('revalidatePath("/organizations/[slug]", "page")');
    expect(candidatePublicationAction).not.toContain('revalidatePath("/demand/[slug]", "page")');
    expect(demandMatchAction).toContain("atlasOrganizationCacheTag(demandMatch.data.organizationSlug)");
    expect(demandMatchAction).toContain("revalidatePath(`/organizations/${demandMatch.data.organizationSlug}`)");
    expect(demandMatchAction).not.toContain('revalidatePath("/organizations/[slug]", "page")');
  });

  it("does not prefetch live dossiers from review or recent-publication cards", async () => {
    const reviewPage = await readFile(path.resolve("src/app/admin/review/page.tsx"), "utf8");
    const publishPage = await readFile(path.resolve("src/app/admin/publish/page.tsx"), "utf8");

    expect(reviewPage).toContain("href={targetHref} prefetch={false}");
    expect(publishPage).toContain("href={display.publicHref} prefetch={false}");
  });

  it("exposes private published-organization list and edit routes", async () => {
    const listPage = await readFile(path.resolve("src/app/admin/organizations/page.tsx"), "utf8");
    const editPage = await readFile(path.resolve("src/app/admin/organizations/[id]/edit/page.tsx"), "utf8");

    expect(listPage).toContain('requireAtlasStaff("editor")');
    expect(listPage).toContain("/edit");
    expect(editPage).toContain("editPublishedOrganization");
    expect(editPage).toContain("Save published record");
  });

  it("derives the owner-only dossier enrichment queue without creating a second queue", async () => {
    const coveragePage = await readFile(path.resolve("src/app/admin/coverage/page.tsx"), "utf8");
    const adminLayout = await readFile(path.resolve("src/app/admin/layout.tsx"), "utf8");

    expect(coveragePage).toContain('requireAtlasStaff("editor")');
    expect(adminLayout).toContain("requireAdminOwner()");
    expect(coveragePage).toContain('variant="admin"');
    expect(coveragePage).toContain('.from("organizations")');
    expect(coveragePage).toContain('.from("candidate_changes")');
    expect(coveragePage).toContain('throw new Error("Unable to load live organization narrative coverage.")');
    expect(coveragePage).toContain('throw new Error("Unable to load the live dossier review queue.")');
    expect(coveragePage).toContain('in("status", ["pending", "approved"])');
    expect(coveragePage).toContain("Published v1");
    expect(coveragePage).toContain("Pending review");
    expect(coveragePage).toContain("Research required");
    expect(coveragePage).toContain("It does not create a second enrichment queue.");
    expect(coveragePage).not.toContain("snapshot.organizations.map");
    expect(coveragePage).toContain("narrativeStatusOrder[left.status]");
    expect(coveragePage).toContain('status === "pending_review"');
    expect(coveragePage).toContain('status === "research_required"');

    expect(deriveNarrativeStatus({ publishedV1: true, pendingReview: true })).toBe("published_v1");
    expect(deriveNarrativeStatus({ publishedV1: false, pendingReview: true })).toBe("pending_review");
    expect(deriveNarrativeStatus({ publishedV1: false, pendingReview: false })).toBe("research_required");
  });

  it("supports source-backed public contact editing and explains editorial taxonomy in plain language", async () => {
    const editPage = await readFile(path.resolve("src/app/admin/organizations/[id]/edit/page.tsx"), "utf8");
    const action = await readFile(path.resolve("src/lib/actions/atlas-organizations.ts"), "utf8");
    const migration = await readFile(path.resolve("supabase/migrations/20260719174251_add_public_contact_to_organization_editor.sql"), "utf8");

    expect(editPage).toContain("editPublishedOrganizationContact");
    expect(editPage).toContain("Save public contact");
    expect(editPage).toContain("Main technology area");
    expect(editPage).toContain("Regional ecosystem group");
    expect(editPage).toContain("What belongs here?");
    expect(editPage).not.toContain("Primary technical domain");
    expect(action).toContain('supabase.rpc("update_published_organization_public_contact"');
    expect(migration).toContain("private.is_atlas_staff()");
    expect(migration).toContain("revoke all on function public.update_published_organization_public_contact");
    expect(migration).toContain("grant execute on function public.update_published_organization_public_contact");
  });

  it("keeps dossier maintenance modular, cited, rationale-gated, and available with partial taxonomy coverage", async () => {
    const editPage = await readFile(path.resolve("src/app/admin/organizations/[id]/edit/page.tsx"), "utf8");
    const action = await readFile(path.resolve("src/lib/actions/atlas-organizations.ts"), "utf8");
    const reviewAction = await readFile(path.resolve("src/lib/actions/atlas-admin.ts"), "utf8");
    const migration = await readFile(path.resolve("supabase/migrations/20260809222847_organization_dossier_v3.sql"), "utf8");

    expect(editPage).toContain("EditorialProfileEditor");
    expect(editPage).toContain("DossierRecordMaintenance");
    expect(editPage).toContain("Capability and location maintenance is unavailable");
    expect(editPage).toContain("Route new claims, new questions, and new evidence through Research, Admin Review, and Publish.");
    expect(editPage).toContain("First activation is available only through a reviewed research candidate and the separate Publish checkpoint.");
    expect(editPage).toContain("activation-requires-reviewed-publish");
    expect(editPage).toContain('name="editorialRationale" required');
    expect(editPage).toContain('name="childRationale" required');
    expect(action).toContain('supabase.rpc("update_published_organization_editorial_profile"');
    expect(action).toContain('parsed.data.editorialProfileVersion === "organization_editorial_profile_v1"');
    expect(action).toContain("activation-requires-reviewed-publish");
    expect(reviewAction).toContain('schemaVersion === "organization_refresh_bundle_v2"');
    expect(reviewAction).toContain('redirect("/admin/review?error=restage-required")');
    expect(action).toContain('supabase.rpc("update_published_organization_dossier_child"');
    expect(action).toContain('requireAtlasStaff("editor")');
    expect(migration).toContain("private.has_public_field_citation");
    expect(migration).toContain("'published_organization_editorial_profile_edited'");
    expect(migration).toContain("'published_organization_dossier_child_edited'");
    expect(migration).toContain("revoke all on function public.update_published_organization_editorial_profile");
    expect(migration).toContain("revoke all on function public.update_published_organization_dossier_child");
  });
});
