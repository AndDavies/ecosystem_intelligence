import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFile(path.resolve(file), "utf8");

describe("editorial collection refinement", () => {
  it("keeps Signals concise while preserving the autonomous article contract", async () => {
    const [archive, browser, detail] = await Promise.all([
      read("src/app/signals/page.tsx"),
      read("src/components/atlas/signal-archive-browser.tsx"),
      read("src/app/signals/[slug]/page.tsx")
    ]);

    expect(archive).toContain("Canadian Defence Signals");
    expect(archive).toContain("Source-linked Canadian defence developments and what they may change.");
    expect(archive).toContain("slice(0, 4)");
    expect(archive).toContain("rounded-[18px]");
    expect(archive).toContain("md:min-h-[240px]");
    expect(archive).toContain("line-clamp-2");
    expect(archive).toContain("hidden flex-wrap gap-2 xl:flex");
    expect(browser).toContain("More Signals");
    expect(browser).toContain('<section className="mt-4"');
    expect(browser).toContain("edition.items[0]?.bottomLine || edition.executiveSummary");
    expect(browser).toContain("line-clamp-2");
    expect(detail).toContain("Continue in True North Map");
    expect(detail).not.toContain('href="/briefs"');
    expect(detail).toContain('placement="newsletter_inline_signals"');
    expect(detail).toContain("edition.items.map");
    expect(detail).toContain("edition.disclosure");
  });

  it("positions Defence Briefs as source-linked context with existing record continuations", async () => {
    const [archive, detail] = await Promise.all([
      read("src/app/briefs/page.tsx"),
      read("src/app/briefs/[slug]/page.tsx")
    ]);

    expect(archive).toContain("Understand what may shape what Canada builds next.");
    expect(archive).toContain("Source-linked explainers connecting policy");
    expect(archive).toContain("Signals track what changed.");
    expect(archive).toContain("All Defence Briefs");
    expect(detail).toContain("At a glance");
    expect(detail).toContain("Move from context to action");
    expect(detail).toContain("getAtlasMissionLinksForRecords");
    expect(detail).toContain("relatedRecords.map");
  });

  it("does not alter the editorial skill, data, or publication boundaries", async () => {
    const [signals, briefs] = await Promise.all([
      read("src/lib/atlas/signals.ts"),
      read("src/lib/atlas/briefs.ts")
    ]);

    expect(signals).toContain('.eq("publication_status", "published")');
    expect(briefs).toContain('.eq("publication_status", "published")');
    expect(signals).not.toContain("insert(");
    expect(briefs).not.toContain("insert(");
  });
});
