import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  getCompaniesIndex,
  getDomainBySlug,
  getDomainsIndex,
  getHomeData
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
  });
});
