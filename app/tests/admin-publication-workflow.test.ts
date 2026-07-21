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

  it("shows candidate types and gives the reviewer direct live-record confirmation", async () => {
    const reviewPage = await readFile(path.resolve("src/app/admin/review/page.tsx"), "utf8");
    const publishPage = await readFile(path.resolve("src/app/admin/publish/page.tsx"), "utf8");

    expect(reviewPage).toContain("Organization candidates");
    expect(reviewPage).toContain("Demand-signal candidates");
    expect(publishPage).toContain("Recent publications");
    expect(publishPage).toContain("View live {row.kind === \"demand\" ? \"demand signal\" : \"organization\"}");
    expect(publishPage).toContain("no redeploy is required");
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
    const action = await readFile(path.resolve("src/lib/actions/atlas-admin.ts"), "utf8");
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
