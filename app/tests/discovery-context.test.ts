// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { discoveryEvidenceSignature, discoveryProfileHref, projectDiscovery, recallDiscovery, rememberDiscovery } from "@/lib/atlas/discovery-context";
import { projectAtlasExplorerOrganization } from "@/lib/atlas/explorer-projection";
import { queryAtlasExplorerSnapshot } from "@/lib/atlas/repository";
import { atlasQueryFromSearchParams, atlasQueryToSearchParams } from "@/lib/atlas/query-params";
import { publicNavigationHref } from "@/lib/seo/navigation-urls";
import { publicCitationSourceLocator } from "@/lib/atlas/public-profile-data";
import { rowEvidence } from "@/components/atlas/atlas-explorer-results";
import { atlasTestSnapshot } from "./fixtures/atlas-snapshot";
import type { AtlasDiscoveryResult } from "@/types/atlas";

const organization = structuredClone(atlasTestSnapshot.organizations.find(item => item.capabilities.length)!);
organization.id = "10000000-0000-4000-8000-000000000001";
organization.capabilities = [0, 1].map(index => ({ ...structuredClone(organization.capabilities[0]),
  id: `20000000-0000-4000-8000-00000000000${index + 1}`, organizationId: organization.id,
  slug: index ? "link-modem" : "towed-sensor", name: index ? "Link modem" : "Towed sensor",
  citations: [{ id: `evidence-${index}`, fieldName: "summary", sourceTitle: `Source ${index}`, sourceUrl: `https://example.test/source-${index}`, publisher: "Synthetic supplier", sourceType: "official", excerpt: "Tested configuration only; no deployment is established.", publishedAt: null }]
}));
const result = queryAtlasExplorerSnapshot({ ...atlasTestSnapshot, organizations: [organization] }, {});
const discovery: AtlasDiscoveryResult = { query: "I need a vehicle data link", interpretation: "matched", filters: {}, filterChips: [],
  organizationIds: [organization.id], capabilityIds: [organization.capabilities[1].id], evidenceLinks: [], summary: null, suggestions: [], organizations: [organization],
  assistant: { interpretedNeed: "Vehicle data link", summary: "A supported candidate to inspect.", outcome: "closest_supported", matches: [{ organizationId: organization.id, capabilityId: organization.capabilities[1].id, fitLevel: "plausible", evidenceLevel: "moderate", supportPoints: [{ text: "The modem carries vehicle data in the demonstrated configuration.", citationIds: ["evidence-1"] }], limitations: ["Power and protocol compatibility remain unverified."] }], gaps: [], followUpSuggestions: [] }
};

