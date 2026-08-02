import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("customer-facing product language", () => {
  it("leads the ecosystem map with the decision a user can make", async () => {
    const [explorer, landing] = await Promise.all([
      readFile(path.resolve("src/components/atlas/atlas-explorer.tsx"), "utf8"),
      readFile(path.resolve("src/app/page.tsx"), "utf8")
    ]);
    const header = await readFile(path.resolve("src/components/atlas/public-atlas-header.tsx"), "utf8");
    expect(landing).toContain('Evidence-led ecosystem discovery');
    expect(landing).toContain('Canada is building more than most people can see.');
    expect(`${landing}\n${explorer}`).not.toContain("\u2014");
    expect(landing).toContain("Find Canadian organizations and capabilities relevant to a mission, project or released public need.");
    expect(landing).toContain("Describe a need");
    expect(landing).toContain("Explore the map");
    expect(landing).toContain("See how it works");
    expect(explorer).toContain("Search by need, mission, technology or place.");
    expect(explorer).toContain("Do not enter classified, confidential, proprietary or personal information.");
    expect(explorer).toContain("Technology or offering");
    expect(header).toContain('label: "Map"');
    expect(header).toContain('href: "/demand", label: "Public Needs"');
    expect(header).toContain('href: "/missions", label: "Missions"');
    expect(header).not.toContain('{ href: "/regions", label: "Regions" }');
    expect(explorer).not.toContain("Search atlas");
  });

  it("uses the directional N mark as the favicon and shared identity", async () => {
    const [icon, logo, appTile, brandComponent] = await Promise.all([
      readFile(path.resolve("src/app/icon.svg"), "utf8"),
      readFile(path.resolve("public/brand/north-signal-mark.svg"), "utf8"),
      readFile(path.resolve("public/brand/true-north-map-app-tile.svg"), "utf8"),
      readFile(path.resolve("src/components/atlas/brand-logo.tsx"), "utf8")
    ]);
    expect(icon).toContain("True North Map directional N mark");
    expect(icon).toContain('fill="#242827"');
    expect(icon).toContain('fill="#F5E900"');
    expect(icon).not.toContain("<circle");
    expect(logo).toContain("True North Map directional N mark");
    expect(appTile).toContain("True North Map app tile");
    expect(brandComponent).toContain("True North Map");
    expect(brandComponent).not.toContain('<span className="block">True North</span>');
  });

  it("publishes the Phase 1B decision steps, trust strip and dynamic metric labels", async () => {
    const [landing, dynamicLanding, legend] = await Promise.all([
      readFile(path.resolve("src/app/page.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/guided-landing-dynamic.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/evidence-legend.tsx"), "utf8")
    ]);
    expect(landing).toContain("Find organizations for a need");
    expect(landing).toContain("Follow a public need");
    expect(landing).toContain("Understand a mission landscape");
    expect(landing).toContain("Build a Working List");
    expect(landing).toContain("Reviewed public evidence. Transparent gaps. Human review.");
    expect(dynamicLanding).toContain('label="Published organizations"');
    expect(dynamicLanding).toContain('label="Reviewed technologies"');
    expect(dynamicLanding).toContain('label="Cited public sources"');
    expect(legend).toContain("publicLanguage.sourceFact");
    expect(legend).toContain("publicLanguage.assessment");
    expect(legend).toContain("publicLanguage.coverageGap");
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
    expect(organization).toContain("/missions/${match.missionArea.slug}");
    expect(technology).toContain("/missions/${match.missionArea.slug}");
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
