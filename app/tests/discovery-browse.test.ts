import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  getCompaniesIndex,
  getDomainBySlug,
  getDomainsIndex,
  getHomeData,
  getShortlistById,
  getShortlistsIndex,
  getUseCaseBriefingBySlug,
  getUseCaseBySlug,
  getUseCasesIndex,
  searchRecords
} from "@/lib/data/repository";

describe("balanced discovery browse loaders", () => {
  it("returns domain cards with counts and freshness", async () => {
    const domains = await getDomainsIndex();

    expect(domains[0]?.capabilityCount).toBeGreaterThanOrEqual(domains[1]?.capabilityCount ?? 0);
    expect(domains.find((item) => item.domain.slug === "isr-sensing")?.useCaseCount).toBeGreaterThan(0);
    expect(domains.find((item) => item.domain.slug === "isr-sensing")?.companyCount).toBeGreaterThan(0);
  });

  it("returns domain detail with linked use cases, companies, capabilities, and clusters", async () => {
    const view = await getDomainBySlug("isr-sensing");

    expect(view?.useCases.some((item) => item.slug === "arctic-domain-awareness")).toBe(true);
    expect(view?.companies.some((item) => item.company.id === "company-1")).toBe(true);
    expect(view?.capabilities.some((item) => item.capability.id === "capability-1")).toBe(true);
    expect(view?.clusters.some((item) => item.cluster.slug === "acoustic-sensing-systems")).toBe(true);
  });

  it("returns company cards with domain coverage and linked use case counts", async () => {
    const companies = await getCompaniesIndex();
    const polarMesh = companies.find((item) => item.company.id === "company-2");

    expect(polarMesh?.domains.map((domain) => domain.slug)).toContain("cyber-data");
    expect(polarMesh?.useCaseCount).toBe(2);
    expect(companies[0]?.strongestMappingScore).toBeGreaterThanOrEqual(companies[1]?.strongestMappingScore ?? 0);
  });

  it("returns home data with use cases, domains, and companies", async () => {
    const home = await getHomeData();

    expect(home.useCases.length).toBeGreaterThan(0);
    expect(home.domains.length).toBeGreaterThan(0);
    expect(home.companies.length).toBeGreaterThan(0);
    expect(home.useCases[0]?.missionOutcome).toBeTruthy();
  });

  it("returns use-case realism metadata and citations", async () => {
    const useCases = await getUseCasesIndex();
    const arctic = useCases.find((item) => item.slug === "arctic-domain-awareness");
    const view = await getUseCaseBySlug("arctic-domain-awareness");

    expect(arctic?.priorityTier).toBe("p1");
    expect(arctic?.partnerFrames).toContain("CAF/DND");
    expect(arctic?.missionOutcome).toMatch(/detect/i);
    expect(view?.citations.some((item) => item.sourceTitle === "Our North, Strong and Free")).toBe(true);
  });

  it("searches use-case realism context", async () => {
    const results = await searchRecords("NORAD");
    const arctic = results.useCases.find((item) => item.slug === "arctic-domain-awareness");

    expect(arctic?.partnerFrames).toContain("NORAD");
    expect(arctic?.priorityTier).toBe("p1");
  });

  it("returns a BD briefing view with targets, evidence posture, and coverage gaps", async () => {
    const briefing = await getUseCaseBriefingBySlug("arctic-domain-awareness");

    expect(briefing?.targets.length).toBeGreaterThan(0);
    expect(briefing?.targets[0]?.targetRead.priorityNow).toBeTruthy();
    expect(briefing?.targets[0]?.evidencePosture.label).toBeTruthy();
    expect(briefing?.coverageGaps.length).toBeGreaterThan(0);
    expect(briefing?.coverageGaps[0]?.category).toMatch(/maturity|cluster|geography|evidence|freshness/);
  });

  it("returns empty shortlist views in mock mode", async () => {
    const shortlists = await getShortlistsIndex();

    expect(shortlists).toEqual([]);
    expect(await getShortlistById("missing-shortlist")).toBeNull();
  });
});
