import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("customer-facing product language", () => {
  it("leads the ecosystem map with the decision a user can make", async () => {
    const explorer = await readFile(path.resolve("src/components/atlas/atlas-explorer.tsx"), "utf8");
    const header = await readFile(path.resolve("src/components/atlas/public-atlas-header.tsx"), "utf8");
    expect(explorer).toContain('<span className="atlas-headline-highlight">Canada is building</span> more than most people can see.');
    expect(explorer).not.toContain("\u2014");
    expect(explorer).toContain("Discover the companies, technologies, and public needs shaping Canada’s defence and dual-use ecosystem.");
    expect(explorer).toContain("Follow the evidence, find the fit, and start the right conversation.");
    expect(explorer).toContain("Explore the map");
    expect(explorer).toContain("Ask True North");
    expect(explorer).toContain("Do not enter classified, confidential, proprietary, or personal information.");
    expect(explorer).toContain("Technology or offering");
    expect(header).toContain('label: "Ecosystem Map"');
    expect(explorer).not.toContain("Search atlas");
  });

  it("uses the True North Map shield and signal-colour maple leaf as the favicon", async () => {
    const icon = await readFile(path.resolve("src/app/icon.svg"), "utf8");
    expect(icon).toContain("shield with maple leaf");
    expect(icon).toContain('fill="#242827"');
    expect(icon).toContain('fill="#f5e900"');
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
