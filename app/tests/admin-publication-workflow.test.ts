import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("admin publication workflow", () => {
  it("publishes the approved checkpoint with one button and no typed confirmation", async () => {
    const page = await readFile(path.resolve("src/app/admin/publish/page.tsx"), "utf8");
    const action = await readFile(path.resolve("src/lib/actions/atlas-admin.ts"), "utf8");

    expect(page).toContain("Publish {rows.length} approved");
    expect(page).not.toContain('type="checkbox" name="candidateId"');
    expect(page).not.toContain('name="confirmation"');
    expect(action).not.toContain("PUBLISH ${parsed.data.candidateIds.length}");
  });

  it("guards normalized alias duplicates before and during publication", async () => {
    const schema = await readFile(path.resolve("src/lib/research/pipeline-schema.ts"), "utf8");
    const migration = await readFile(path.resolve("supabase/migrations/20260724112156_harden_candidate_alias_publication.sql"), "utf8");

    expect(schema).toContain("duplicates '${previous}' after normalization");
    expect(migration).toContain("distinct on (lower(regexp_replace(trim(alias_value)");
    expect(migration).toContain("on conflict do nothing");
  });

  it("shows candidate types and gives the reviewer direct live-record confirmation", async () => {
    const reviewPage = await readFile(path.resolve("src/app/admin/review/page.tsx"), "utf8");
    const publishPage = await readFile(path.resolve("src/app/admin/publish/page.tsx"), "utf8");

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
    expect(publishPage).toContain("Recent publications");
    expect(publishPage).toContain("row.kind === \"refresh\" ? \"updated record\" : \"organization\"");
    expect(publishPage).toContain("no redeploy is required");
    expect(publishPage).toContain('"organization_refresh_bundle", "demand_refresh_bundle"');
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

  it("keeps data-driven public indexes dynamic and revalidates detail routes after publication", async () => {
    const demandPage = await readFile(path.resolve("src/app/demand/page.tsx"), "utf8");
    const organizationsPage = await readFile(path.resolve("src/app/organizations/page.tsx"), "utf8");
    const action = await readFile(path.resolve("src/lib/actions/atlas-admin.ts"), "utf8");

    expect(demandPage).toContain('export const dynamic = "force-dynamic"');
    expect(demandPage).not.toContain("five public NATO problem families");
    expect(organizationsPage).toContain('export const dynamic = "force-dynamic"');
    expect(action).toContain('revalidatePath("/organizations/[slug]", "page")');
    expect(action).toContain('revalidatePath("/demand/[slug]", "page")');
  });

  it("exposes private published-organization list and edit routes", async () => {
    const listPage = await readFile(path.resolve("src/app/admin/organizations/page.tsx"), "utf8");
    const editPage = await readFile(path.resolve("src/app/admin/organizations/[id]/edit/page.tsx"), "utf8");

    expect(listPage).toContain('requireAtlasStaff("editor")');
    expect(listPage).toContain("/edit");
    expect(editPage).toContain("editPublishedOrganization");
    expect(editPage).toContain("Save published record");
  });

  it("supports source-backed public contact editing and explains editorial taxonomy in plain language", async () => {
    const editPage = await readFile(path.resolve("src/app/admin/organizations/[id]/edit/page.tsx"), "utf8");
    const action = await readFile(path.resolve("src/lib/actions/atlas-organizations.ts"), "utf8");
    const migration = await readFile(path.resolve("supabase/migrations/20260719173304_add_public_contact_to_organization_editor.sql"), "utf8");

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
});
