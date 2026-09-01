import { describe, expect, it } from "vitest";
import {
  assessCandidateLinkability,
  classifyProgramParticipationRole,
  formatCandidateLinkabilityReview,
  resolveLinkabilityOrganization,
  resolveLinkabilityProgram,
  type LinkabilityCatalog
} from "../src/lib/research/linkability-review";

const catalog: LinkabilityCatalog = {
  organizations: [
    { id: "org-1", slug: "alpha-systems", name: "Alpha Systems", aliases: ["Alpha Defence"] },
    { id: "org-2", slug: "beta-labs", name: "Beta Labs", aliases: ["Shared Alias"] },
    { id: "org-3", slug: "gamma-labs", name: "Gamma Labs", aliases: ["Shared Alias"] }
  ],
  programs: [{
    id: "program-1",
    slug: "nato-diana",
    name: "NATO DIANA",
    programType: "accelerator",
    operatorName: "NATO DIANA",
    websiteUrl: "https://www.diana.nato.int/",
    summary: "A canonical published summary long enough to represent the shared program definition."
  }]
};

describe("private research linkability review", () => {
  it("resolves only exact canonical names and published aliases", () => {
    expect(resolveLinkabilityOrganization({ name: "Alpha Systems" }, catalog.organizations)).toMatchObject({
      status: "canonical_exact",
      organization: { slug: "alpha-systems" }
    });
    expect(resolveLinkabilityOrganization({ name: "Alpha Defence" }, catalog.organizations)).toMatchObject({
      status: "exact_alias_suggestion",
      organization: { slug: "alpha-systems" },
      matchedAlias: "Alpha Defence"
    });
    expect(resolveLinkabilityOrganization({ name: "Shared Alias" }, catalog.organizations)).toMatchObject({
      status: "ambiguous"
    });
    expect(resolveLinkabilityOrganization({ name: "Alpha" }, catalog.organizations)).toEqual({ status: "unresolved" });
  });

  it("fails closed on self references and supplied slug/name conflicts", () => {
    expect(resolveLinkabilityOrganization({ name: "Alpha Defence", slug: "alpha-systems" }, catalog.organizations, "alpha-systems")).toMatchObject({
      status: "self_reference"
    });
    expect(resolveLinkabilityOrganization({ name: "New Company", slug: "new-company" }, catalog.organizations, "new-company")).toMatchObject({
      status: "self_reference",
      slug: "new-company"
    });
    expect(resolveLinkabilityOrganization({ name: "Wrong Name", slug: "alpha-systems" }, catalog.organizations)).toMatchObject({
      status: "slug_name_mismatch"
    });
    expect(resolveLinkabilityOrganization({ name: "Alpha Systems", slug: "alpha-system-typo" }, catalog.organizations)).toEqual({
      status: "slug_not_found",
      slug: "alpha-system-typo"
    });
  });

  it("turns explicit invalid targets into hard errors while keeping no-slug exact matches advisory", () => {
    const explicitMismatch = assessCandidateLinkability({
      candidateId: "explicit-mismatch",
      candidateKind: "organization_bundle",
      organization: { slug: "new-company" },
      relationships: [{
        relatedOrganizationName: "Wrong Name",
        relatedOrganizationSlug: "alpha-systems",
        relationshipType: "supplier"
      }]
    }, catalog);
    expect(explicitMismatch.errors).toEqual([
      expect.stringContaining("neither the published canonical name nor a published alias")
    ]);
    expect(explicitMismatch.warnings).toEqual([]);

    const missingTarget = assessCandidateLinkability({
      candidateId: "missing-target",
      candidateKind: "organization_bundle",
      organization: { slug: "new-company" },
      relationships: [{
        relatedOrganizationName: "Missing Organization",
        relatedOrganizationSlug: "missing-organization",
        relationshipType: "supplier"
      }]
    }, catalog);
    expect(missingTarget.errors).toEqual([
      expect.stringContaining("missing or unpublished")
    ]);

    const advisory = assessCandidateLinkability({
      candidateId: "advisory-alias",
      candidateKind: "organization_bundle",
      organization: { slug: "new-company" },
      relationships: [{
        relatedOrganizationName: "Alpha Defence",
        relatedOrganizationSlug: null,
        relationshipType: "supplier"
      }]
    }, catalog);
    expect(advisory.errors).toEqual([]);
    expect(advisory.warnings).toEqual([
      expect.stringContaining("keep this as a review suggestion")
    ]);
  });

  it("hard-stops self relationships and same-slug canonical program drift", () => {
    const assessment = assessCandidateLinkability({
      candidateId: "invalid-program-and-self-link",
      candidateKind: "organization_bundle",
      schemaVersion: "organization_bundle_v3",
      organization: { slug: "alpha-systems" },
      relationships: [{
        relatedOrganizationName: "Alpha Defence",
        relatedOrganizationSlug: "alpha-systems",
        relationshipType: "operator"
      }],
      programParticipations: [{
        program: {
          slug: "nato-diana",
          name: "NATO DIANA",
          programType: "accelerator",
          operatorName: "Different operator",
          websiteUrl: "https://www.diana.nato.int/",
          summary: "A canonical published summary long enough to represent the shared program definition."
        },
        participation: { participationType: "cohort company", cohortLabel: "2026" }
      }]
    }, catalog);

    expect(assessment.errors).toHaveLength(2);
    expect(assessment.errors).toEqual(expect.arrayContaining([
      expect.stringContaining("resolves to the candidate itself"),
      expect.stringContaining("conflicts with its published canonical program in operatorName")
    ]));
  });

  it("requires exact canonical program reuse and flags exact-name duplicates", () => {
    const exact = {
      slug: "nato-diana",
      name: "NATO DIANA",
      programType: "accelerator",
      operatorName: "NATO DIANA",
      websiteUrl: "https://www.diana.nato.int/",
      summary: "A canonical published summary long enough to represent the shared program definition.",
      participationType: "cohort company",
      cohortLabel: "2026"
    };
    expect(resolveLinkabilityProgram(exact, catalog.programs)).toMatchObject({ status: "canonical_exact" });
    expect(resolveLinkabilityProgram({ ...exact, operatorName: "Different operator" }, catalog.programs)).toMatchObject({
      status: "canonical_conflict",
      differingFields: ["operatorName"]
    });
    expect(resolveLinkabilityProgram({ ...exact, slug: "nato-diana-for-alpha" }, catalog.programs)).toMatchObject({
      status: "possible_duplicate"
    });
  });

  it("keeps role bucketing review-only and distinguishes operators from cohort companies", () => {
    expect(classifyProgramParticipationRole("Program operator")).toBe("operator");
    expect(classifyProgramParticipationRole("2026 cohort company")).toBe("cohort_company");
    expect(classifyProgramParticipationRole("Technology partner")).toBe("other");
  });

  it("renders a private review section without creating capability-to-program claims", () => {
    const lines = formatCandidateLinkabilityReview({
      candidateKind: "organization_bundle",
      schemaVersion: "organization_bundle_v3",
      organization: { slug: "new-company" },
      relationships: [{
        relatedOrganizationName: "Alpha Defence",
        relatedOrganizationSlug: null,
        relationshipType: "supplier"
      }],
      programParticipations: [{
        program: {
          slug: "nato-diana",
          name: "NATO DIANA",
          programType: "accelerator",
          operatorName: "NATO DIANA",
          websiteUrl: "https://www.diana.nato.int/",
          summary: "A canonical published summary long enough to represent the shared program definition."
        },
        participation: { participationType: "cohort company", cohortLabel: "2026" }
      }]
    }, catalog).join("\n");

    expect(lines).toContain("Private deterministic review aid only");
    expect(lines).toContain("exact published alias");
    expect(lines).toContain("reuse");
    expect(lines).toContain("do not apply it to every capability");
    expect(lines).toContain("No capability-to-program link is created");
  });
});
