import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("customer-facing product language", () => {
  it("leads the ecosystem map with the decision a user can make", async () => {
    const [explorer, hero] = await Promise.all([
      readFile(path.resolve("src/components/atlas/atlas-explorer.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/atlas-home-hero.tsx"), "utf8")
    ]);
    const header = await readFile(path.resolve("src/components/atlas/public-atlas-header.tsx"), "utf8");
    expect(hero).toContain('Evidence-led ecosystem discovery');
    expect(hero).toContain('<span className="atlas-headline-highlight">Canada is building</span> more than most people can see.');
    expect(`${hero}\n${explorer}`).not.toContain("\u2014");
    expect(hero).toContain("Explore the organizations, capabilities and public needs shaping Canada’s defence and dual-use ecosystem.");
    expect(hero).toContain("Follow the evidence. Find the fit. Start the right conversation.");
    expect(hero).toContain("Explore the ecosystem");
    expect(hero).toContain("Browse public needs");
    expect(explorer).toContain("Ask True North");
    expect(explorer).toContain("Do not enter classified, confidential, proprietary, or personal information.");
    expect(explorer).toContain("Technology or offering");
    expect(header).toContain('label: "Map"');
    expect(header).toContain('href: "/demand", label: "Public Needs"');
    expect(header).not.toContain('{ href: "/regions", label: "Regions" }');
    expect(explorer).not.toContain("Search atlas");
  });

  it("uses the North Signal mark as the favicon", async () => {
    const icon = await readFile(path.resolve("src/app/icon.svg"), "utf8");
    expect(icon).toContain("True North Map North Signal mark");
    expect(icon).toContain('fill="#242827"');
    expect(icon).toContain('fill="#F5E900"');
  });

  it("publishes the Phase 1B decision steps, trust strip and dynamic metric labels", async () => {
    const [explorer, legend] = await Promise.all([
      readFile(path.resolve("src/components/atlas/atlas-explorer.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/evidence-legend.tsx"), "utf8")
    ]);
    expect(explorer).toContain("Find Canadian capability");
    expect(explorer).toContain("Explore public needs");
    expect(explorer).toContain("Inspect the record");
    expect(explorer).toContain("Build a Working List");
    expect(explorer).toContain("Reviewed public evidence · Transparent gaps · Human review");
    expect(explorer).toContain('label="published organization profiles"');
    expect(explorer).toContain('label="reviewed technologies"');
    expect(explorer).toContain('label="cited public sources"');
    expect(legend).toContain("Public-source fact");
    expect(legend).toContain("Our assessment");
    expect(legend).toContain("Not yet verified");
  });

  it("uses one clear profile and assessment vocabulary", async () => {
    const organization = await readFile(path.resolve("src/app/organizations/[slug]/page.tsx"), "utf8");
    const technology = await readFile(path.resolve("src/app/capabilities/[slug]/page.tsx"), "utf8");
    const demand = await readFile(path.resolve("src/app/demand/[slug]/page.tsx"), "utf8");
    const combined = `${organization}\n${technology}\n${demand}`;
    expect(combined).toContain("technologyDemand");
    expect(combined).toContain("What supports this assessment");
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
    const exportRoute = await readFile(path.resolve("src/app/api/export/route.ts"), "utf8");
    expect(pdf).toContain("Technology Profile");
    expect(pdf).toContain("Where this technology may help");
    expect(pdf).toContain("Public evidence");
    expect(pdf).not.toContain("Mission relevance");
    expect(pdf).not.toContain("Capability Profile");
    expect(pdf).not.toContain("Reviewed assessments");
    expect(exportRoute).toContain("true-north-map-results.csv");
    expect(exportRoute).toContain("Published technology not found.");
    expect(exportRoute).not.toContain("canadian-ecosystem-atlas-results.csv");
  });

  it("explains the public journey without exposing implementation language", async () => {
    const [page, header, sitemap] = await Promise.all([
      readFile(path.resolve("src/app/how-it-works/page.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/public-atlas-header.tsx"), "utf8"),
      readFile(path.resolve("src/app/sitemap.ts"), "utf8")
    ]);
    expect(page).toContain("Explore the map");
    expect(page).toContain("Check the public evidence");
    expect(page).toContain("Follow released public needs");
    expect(page).toContain("See where technology may help");
    expect(page).toContain("Sources create the public record. People review the interpretation.");
    expect(page).toContain("<ol");
    expect(header).toContain('href: "/how-it-works"');
    expect(sitemap).toContain('"/how-it-works"');
  });
});
