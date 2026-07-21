import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Canadian Defence Briefs", () => {
  it("keeps public synthesis source-backed and answer-first", async () => {
    const detail = await readFile(path.resolve("src/app/briefs/[slug]/page.tsx"), "utf8");
    expect(detail).toContain("The short answer");
    expect(detail).toContain("What this may mean");
    expect(detail).toContain("This is a Derived Read");
    expect(detail).toContain("Public sources");
    expect(detail).toContain('"@type": "Article"');
    expect(detail).toContain('"@type": "BreadcrumbList"');
  });

  it("keeps private packets outside the public repository layer", async () => {
    const repository = await readFile(path.resolve("src/lib/atlas/briefs.ts"), "utf8");
    expect(repository).toContain('.from("wiki_pages")');
    expect(repository).toContain('.eq("publication_status", "published")');
    expect(repository).not.toContain("DefenceSourcePacketV1");
    expect(repository).not.toContain("True North Map Defence Wiki");
  });

  it("keeps publication behind the exact administrator boundary", async () => {
    const page = await readFile(path.resolve("src/app/admin/briefs/page.tsx"), "utf8");
    const action = await readFile(path.resolve("src/lib/actions/briefs-admin.ts"), "utf8");
    const migration = await readFile(path.resolve("supabase/migrations/20260721114356_add_canadian_defence_briefs.sql"), "utf8");
    expect(page).toContain('requireAtlasStaff("admin")');
    expect(action).toContain('requireAtlasStaff("admin")');
    expect(migration).toContain("private.is_atlas_staff()");
    expect(migration).toContain("publication_status = 'published'");
    expect(migration).toContain("reviewed_by is not null");
  });
});
