import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Canadian Defence Briefs", () => {
  it("keeps public synthesis source-backed and answer-first", async () => {
    const detail = await readFile(path.resolve("src/app/briefs/[slug]/page.tsx"), "utf8");
    expect(detail).toContain("The bottom line");
    expect(detail).toContain("Key takeaways");
    expect(detail).toContain("What this may mean");
    expect(detail).toContain("Derived Read");
    expect(detail).toContain("Public sources");
    expect(detail).toContain('"@type": "Article"');
    expect(detail).toContain('"@type": "BreadcrumbList"');
  });

  it("provides an intentional editorial image slot without requiring an image record", async () => {
    const index = await readFile(path.resolve("src/app/briefs/page.tsx"), "utf8");
    const detail = await readFile(path.resolve("src/app/briefs/[slug]/page.tsx"), "utf8");
    const hero = await readFile(path.resolve("src/components/atlas/brief-hero.tsx"), "utf8");
    expect(index).toContain("<BriefHero");
    expect(detail).toContain("<BriefHero");
    expect(hero).toContain("True North Map Brief");
    expect(hero).toContain("presentation.imageSrc");
  });

  it("publishes dedicated brief imagery through social and article metadata", async () => {
    const index = await readFile(path.resolve("src/app/briefs/page.tsx"), "utf8");
    const detail = await readFile(path.resolve("src/app/briefs/[slug]/page.tsx"), "utf8");
    expect(index).toContain("defence-briefs-home.jpg");
    expect(index).toContain('card: "summary_large_image"');
    expect(index).toContain('primaryImageOfPage');
    expect(index).toContain('"@type": "Article"');
    expect(index).toContain("hasPart: briefs.map");
    expect(detail).toContain("presentation.imageSrc");
    expect(detail).toContain("absoluteUrl(presentation.imageSrc)");
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

  it("lets the sole administrator save and publish without typing a rationale", async () => {
    const page = await readFile(path.resolve("src/app/admin/briefs/page.tsx"), "utf8");
    const editor = await readFile(path.resolve("src/components/atlas/defence-brief-editor.tsx"), "utf8");
    const action = await readFile(path.resolve("src/lib/actions/briefs-admin.ts"), "utf8");
    expect(page).not.toContain("record the rationale");
    expect(editor).not.toContain('name="rationale"');
    expect(editor).toContain("Publish brief");
    expect(action).toContain("p_rationale: null");
  });
});
