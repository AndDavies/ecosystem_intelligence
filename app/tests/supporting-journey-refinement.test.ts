import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFile(path.resolve(file), "utf8");

describe("landing, trust, and supporting journeys", () => {
  it("uses the approved About story and founder wording", async () => {
    const about = await read("src/app/about/page.tsx");

    expect(about).toContain('title="The capability was here. The shared picture was not."');
    expect(about).toContain("Created by Andrew Davies, a veteran and former Combat Systems Engineering Officer.");
    expect(about).toContain("independent project created to make Canada’s defence and dual-use capability easier to find");
  });

  it("moves the plain-language journey from a question to a practical handoff", async () => {
    const howItWorks = await read("src/app/how-it-works/page.tsx");

    for (const step of ["Start with a question", "Find relevant capability", "Inspect the public record", "Compare and save", "Start the conversation"]) {
      expect(howItWorks).toContain(step);
    }
    expect(howItWorks).toContain('href: "/map?start=need#ask-true-north"');
    expect(howItWorks).toContain('href: "/collections"');
    expect(howItWorks).toContain("AI helps people explore, but it does not publish facts or make procurement decisions.");
    expect(howItWorks).toContain("overflow-hidden rounded-[18px] bg-white");
    expect(howItWorks).toContain('index === 0 ? "bg-[var(--atlas-blue-soft)] py-5"');
    expect(howItWorks).not.toContain("ArrowDown");
    expect(howItWorks).not.toContain("min-h-60");
    expect(howItWorks).not.toContain("atlas-signal-button");
  });

  it("keeps Methodology detailed and gives supporting journeys one useful next step", async () => {
    const [methodology, contribution, landing] = await Promise.all([
      read("src/app/methodology/page.tsx"),
      read("src/app/submit/page.tsx"),
      read("src/app/page.tsx")
    ]);

    expect(methodology).toContain("What a profile must earn before publication");
    expect(methodology).toContain("Open a published profile and follow its sources.");
    expect(contribution).toContain("Know something missing? Improve the public record.");
    expect(contribution).toContain("Every change is reviewed before publication.");
    expect(landing).toContain("LandingProductPreview");
    expect(landing).toContain("PublicAtlasHeader");
    expect(landing).toContain("export const revalidate = 300");
    expect(landing).not.toContain("searchParams");
  });
});
