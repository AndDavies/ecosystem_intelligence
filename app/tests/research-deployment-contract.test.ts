import { describe, expect, it, vi } from "vitest";
import {
  assertDeployedResearchReviewContract,
  researchCandidateContractIssues,
  researchReviewContract
} from "../src/lib/research/deployment-contract";

const organizationRefresh = {
  candidate_kind: "organization_refresh_bundle",
  schema_version: "organization_refresh_bundle_v1"
};

describe("deployed research review contract", () => {
  it("accepts every candidate kind with a complete review and publication path", () => {
    const candidates = Object.entries(researchReviewContract.candidateSchemas).flatMap(([candidate_kind, versions]) =>
      versions.map((schema_version) => ({ candidate_kind, schema_version }))
    );
    expect(researchCandidateContractIssues(candidates)).toEqual([]);
  });

  it("fails closed for unknown candidate kinds and schema versions", () => {
    expect(researchCandidateContractIssues([
      { candidate_kind: "program_relationship_bundle", schema_version: "program_relationship_bundle_v1" },
      { candidate_kind: "organization_refresh_bundle", schema_version: "organization_refresh_bundle_v2" }
    ])).toEqual([
      "candidate 1 uses unsupported kind 'program_relationship_bundle'",
      "candidate 2 uses unsupported schema 'organization_refresh_bundle_v2' for 'organization_refresh_bundle'"
    ]);
  });

  it("permits staging only when the deployed application advertises the required contract", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(researchReviewContract), { status: 200 }));
    await expect(assertDeployedResearchReviewContract([organizationRefresh], { baseUrl: "https://example.test", fetchImpl })).resolves.toEqual(researchReviewContract);
    expect(fetchImpl).toHaveBeenCalledWith("https://example.test/api/system/research-contract", expect.objectContaining({ cache: "no-store" }));
  });

  it("stops before database staging when the deployed application is old or unavailable", async () => {
    const oldContract = {
      ...researchReviewContract,
      candidateSchemas: {
        ...researchReviewContract.candidateSchemas,
        organization_refresh_bundle: []
      }
    };
    const oldFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(oldContract), { status: 200 }));
    await expect(assertDeployedResearchReviewContract([organizationRefresh], { baseUrl: "https://example.test", fetchImpl: oldFetch })).rejects.toThrow(/stopped before database staging.*unsupported schema/i);

    const unavailableFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response("Not found", { status: 404 }));
    await expect(assertDeployedResearchReviewContract([organizationRefresh], { baseUrl: "https://example.test", fetchImpl: unavailableFetch })).rejects.toThrow(/stopped before database staging.*HTTP 404/i);
  });
});
