import { readFile } from "node:fs/promises";
import path from "node:path";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { MissionOrganizationCard } from "@/components/atlas/mission-organization-card";
import {
  OrganizationIdentityMark,
  organizationLogoSource,
  organizationMonogram
} from "@/components/atlas/organization-identity";
import {
  mergeExplorerLogoUrls,
  projectAtlasExplorerOrganization
} from "@/lib/atlas/explorer-projection";
import { buildAtlasLensOptions, publicOrganizationTypes } from "@/lib/atlas/lens-options";
import { queryAtlasExplorerSnapshot } from "@/lib/atlas/repository";
import type { AtlasMissionOrganizationConnection, AtlasOrganizationLogo } from "@/types/atlas";
import { atlasTestSnapshot } from "./fixtures/atlas-snapshot";

const read = (file: string) => readFile(path.resolve(file), "utf8");

const fixtureLogo: AtlasOrganizationLogo = {
  id: "logo-1",
  publicUrl: "https://cdn.example.test/logos/dartmouth-systems.png",
  storagePath: "organization-logos/dartmouth-systems.png",
  sourceUrl: null,
  attributionText: null
};

describe("shared organization result identity", () => {
  it("derives a deterministic, stable two-letter monogram", () => {
    expect(organizationMonogram("Kraken Robotics")).toBe("KR");
    expect(organizationMonogram("True North Map")).toBe("TN");
    expect(organizationMonogram("MDA")).toBe("MD");
    expect(organizationMonogram("C-CORE")).toBe("CC");
    expect(organizationMonogram("  Dartmouth   Systems  ")).toBe("DS");
    expect(organizationMonogram("Dartmouth Systems")).toBe(organizationMonogram("Dartmouth Systems"));
    expect(organizationMonogram("")).toBe("");
  });

  it("resolves the logo from either the compact projection or the full record", () => {
    expect(organizationLogoSource({ logoUrl: "https://cdn.example.test/a.png" })).toBe("https://cdn.example.test/a.png");
    expect(organizationLogoSource({ logo: fixtureLogo })).toBe(fixtureLogo.publicUrl);
    expect(organizationLogoSource({ logoUrl: null, logo: null })).toBeNull();
  });

  it("renders the monogram as a decorative fixed-size mark when no logo is published", () => {
    vi.stubGlobal("React", React);
    const markup = renderToStaticMarkup(
      React.createElement(OrganizationIdentityMark, { name: "Dartmouth Systems", logoUrl: null, size: "sm" })
    );
    expect(markup).toContain(">DS<");
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain("size-10");
  });

  it("keeps the compact explorer projection additive with a bounded logo merge", () => {
    const organization = atlasTestSnapshot.organizations.find((item) => item.slug === "dartmouth-systems")!;
    expect(projectAtlasExplorerOrganization(organization).logoUrl).toBeNull();
    expect(projectAtlasExplorerOrganization({ ...organization, logo: fixtureLogo }).logoUrl).toBe(fixtureLogo.publicUrl);

    const result = queryAtlasExplorerSnapshot(atlasTestSnapshot, { page: 1, pageSize: 10 });
    const merged = mergeExplorerLogoUrls(result, { [organization.id]: fixtureLogo });
    expect(merged.organizations.find((item) => item.id === organization.id)?.logoUrl).toBe(fixtureLogo.publicUrl);
    expect(merged.organizations.filter((item) => item.id !== organization.id).every((item) => !item.logoUrl)).toBe(true);
    expect(mergeExplorerLogoUrls(result, {})).toBe(result);
  });

  it("loads page-bounded logos on the map page and atlas API without a new contract", async () => {
    const [mapPage, atlasRoute, repository] = await Promise.all([
      read("src/app/map/page.tsx"),
      read("src/app/api/atlas/route.ts"),
      read("src/lib/atlas/repository.ts")
    ]);
    expect(mapPage).toContain("attachAtlasExplorerLogos(");
    expect(atlasRoute).toContain("attachAtlasExplorerLogos(await queryAtlasExplorer(query))");
    expect(repository).toContain("getAtlasOrganizationLogos(missingLogoIds)");
  });

  it("applies the identity mark across rail, sheet, table, previews and cards", async () => {
    const [results, directoryCard, missionCard] = await Promise.all([
      read("src/components/atlas/atlas-explorer-results.tsx"),
      read("src/components/atlas/organization-card.tsx"),
      read("src/components/atlas/mission-organization-card.tsx")
    ]);
    expect(results.match(/<OrganizationIdentityMark/g)?.length ?? 0).toBeGreaterThanOrEqual(5);
    expect(directoryCard).toContain("<OrganizationIdentityMark");
    expect(missionCard).toContain("<OrganizationIdentityMark");
  });

  it("marks the selected result with Signal Wash plus a non-color rule and keeps focus visible", async () => {
    const results = await read("src/components/atlas/atlas-explorer-results.tsx");
    expect(results.match(/border-l-\[var\(--atlas-signal\)\] bg-\[var\(--atlas-signal-soft\)\]/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(results).not.toContain('"bg-[var(--atlas-signal)] text-');
    expect(results.match(/focus-visible:ring-2 focus-visible:ring-inset/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
  });

  it("offers Add to shortlist from the expanded accessible results", async () => {
    const results = await read("src/components/atlas/atlas-explorer-results.tsx");
    expect(results.match(/Add to shortlist/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(results.match(/addType=organization&addId=/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
  });
});

describe("guided lens band", () => {
  it("builds live organization counts for all four lenses from the snapshot", () => {
    const options = buildAtlasLensOptions(atlasTestSnapshot);

    expect(options.missionAreas).toEqual([{ slug: "underwater-isr", name: "Underwater ISR", count: 1 }]);
    expect(options.technicalDomains).toEqual([{ slug: "sensing-and-isr", name: "Sensing and ISR", count: 1 }]);
    expect(options.demandRequirements).toEqual([]);
    expect(options.organizationTypes.every((type) => publicOrganizationTypes.has(type.value))).toBe(true);
    expect(options.organizationTypes.find((type) => type.value === "company")?.count).toBe(2);
    expect(options.organizationTypes.reduce((total, type) => total + type.count!, 0)).toBe(atlasTestSnapshot.organizations.length);
  });

  it("ships accessible triggers, popover listbox and focus-managed mobile sheet", async () => {
    const band = await read("src/components/atlas/atlas-lens-band.tsx");
    expect(band).toContain('aria-haspopup={isSheet ? "dialog" : "listbox"}');
    expect(band).toContain("aria-expanded={open}");
    expect(band).toContain('role="dialog"');
    expect(band).toContain('aria-modal="true"');
    expect(band.match(/role="listbox"/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(band).toContain('role="option"');
    expect(band).toContain("aria-selected={selected}");
    expect(band).toContain('event.key === "Escape"');
    expect(band).toContain("triggerRefs.current.get(current)?.focus()");
    expect(band).toContain('window.matchMedia("(max-width: 639px)")');
    expect(band).toContain('if (event.key === "Tab")');
    expect(band).toContain("min-h-11");
  });

  it("routes lens selections through the existing filter, load and URL machinery", async () => {
    const [explorer, mapPage] = await Promise.all([
      read("src/components/atlas/atlas-explorer.tsx"),
      read("src/app/map/page.tsx")
    ]);
    expect(explorer).toContain("<AtlasLensBand");
    expect(explorer).toContain('trackBetaEvent("filter_apply", { filter: key, value: value || "all" })');
    expect(explorer).toContain('label: "Mission area"');
    expect(explorer).toContain('label: "Defence need"');
    expect(explorer).toContain('label: "Technology area"');
    expect(explorer).toContain('label: "Organization type"');
    expect(mapPage).toContain("buildAtlasLensOptions(snapshot)");
    expect(mapPage).toContain("organizationTypes={lensOptions.organizationTypes}");
  });

  it("keeps the guided example and turns suggested questions into quiet example links", async () => {
    const explorer = await read("src/components/atlas/atlas-explorer.tsx");
    expect(explorer).toContain('href="/map?example=modular-naval"');
    expect(explorer).toContain("Try an example:");
    expect(explorer).toContain("void runDiscovery(suggestion)");
    expect(explorer).not.toContain("Try a suggested question");
    expect(explorer).not.toContain("GuidedStartingSelect");
  });

  it("relocates secondary utilities below the map workspace on mobile only", async () => {
    const [explorer, band] = await Promise.all([
      read("src/components/atlas/atlas-explorer.tsx"),
      read("src/components/atlas/atlas-lens-band.tsx")
    ]);
    // Legend, Export and Share leave the pre-map control stack below sm and reappear in the labelled utility area.
    expect(explorer).toContain('<EvidenceLegendDisclosure className="hidden sm:block" />');
    expect(explorer).toContain('className="hidden shrink-0 items-center gap-3 sm:flex"');
    expect(explorer).toContain('data-mobile-map-utilities');
    expect(explorer).toContain('aria-label="Map utilities"');
    const utilityArea = explorer.slice(explorer.indexOf("data-mobile-map-utilities"));
    expect(utilityArea).toContain("<EvidenceLegendDisclosure");
    expect(utilityArea).toContain(">Export</Link>");
    expect(utilityArea).toContain("<PublicShare");
    expect(utilityArea).toContain("{caveat}");
    // Lens trigger labels stay at 12px minimum on every breakpoint.
    expect(band).toContain('className="relative min-w-0 text-xs font-bold"');
    expect(band).not.toContain("text-[11px] font-bold");
  });
});

describe("relevance presentation", () => {
  const connection: AtlasMissionOrganizationConnection = {
    organization: {
      id: "org-identity-1",
      slug: "sample-organization",
      name: "Sample Organization",
      description: "A published organization description.",
      entityKind: "company",
      sourceConfidence: "high",
      freshnessStatus: "current",
      lastReviewedAt: "2026-08-20",
      primaryLocation: null
    },
    capabilities: [{
      id: "cap-identity-1",
      slug: "sample-capability",
      name: "Sample Capability",
      summary: "A published capability summary.",
      sourceConfidence: "high",
      technicalDomains: [],
      assessment: {
        id: "match-identity-1",
        alignmentSummary: "A reviewed alignment summary.",
        matchType: "public_source_alignment",
        confidence: "high"
      }
    }],
    strongestConfidence: "high"
  };

  it("labels evidence strength as public evidence instead of assessment strength", () => {
    vi.stubGlobal("React", React);
    const markup = renderToStaticMarkup(React.createElement(MissionOrganizationCard, { connection }));
    expect(markup).toContain("Strong public evidence");
    expect(markup).not.toContain("Strong assessment");
    expect(markup).toContain(">SO<");
  });

  it("states the shared record context once per collection rather than per card", async () => {
    const [missionCard, missionPage, demandPage] = await Promise.all([
      read("src/components/atlas/mission-organization-card.tsx"),
      read("src/app/missions/[slug]/page.tsx"),
      read("src/app/demand/[slug]/page.tsx")
    ]);
    expect(missionCard).not.toContain("Technology reviewed for this mission");
    expect(missionPage).toContain("Every record below shows the technology reviewed for this mission");
    expect(demandPage).toContain("Each connection pairs the organization-specific reason it may be relevant");
    expect(demandPage).not.toContain("Why this may be relevant");
  });

  it("reuses the shared tonal evidence treatment on result surfaces", async () => {
    const results = await read("src/components/atlas/atlas-explorer-results.tsx");
    expect(results).toContain('import { evidenceStrengthChipClass } from "@/components/atlas/alignment-match-card"');
    expect(results.match(/evidenceStrengthChipClass\[confidence\]/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
    expect(results).not.toContain("bg-[var(--atlas-danger-soft)] text-[var(--atlas-danger)]");
  });

  it("keeps the landing mid-page rhythm tonal without new client JavaScript", async () => {
    const landing = await read("src/app/page.tsx");
    expect(landing).toContain("Know something missing?");
    expect(landing).not.toContain('"use client"');
    expect(landing).not.toContain("maplibre");
  });
});
