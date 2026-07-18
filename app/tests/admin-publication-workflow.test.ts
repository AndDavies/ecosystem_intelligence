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

  it("exposes private published-organization list and edit routes", async () => {
    const listPage = await readFile(path.resolve("src/app/admin/organizations/page.tsx"), "utf8");
    const editPage = await readFile(path.resolve("src/app/admin/organizations/[id]/edit/page.tsx"), "utf8");

    expect(listPage).toContain('requireAtlasStaff("editor")');
    expect(listPage).toContain("/edit");
    expect(editPage).toContain("editPublishedOrganization");
    expect(editPage).toContain("Save published record");
  });
});
