import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { demandMatchCandidateSchema, suggestDemandMatches } from "@/lib/atlas/demand-matching";
import type { AtlasDemandRequirement, AtlasOrganization } from "@/types/atlas";

const organization = {
  id: "10000000-0000-4000-8000-000000000001",
  slug: "north-sensor",
  name: "North Sensor",
  capabilities: [{
    id: "20000000-0000-4000-8000-000000000001",
    organizationId: "10000000-0000-4000-8000-000000000001",
    slug: "autonomous-undersea-sensing",
    name: "Autonomous Undersea Sensing",
    summary: "An autonomous underwater system for persistent maritime surveillance and detection.",
    capabilityType: "Autonomous sensor platform",
    coreFeatures: ["Underwater autonomy", "Persistent sensing"],
    defenceApplications: ["Maritime situational awareness"],
    novelty: [],
    technicalTags: ["undersea", "autonomous", "sensor"],
    technicalDomains: [{ id: "30000000-0000-4000-8000-000000000001", slug: "maritime", name: "Maritime systems", summary: "Undersea autonomy and sensing" }],
    demandMatches: []
  }]
} as unknown as AtlasOrganization;

const demand = {
  id: "40000000-0000-4000-8000-000000000001",
  slug: "persistent-undersea-awareness",
  title: "Persistent undersea awareness",
  problemStatement: "Operators need autonomous underwater surveillance and detection across maritime approaches.",
  desiredEndState: "Persistent sensing from autonomous undersea systems."
} as unknown as AtlasDemandRequirement;

describe("review-first demand matching", () => {
  it("stages a strong overlap as a private needs-review candidate", () => {
    const [candidate] = suggestDemandMatches([organization], [demand]);
    expect(demandMatchCandidateSchema.safeParse(candidate).success).toBe(true);
    expect(candidate.confidence).toBe("needs_review");
    expect(candidate.matchType).toBe("derived");
    expect(candidate.matchedConcepts).toEqual(expect.arrayContaining(["maritime and undersea operations", "detection and situational awareness", "autonomous and uncrewed systems"]));
    expect(candidate.reviewerRationale).toContain("not evidence of eligibility");
  });

  it("does not suggest weak or already-covered pairs", () => {
    const unrelated = { ...demand, id: "40000000-0000-4000-8000-000000000002", title: "Office procurement", problemStatement: "Teams need better furniture purchasing.", desiredEndState: "Faster office fit-outs." };
    expect(suggestDemandMatches([organization], [unrelated])).toHaveLength(0);
    expect(suggestDemandMatches([organization], [demand], new Set([`${organization.capabilities[0].id}:${demand.id}`]))).toHaveLength(0);
  });

  it("requires the technology to share the demand title's mission anchors", () => {
    const droneDemand = {
      ...demand,
      id: "40000000-0000-4000-8000-000000000003",
      slug: "drone-laser-ranging",
      title: "Low-cost drone laser ranging for indirect fire",
      problemStatement: "Small uncrewed aircraft need better target detection and situational awareness.",
      desiredEndState: "Improve targeting, protection, and operational resilience."
    };
    expect(suggestDemandMatches([organization], [droneDemand])).toHaveLength(0);
  });

  it("can surface a specific single-anchor lane such as logistics", () => {
    const logisticsOrganization = {
      ...organization,
      capabilities: [{
        ...organization.capabilities[0],
        id: "20000000-0000-4000-8000-000000000004",
        name: "Fleet sustainment",
        summary: "Maintenance, repair, overhaul, and predictive support for military fleet readiness.",
        coreFeatures: ["Depot maintenance"],
        defenceApplications: ["Fleet sustainment"],
        technicalTags: ["mro", "sustainment"],
        technicalDomains: []
      }]
    } as unknown as AtlasOrganization;
    const logisticsDemand = {
      ...demand,
      id: "40000000-0000-4000-8000-000000000004",
      slug: "logistics-and-sustainment",
      title: "Efficient logistics and sustainment",
      problemStatement: "Military operations need resilient logistics networks and reliable resupply.",
      desiredEndState: "Improve delivery, mobility, and readiness."
    };
    expect(suggestDemandMatches([logisticsOrganization], [logisticsDemand])).toHaveLength(1);
  });

  it("keeps generation private and publication behind an explicit reviewer RPC", async () => {
    const action = await readFile(path.resolve("src/lib/actions/atlas-admin.ts"), "utf8");
    const review = await readFile(path.resolve("src/app/admin/review/page.tsx"), "utf8");
    const migration = await readFile(path.resolve("supabase/migrations/20260719174445_reviewable_demand_match_workflow.sql"), "utf8");
    const candidateKindMigration = await readFile(path.resolve("supabase/migrations/20260719183500_allow_demand_match_candidates.sql"), "utf8");
    expect(action).toContain('candidate_kind: "demand_match_bundle"');
    expect(action).toContain('status: "pending"');
    expect(review).toContain("Publish match");
    expect(migration).toContain("private.is_atlas_staff()");
    expect(migration).toContain("and status = 'pending'");
    expect(migration).toContain("'approved',");
    expect(migration).toContain("'published',");
    expect(migration).toContain("grant execute on function public.publish_reviewed_demand_match_candidate");
    expect(candidateKindMigration).toContain("'demand_match_bundle'::text");
    expect(candidateKindMigration).toContain("'demand_match_bundle_v1'::text");
    expect(action).toContain('status: "running"');
    expect(action).toContain('status: "failed"');
  });
});
