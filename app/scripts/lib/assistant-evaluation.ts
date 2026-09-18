import type { AtlasEntityKind, AtlasOrganization, AtlasSnapshot } from "../../src/types/atlas";
import catalogue from "../../tests/fixtures/assistant-eval/catalogue.json";
import questions from "../../tests/fixtures/assistant-eval/questions.json";

export { catalogue, questions };
export function savedAssistantSnapshot(): AtlasSnapshot {
  const organizations: AtlasOrganization[] = catalogue.organizations.map((o) => ({
    id: o.id, slug: o.slug, name: o.name, legalName: o.legalName, description: o.description,
    websiteUrl: null, entityKind: o.entityKind as AtlasEntityKind, categories: o.categories,
    sourceConfidence: "needs_review", freshnessStatus: "review_due", lastReviewedAt: o.lastReviewedAt,
    primaryLocation: null, locations: [], foundedYear: null, employeeRange: null, companyStage: null,
    ownership: null, commercialStatus: null, disclosedFinancingSummary: null, defencePosture: null, dualUsePosture: null,
    profileData: {}, editorialProfile: { version: null, currentActivity: null, currentActivityAsOf: null, operatingContext: null, canadianFootprint: null, reviewedQuestions: [] },
    logo: null, mediaAssets: [], programs: [], fundingEvents: [], relationships: [], citations: [],
    capabilities: o.capabilities.map((c) => ({
      id: c.id, organizationId: o.id, slug: c.slug, name: c.name, summary: c.summary,
      capabilityType: c.capability_type, coreFeatures: c.core_features ?? [], technologyReadinessLevel: null,
      maturity: c.maturity, commercialAvailability: c.commercial_availability, defenceApplications: c.defence_applications ?? [],
      novelty: c.novelty ?? [], technicalTags: c.technical_tags ?? [], technicalDomains: [], missionMatches: [], demandMatches: [],
      sourceConfidence: "needs_review", lastReviewedAt: c.last_reviewed_at, citations: []
    }))
  }));
  return { organizations, demandRequirements: [], technicalDomains: [], missionAreas: [], clusters: [], regions: [], generatedAt: `${catalogue.frozenOn}T00:00:00Z`, dataSource: "supabase" };
}

export function relevanceMetrics(ids: string[], grades: Record<string, number>, poolIds = ids) {
  const relevant = Object.keys(grades).filter((id) => grades[id] > 0);
  const recall = (candidates: string[]) => relevant.length ? relevant.filter((id) => candidates.includes(id)).length / relevant.length : null;
  const gain = (values: number[]) => values.slice(0, 5).reduce((sum, grade, index) => sum + (2 ** grade - 1) / Math.log2(index + 2), 0);
  const ideal = gain(Object.values(grades).sort((a, b) => b - a));
  return { poolRecall: recall(poolIds), recall16: recall(ids.slice(0, 16)), ndcg5: ideal ? gain(ids.map((id) => grades[id] ?? 0)) / ideal : null };
}