afterEach(() => { sessionStorage.clear(); vi.restoreAllMocks(); });
describe("capability-specific discovery context", () => {
  it("retains the non-first offering, exact support and qualified reason through projection and hydration", () => {
    const preview = projectDiscovery(discovery, result).organizations[0];
    expect(preview.capabilities.map(cap => cap.name)).toEqual(["Link modem"]);
    expect(preview.discoveryAssessment?.limitations).toEqual(discovery.assistant!.matches[0].limitations);
    expect(rowEvidence(preview, preview.capabilities[0]).map(source => source.id)).toEqual(["evidence-1"]);
    expect(projectAtlasExplorerOrganization(organization, {}, new Set(preview.capabilities.map(cap => cap.id))).capabilities[0].name).toBe("Link modem");
    expect(discoveryProfileHref(organization, preview.capabilities[0], true)).toBe("/capabilities/link-modem#evidence");
  });
  it("does not substitute a first offering for an organization-level, missing or wrong-owner selection", () => {
    for (const capabilityId of [null, "missing-capability", "other-owner-capability"]) {
      const changed = structuredClone(discovery); changed.assistant!.matches[0].capabilityId = capabilityId;
      expect(projectDiscovery(changed, result).organizations[0].capabilities).toEqual([]);
    }
  });
  it("roundtrips public cohort and exact selection without interpreting the natural-language question as keyword filters", () => {
    const query = { query: discovery.query, organizationIds: [organization.id], capabilityIds: [organization.capabilities[1].id], selected: organization.id, selectedCapability: organization.capabilities[1].id, view: "table" as const };
    const restored = atlasQueryFromSearchParams(atlasQueryToSearchParams(query));
    const current = queryAtlasExplorerSnapshot({ ...atlasTestSnapshot, organizations: [organization] }, restored);
    expect(current.organizations).toHaveLength(1);
    expect(current.organizations[0].capabilities[0].name).toBe("Link modem");
    const href = discoveryProfileHref(organization, organization.capabilities[1], true, `/map#?${atlasQueryToSearchParams(query)}`);
    expect(new URLSearchParams(new URL(href, "https://example.test").search).get("returnTo")).toContain("selectedCapability=");
    expect(publicNavigationHref(href)).toBe("/capabilities/link-modem#evidence");
  });
  it("recovers separate repeated questions only for a bounded tab-local lifetime", () => {
    const first = rememberDiscovery(discovery)!;
    const second = rememberDiscovery({ ...discovery, query: "A second question" })!;
    expect(first).not.toBe(second);
    expect(recallDiscovery({ query: discovery.query, discovery: first })?.query).toBe(discovery.query);
    expect(recallDiscovery({ query: discovery.query, discovery: second })).toBeNull();
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 31 * 60 * 1000);
    expect(recallDiscovery({ query: discovery.query, discovery: first })).toBeNull();
    expect(recallDiscovery({ query: discovery.query, discovery: "shared-in-another-browser" })).toBeNull();
  });
  it("invalidates evidence changes while tolerating citation ordering", () => {
    const changed = structuredClone(organization);
    changed.capabilities.reverse();
    expect(discoveryEvidenceSignature(changed)).toBe(discoveryEvidenceSignature(organization));
    changed.capabilities[0].citations[0].excerpt = "Withdrawn claim";
    expect(discoveryEvidenceSignature(changed)).not.toBe(discoveryEvidenceSignature(organization));
  });
  it("invalidates confidence, availability, geography and reviewed relationship changes", () => {
    const original = discoveryEvidenceSignature(organization);
    for (const change of [
      (record: typeof organization) => { record.sourceConfidence = "needs_review"; },
      (record: typeof organization) => { record.capabilities[0].commercialAvailability = "Withdrawn from sale"; },
      (record: typeof organization) => { record.primaryLocation = null; },
      (record: typeof organization) => { record.capabilities[0].missionMatches = []; record.capabilities[0].demandMatches = []; record.capabilities[0].coreFeatures = ["Changed configuration"]; }
    ]) { const changed = structuredClone(organization); change(changed); expect(discoveryEvidenceSignature(changed)).not.toBe(original); }
  });
  it("hides internal requirement locators while preserving real source references", () => {
    expect(publicCitationSourceLocator("requirements.persistent-surveillance.problemStatement")).toBeNull();
    expect(publicCitationSourceLocator("operations.0.after.summary")).toBeNull();
    expect(publicCitationSourceLocator("Section 4, page 12")).toBe("Section 4, page 12");
  });
});

it("invalidates pre-guard historical assessments with orphan schema text without changing their public cohort", () => {
  for (const limitations of [["citationIds"], ["A proposed adaptation is not demonstrated. citationIds"]]) {
    const old = structuredClone(discovery); old.assistant!.matches[0].limitations = limitations;
    const id = rememberDiscovery(old)!;
    expect(recallDiscovery({ query: old.query, discovery: id })).toBeNull();
    expect(old.organizationIds).toEqual(discovery.organizationIds);
  }
  const legitimate = structuredClone(discovery); legitimate.assistant!.matches[0].limitations = ["The API does not expose citationIds."];
  const id = rememberDiscovery(legitimate)!;
  expect(recallDiscovery({ query: legitimate.query, discovery: id })?.assistant?.matches[0].limitations).toEqual(legitimate.assistant!.matches[0].limitations);
});
