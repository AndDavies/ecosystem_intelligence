import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  atlasAssistantQuota,
  buildAssistantCatalog,
  classifyAssistantFailure,
  finalizeAssistantAnswer,
  selectAssistantOrganizations,
  type RawAssistantAnswer
} from "@/lib/atlas/assistant";
import type { AtlasCitation, AtlasSnapshot } from "@/types/atlas";
import { atlasTestSnapshot } from "./fixtures/atlas-snapshot";

const organizationCitation: AtlasCitation = {
  id: "citation-organization",
  fieldName: "description",
  sourceTitle: "Organization profile",
  sourceUrl: "https://example.test/organization",
  publisher: "Example Organization",
  sourceType: "company_website",
  excerpt: "The organization develops systems for maritime users.",
  publishedAt: "2026-07-19"
};

const capabilityCitation: AtlasCitation = {
  id: "citation-capability",
  fieldName: "summary",
  sourceTitle: "Underwater sensing product",
  sourceUrl: "https://example.test/capability",
  publisher: "Example Organization",
  sourceType: "product_page",
  excerpt: "The system provides underwater sensing for awareness missions.",
  publishedAt: "2026-07-19"
};

function citedSnapshot(): AtlasSnapshot {
  const snapshot = structuredClone(atlasTestSnapshot);
  const organization = snapshot.organizations[0];
  organization.citations = [organizationCitation];
  organization.capabilities[0].citations = [capabilityCitation];
  return snapshot;
}

function answer(overrides: Partial<RawAssistantAnswer> = {}): RawAssistantAnswer {
  const snapshot = citedSnapshot();
  const organization = snapshot.organizations[0];
  const capability = organization.capabilities[0];
  return {
    outcome: "exact_match",
    interpretedNeed: "Find underwater sensing support",
    summary: "One published organization has a directly relevant technology.",
    matches: [{
      organizationId: organization.id,
      capabilityId: capability.id,
      fitLevel: "strong",
      supportPoints: [
        { text: "The organization works with maritime users.", citationIds: [organizationCitation.id] },
        { text: "The selected technology supports underwater awareness.", citationIds: [capabilityCitation.id] }
      ],
      limitations: [],
      hasMaterialGap: false
    }],
    gaps: [],
    followUpSuggestions: ["Limit this to Atlantic Canada"],
    ...overrides
  };
}

describe("Ask True North output guardrails", () => {
  it("defaults to GPT-5.6 Luna while preserving the server-only model override", async () => {
    vi.stubEnv("OPENAI_MODEL", "");
    vi.resetModules();
    const { ATLAS_ASSISTANT_MODEL } = await import("@/lib/atlas/assistant");
    expect(ATLAS_ASSISTANT_MODEL).toBe("gpt-5.6-luna");
    vi.unstubAllEnvs();
  });

  it("keeps a strong fit only when it has strong evidence, two support points, and no material gap", () => {
    const finalized = finalizeAssistantAnswer(citedSnapshot(), answer());
    expect(finalized.outcome).toBe("exact_match");
    expect(finalized.matches[0]).toMatchObject({ fitLevel: "strong", evidenceLevel: "strong" });
    expect(finalized.matches[0].supportPoints).toHaveLength(2);
  });

  it("downgrades model confidence instead of upgrading it", () => {
    const raw = answer();
    raw.matches[0].supportPoints = raw.matches[0].supportPoints.slice(0, 1);
    raw.matches[0].hasMaterialGap = true;
    const finalized = finalizeAssistantAnswer(citedSnapshot(), raw);
    expect(finalized.outcome).toBe("closest_supported");
    expect(finalized.matches[0].fitLevel).toBe("plausible");
    expect(finalized.summary).toContain("closest supported fits");
  });

  it("drops unknown organizations, cross-organization capabilities, and unsupported citations", () => {
    const snapshot = citedSnapshot();
    const raw = answer();
    raw.matches = [
      { ...raw.matches[0], organizationId: "invented-organization" },
      { ...raw.matches[0], capabilityId: "capability-from-another-record" },
      { ...raw.matches[0], supportPoints: [{ text: "Unsupported claim", citationIds: ["invented-citation"] }] }
    ];
    const finalized = finalizeAssistantAnswer(snapshot, raw);
    expect(finalized.outcome).toBe("coverage_gap");
    expect(finalized.matches).toEqual([]);
  });

  it("builds the model catalogue from the published snapshot contract without a second index", () => {
    const snapshot = citedSnapshot();
    const catalog = buildAssistantCatalog(snapshot);
    expect(catalog.organizations).toHaveLength(snapshot.organizations.length);
    expect(catalog.organizations[0].capabilities[0]).toMatchObject({
      id: snapshot.organizations[0].capabilities[0].id,
      citations: [{ id: capabilityCitation.id }]
    });
    expect(JSON.stringify(catalog)).not.toContain('"rationale"');
  });

  it("preselects the most relevant published organizations without creating a second index", () => {
    const selected = selectAssistantOrganizations(
      atlasTestSnapshot,
      "Who can help with underwater sensing for naval awareness?",
      [],
      5
    );
    expect(selected).toHaveLength(5);
    expect(selected[0].name).toBe("Dartmouth Systems");
    expect(new Set(selected.map((organization) => organization.id)).size).toBe(selected.length);
  });

  it("keeps prior-turn organizations available for geographic follow-up questions", () => {
    const selected = selectAssistantOrganizations(
      atlasTestSnapshot,
      "Which of those are in Ontario?",
      [{ query: "Find systems integrators", organizationIds: ["canadian-investor"] }],
      5
    );
    expect(selected.map((organization) => organization.id)).toContain("canadian-investor");
  });

  it("classifies operational failures without exposing raw error messages", () => {
    expect(classifyAssistantFailure({ status: 401, code: "invalid_api_key", message: "secret detail" })).toMatchObject({
      fallbackReason: "unavailable",
      failureClass: "authentication",
      errorCode: "invalid_api_key"
    });
    expect(classifyAssistantFailure({ status: 429, code: "insufficient_quota" })).toMatchObject({
      failureClass: "insufficient_quota"
    });
    expect(classifyAssistantFailure(new DOMException("Timed out", "TimeoutError"))).toMatchObject({
      fallbackReason: "timeout",
      failureClass: "timeout"
    });
    expect(classifyAssistantFailure({ name: "APIUserAbortError", message: "Request was aborted." })).toMatchObject({
      fallbackReason: "timeout",
      failureClass: "timeout"
    });
  });

  it("enforces sparse anonymous use and a higher signed-in allowance", () => {
    expect(atlasAssistantQuota(false, 2)).toEqual({ signedIn: false, limit: 3, used: 2, remaining: 1 });
    expect(atlasAssistantQuota(false, 99)).toEqual({ signedIn: false, limit: 3, used: 3, remaining: 0 });
    expect(atlasAssistantQuota(true, 4)).toEqual({ signedIn: true, limit: 20, used: 4, remaining: 16 });
  });
});
