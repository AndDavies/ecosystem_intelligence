import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { brandCopy } from "@/lib/brand-copy";

describe("customer-facing product language", () => {
  it("leads the ecosystem map with the decision a user can make", async () => {
    const [explorer, landing] = await Promise.all([
      readFile(path.resolve("src/components/atlas/atlas-explorer.tsx"), "utf8"),
      readFile(path.resolve("src/app/page.tsx"), "utf8")
    ]);
    const header = await readFile(path.resolve("src/components/atlas/public-atlas-header.tsx"), "utf8");
    expect(landing).toContain("brandCopy.category");
    expect(brandCopy.category).toBe("Canadian defence and dual-use directory");
    expect(brandCopy.slogan).toBe("Canada is building more than most people can see.");
    expect(landing).not.toContain("\u2014");
    expect(landing).toContain("brandCopy.introduction");
    expect(landing).toContain("Search the directory");
    expect(landing).toContain("Explore the map");
    expect(landing).toContain("How it works");
    expect(explorer).toContain("Find a company, technology or area.");
    expect(explorer).toContain("Search by name or subject, then narrow the results.");
    expect(explorer).toContain("Ask True North helps you explore who may help—and why.");
    expect(explorer).not.toContain("Need interpretation rather than a name?");
    expect(explorer).not.toContain("Uses AI to interpret your question against reviewed public records and explain possible fits.");
    expect(explorer).not.toContain("Reviewed public records only.");
    expect(explorer).toContain("Do not enter classified, confidential, proprietary or personal information.");
    expect(explorer).toContain("Technology or offering");
    expect(header).toContain('label: "Map"');
    expect(header).toContain('href: "/demand", label: "Defence needs"');
    expect(header).toContain('href: "/missions", label: "Mission areas"');
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
    expect(landing).toContain("Find companies and technologies");
    expect(landing).toContain("Follow a published defence need");
    expect(landing).toContain("Explore a mission area");
    expect(landing).toContain("brandCopy.introduction");
    expect(landing).toContain("brandCopy.access");
    expect(brandCopy.trust).toBe("Public sources cited. Facts and assessments kept separate. Human review.");
    expect(dynamicLanding).toContain('data.summary.organizations');
    expect(dynamicLanding).toContain('data.summary.capabilities');
    expect(dynamicLanding).toContain('publicLanguage.evidenceStrength');
    expect(legend).toContain("publicLanguage.sourceFact");
    expect(legend).toContain("publicLanguage.assessment");
    expect(legend).toContain("publicLanguage.coverageGap");
  });

  it("uses one clear profile and assessment vocabulary", async () => {
    const organization = await readFile(path.resolve("src/app/organizations/[slug]/page.tsx"), "utf8");
    const organizationDossier = await readFile(path.resolve("src/components/atlas/executive-organization-dossier.tsx"), "utf8");
    const technology = await readFile(path.resolve("src/app/capabilities/[slug]/page.tsx"), "utf8");
    const demand = await readFile(path.resolve("src/app/demand/[slug]/page.tsx"), "utf8");
    const combined = `${organization}\n${organizationDossier}\n${technology}\n${demand}`;
    expect(combined).toContain("What supports this assessment");
    expect(combined).toContain("What supports this profile");
    expect(demand).toContain("What supports this defence need");
    expect(combined).not.toContain("Mission relevance");
    expect(combined).not.toContain("Demand relevance");
    expect(combined).not.toContain("Capability dossier");
    expect(combined).toContain("Evidence strength");
    expect(combined).not.toContain("reviewed analyst assessments");
    expect(combined).not.toContain("No reviewed mission or public-demand match");
    expect(organization).toContain("ExecutiveOrganizationDossier");
    expect(organizationDossier).toContain("Sources behind this profile");
    expect(organizationDossier).toContain("brandCopy.trustCompact");
    expect(organizationDossier).toContain("They do not indicate procurement direction, eligibility, endorsement or customer interest.");
    expect(organizationDossier).toContain("/missions/${match.missionArea.slug}");
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
    expect(pdf).toContain("Reviewed assessments");
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
    expect(page).toContain("Find a team or technology");
    expect(page).toContain("Decide whether it is worth a closer look");
    expect(page).toContain("Open the Kraken Robotics profile");
    expect(page).toContain("Open my shortlists");
    expect(page).toContain("Save it and start a conversation");
    expect(page).toContain("Sources establish the record. People review the assessment.");
    expect(page).toContain("<ol");
    expect(header).not.toContain('href: "/how-it-works"');
    expect(sitemap).toContain('"/how-it-works"');
  });
});
