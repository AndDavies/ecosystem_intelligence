import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("customer-facing product language", () => {
  it("leads the ecosystem map with the decision a user can make", async () => {
    const explorer = await readFile(path.resolve("src/components/atlas/atlas-explorer.tsx"), "utf8");
    const header = await readFile(path.resolve("src/components/atlas/public-atlas-header.tsx"), "utf8");
    expect(explorer).toContain("See who is building what—and who may be worth speaking with next.");
    expect(explorer).toContain("Find Canadian organizations, technology, and public demand in one place.");
    expect(explorer).toContain("Search the map");
    expect(explorer).toContain("Technology or offering");
    expect(header).toContain('label: "Ecosystem Map"');
    expect(explorer).not.toContain("Search atlas");
  });

  it("uses one clear profile and assessment vocabulary", async () => {
    const organization = await readFile(path.resolve("src/app/organizations/[slug]/page.tsx"), "utf8");
    const technology = await readFile(path.resolve("src/app/capabilities/[slug]/page.tsx"), "utf8");
    const demand = await readFile(path.resolve("src/app/demand/[slug]/page.tsx"), "utf8");
    const combined = `${organization}\n${technology}\n${demand}`;
    expect(combined).toContain("Where It Fits");
    expect(combined).toContain("Evidence & sources");
    expect(combined).not.toContain("Mission relevance");
    expect(combined).not.toContain("Demand relevance");
    expect(combined).not.toContain("Capability dossier");
    expect(combined).not.toContain("Evidence strength");
    expect(combined).not.toContain("reviewed analyst assessments");
    expect(combined).not.toContain("No reviewed mission or public-demand match");
    expect(organization).toContain("Coverage still growing");
    expect(organization).toContain("Suggest a source");
  });

  it("carries the same language into downloadable profiles", async () => {
    const pdf = await readFile(path.resolve("src/lib/export/atlas-pdf.tsx"), "utf8");
    expect(pdf).toContain("Technology Profile");
    expect(pdf).toContain("Where It Fits");
    expect(pdf).toContain("Source support");
    expect(pdf).not.toContain("Mission relevance");
    expect(pdf).not.toContain("Capability Profile");
    expect(pdf).not.toContain("Reviewed assessments");
  });
});
