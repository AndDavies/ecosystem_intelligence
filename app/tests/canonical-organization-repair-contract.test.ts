import { readFile } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";
import { canonicalRepairPublicationErrorCode } from "../src/lib/research/canonical-repair-publication-errors";
import { normalizeOrganizationIdentity } from "../src/lib/research/identity-normalization";
import { assessCandidateLinkability, type LinkabilityCatalog } from "../src/lib/research/linkability-review";
import {
  organizationCanonicalRepairBundleV1Schema,
  organizationCanonicalRepairOperationV1Schema,
  researchCandidateBatchV2Schema
} from "../src/lib/research/pipeline-schema";
import {
  buildCanonicalRepairCandidate,
  canonicalRepairEmptyCapabilityDependencies,
  canonicalRepairEmptyOrganizationDependencies,
  canonicalRepairFixtureIds
} from "./fixtures/canonical-organization-repair-candidates";

const clone = <T>(value: T): T => structuredClone(value);

function evidence(operationId: string, suffix: string, claimClass: "source_backed" | "derived") {
  const normalizedSuffix = suffix.replaceAll(".", "-").replaceAll(/[A-Z]/g, (value) => `-${value.toLowerCase()}`);
  return {
    id: `evidence-${operationId}-${normalizedSuffix}`,
    sourceId: "source-alpha-canonical-repair",
    fieldPath: `operations.${operationId}.${suffix}`,
    claimClass,
    excerpt: `The durable fixture source supports the ${suffix.replaceAll(".", " ")} leaf and the bounded canonical repair conclusion.`,
    confidence: "high"
  };
}

describe("governed canonical organization repair contract", () => {
  it("accepts a complete exact-snapshot identity repair", () => {
    expect(organizationCanonicalRepairBundleV1Schema.safeParse(buildCanonicalRepairCandidate()).success).toBe(true);
  });

  it("preserves unrelated legacy profile fields during same-kind identity and alias-only repair", () => {
    const legacyProfileData = {
      portfolioScope: "Alpha Systems develops a bounded test capability for the isolated repair fixture.",
      evidencePosture: "A legacy profile field remains untouched until an ordinary dossier refresh reviews it."
    };
    expect(organizationCanonicalRepairBundleV1Schema.safeParse(buildCanonicalRepairCandidate({
      organization: { profileData: legacyProfileData }
    })).success).toBe(true);

    const alias = {
      id: canonicalRepairFixtureIds.alias,
      alias: "Alpha Legacy",
      aliasType: "former_name",
      publicationStatus: "published"
    };
    const operationId = "archive-alpha-alias";
    expect(organizationCanonicalRepairBundleV1Schema.safeParse(buildCanonicalRepairCandidate({
      organization: { profileData: legacyProfileData },
      activeAliases: [alias],
      operations: [{
        operationId,
        operation: "archive_alias",
        targetId: canonicalRepairFixtureIds.organization,
        aliasId: alias.id,
        before: alias,
        reason: "incorrect_owner",
        evidenceIds: [
          "evidence-archive-alpha-alias-before-alias",
          "evidence-archive-alpha-alias-reason"
        ],
        reviewerExplanation: "Archive the misowned alias without changing the organization's entity kind or unrelated legacy dossier fields."
      }],
      evidence: [
        evidence(operationId, "before.alias", "source_backed"),
        evidence(operationId, "reason", "derived")
      ]
    })).success).toBe(true);
  });

  it("admits exactly the six bounded operation types and rejects reparent, transfer, and hard-delete operations", () => {
    const candidate = buildCanonicalRepairCandidate();
    const organization = candidate.beforeRecord.organization;
    const alias = {
      id: canonicalRepairFixtureIds.alias,
      alias: "Alpha Legacy",
      aliasType: "former_name",
      publicationStatus: "published"
    };
    const capability = {
      id: canonicalRepairFixtureIds.capability,
      slug: "alpha-sensor",
      name: "Alpha Sensor",
      publicationStatus: "published",
      updatedAt: "2026-09-04T12:00:00.000Z"
    };
    const common = {
      targetId: canonicalRepairFixtureIds.organization,
      evidenceIds: ["evidence-operation"],
      reviewerExplanation: "The fixture keeps this operation narrow, explicit, and subject to individual human review before publication."
    };
    const operations = [
      candidate.operations[0],
      { operationId: "set-mandate", operation: "set_profile_field", ...common, profileField: "mandate", before: null, after: "A bounded source-backed mandate long enough for this canonical repair fixture." },
      { operationId: "add-alias", operation: "add_alias", ...common, alias: "Alpha Defence", aliasType: "trade_name" },
      { operationId: "archive-alias", operation: "archive_alias", ...common, aliasId: alias.id, before: alias, reason: "superseded_name" },
      { operationId: "archive-capability", operation: "archive_capability", ...common, capabilityId: capability.id, before: capability, reason: "unsupported_capability", dependencies: canonicalRepairEmptyCapabilityDependencies },
      { operationId: "archive-organization", operation: "archive_organization", ...common, before: organization, reason: "unsupported_identity", successor: null, dependencies: canonicalRepairEmptyOrganizationDependencies }
    ];
    for (const operation of operations) {
      expect(organizationCanonicalRepairOperationV1Schema.safeParse(operation).success).toBe(true);
    }
    for (const operation of ["reparent_capability", "transfer_claims", "delete_organization"]) {
      expect(organizationCanonicalRepairOperationV1Schema.safeParse({ ...common, operationId: operation, operation }).success).toBe(false);
    }
  });

  it("requires exact leaf evidence, exact former-name preservation, and immutable target snapshots", () => {
    const missingEvidence = clone(buildCanonicalRepairCandidate());
    missingEvidence.fieldEvidence = missingEvidence.fieldEvidence.slice(0, 1);
    expect(organizationCanonicalRepairBundleV1Schema.safeParse(missingEvidence).success).toBe(false);

    const containerEvidence = clone(buildCanonicalRepairCandidate());
    containerEvidence.fieldEvidence[0].fieldPath = "operations.rename-alpha.after";
    expect(organizationCanonicalRepairBundleV1Schema.safeParse(containerEvidence).success).toBe(false);

    const lostFormerName = clone(buildCanonicalRepairCandidate());
    lostFormerName.operations[0].formerNameAlias = "Different Former Name";
    expect(organizationCanonicalRepairBundleV1Schema.safeParse(lostFormerName).success).toBe(false);

    const staleSnapshot = clone(buildCanonicalRepairCandidate());
    staleSnapshot.beforeRecord.organization.updatedAt = "2026-09-04T12:00:01.000Z";
    expect(organizationCanonicalRepairBundleV1Schema.safeParse(staleSnapshot).success).toBe(false);
  });

  it("allows entity-kind correction only with valid profile cleanup and a source-backed required mandate", () => {
    const candidate = buildCanonicalRepairCandidate();
    const organization = candidate.beforeRecord.organization;
    const operations = [{
      operationId: "correct-kind",
      operation: "set_organization_identity",
      targetId: canonicalRepairFixtureIds.organization,
      before: organization,
      after: {
        name: organization.name,
        legalName: organization.legalName,
        websiteUrl: organization.websiteUrl,
        entityKind: "research_test_centre",
        organizationCategories: ["ocean_technology", "research_lab"]
      },
      formerNameAlias: null,
      evidenceIds: ["evidence-correct-kind-after-entity-kind", "evidence-correct-kind-after-organization-categories"],
      reviewerExplanation: "Correct the published entity kind and categories without changing the stable public identity or creating a new entity."
    }, {
      operationId: "remove-portfolio",
      operation: "set_profile_field",
      targetId: canonicalRepairFixtureIds.organization,
      profileField: "portfolioScope",
      before: organization.profileData.portfolioScope,
      after: null,
      evidenceIds: ["evidence-remove-portfolio-after-value"],
      reviewerExplanation: "Remove the company-only portfolio field because it is invalid for the corrected research and test centre kind."
    }, {
      operationId: "set-technical-mandate",
      operation: "set_profile_field",
      targetId: canonicalRepairFixtureIds.organization,
      profileField: "technicalMandate",
      before: null,
      after: "Alpha operates a public research and test mandate for bounded maritime sensing work in Canada.",
      evidenceIds: ["evidence-set-technical-mandate-after-value"],
      reviewerExplanation: "Add the required source-backed technical mandate for the corrected research and test centre entity kind."
    }];
    const parsed = organizationCanonicalRepairBundleV1Schema.safeParse(buildCanonicalRepairCandidate({
      operations,
      evidence: [
        evidence("correct-kind", "after.entityKind", "derived"),
        evidence("correct-kind", "after.organizationCategories", "derived"),
        evidence("remove-portfolio", "after.value", "source_backed"),
        evidence("set-technical-mandate", "after.value", "source_backed")
      ]
    }));
    expect(parsed.success).toBe(true);

    const unsupportedProfileEdit = clone(parsed.success ? parsed.data : buildCanonicalRepairCandidate());
    const profileOperation = unsupportedProfileEdit.operations.find((operation) => operation.operation === "set_profile_field" && operation.profileField === "technicalMandate");
    if (profileOperation?.operation === "set_profile_field") profileOperation.profileField = "publicContact";
    expect(organizationCanonicalRepairBundleV1Schema.safeParse(unsupportedProfileEdit).success).toBe(false);
  });

  it("requires organization archival to stand alone and binds a successor only to supersession", () => {
    const base = buildCanonicalRepairCandidate();
    const archiveId = "archive-alpha";
    const archiveOperation = {
      operationId: archiveId,
      operation: "archive_organization",
      targetId: canonicalRepairFixtureIds.organization,
      before: base.beforeRecord.organization,
      reason: "superseded",
      successor: {
        id: canonicalRepairFixtureIds.successor,
        slug: "beta-systems",
        name: "Beta Systems",
        baselineUpdatedAt: "2026-09-04T12:00:00.000Z"
      },
      dependencies: canonicalRepairEmptyOrganizationDependencies,
      evidenceIds: ["evidence-archive-alpha-before-name", "evidence-archive-alpha-reason", "evidence-archive-alpha-successor"],
      reviewerExplanation: "Soft-archive the predecessor only after exact successor identity and all protected dependency snapshots are checked."
    };
    const archival = buildCanonicalRepairCandidate({
      operations: [archiveOperation],
      evidence: [
        evidence(archiveId, "before.name", "source_backed"),
        evidence(archiveId, "reason", "derived"),
        evidence(archiveId, "successor", "source_backed")
      ]
    });
    expect(organizationCanonicalRepairBundleV1Schema.safeParse(archival).success).toBe(true);

    const mixed = clone(archival);
    mixed.operations.push(base.operations[0]);
    expect(organizationCanonicalRepairBundleV1Schema.safeParse(mixed).success).toBe(false);

    const noSuccessor = clone(archival);
    noSuccessor.operations[0].successor = null;
    expect(organizationCanonicalRepairBundleV1Schema.safeParse(noSuccessor).success).toBe(false);
  });

  it("normalizes punctuation consistently and rejects retained-alias or stale-successor collisions", () => {
    expect(normalizeOrganizationIdentity("  Alpha!  ")).toBe("alpha");
    const candidate = buildCanonicalRepairCandidate();
    const catalog: LinkabilityCatalog = {
      organizations: [
        { id: canonicalRepairFixtureIds.organization, slug: "alpha-systems", name: "Alpha Systems", websiteUrl: "https://alpha.example/", updatedAt: "2026-09-04T12:00:00.000Z", aliases: [] },
        { id: canonicalRepairFixtureIds.successor, slug: "beta-systems", name: "Beta Systems", websiteUrl: "https://beta.example/", updatedAt: "2026-09-04T12:00:00.000Z", aliases: ["Alpha Defence Systems!"] }
      ],
      programs: [],
      redirectSourceOrganizationIds: []
    };
    expect(assessCandidateLinkability(candidate, catalog).errors).toEqual([
      expect.stringContaining("collides with published organization")
    ]);

    const archive = buildCanonicalRepairCandidate({
      operations: [{
        operationId: "archive-alpha",
        operation: "archive_organization",
        targetId: canonicalRepairFixtureIds.organization,
        before: candidate.beforeRecord.organization,
        reason: "superseded",
        successor: { id: canonicalRepairFixtureIds.successor, slug: "beta-systems", name: "Beta Systems", baselineUpdatedAt: "2026-09-04T11:59:59.000Z" },
        dependencies: canonicalRepairEmptyOrganizationDependencies,
        evidenceIds: ["evidence-archive-alpha-before-name", "evidence-archive-alpha-reason", "evidence-archive-alpha-successor"],
        reviewerExplanation: "Soft-archive the exact predecessor only after the reviewed successor and protected dependency state are verified."
      }],
      evidence: [
        evidence("archive-alpha", "before.name", "source_backed"),
        evidence("archive-alpha", "reason", "derived"),
        evidence("archive-alpha", "successor", "source_backed")
      ]
    });
    expect(assessCandidateLinkability(archive, { ...catalog, organizations: catalog.organizations.map((item) => ({ ...item, aliases: [] })) }).errors).toEqual([
      expect.stringContaining("changed after the exact successor snapshot")
    ]);

    const websiteCollisionCatalog: LinkabilityCatalog = {
      ...catalog,
      organizations: catalog.organizations.map((organization) => organization.slug === "beta-systems"
        ? { ...organization, aliases: [], websiteUrl: "https://www.alpha.example/contact" }
        : organization)
    };
    expect(assessCandidateLinkability(candidate, websiteCollisionCatalog).errors).toEqual([
      expect.stringContaining("website domain 'alpha.example' collides")
    ]);
  });

  it("keeps publication failures actionable without exposing database details", () => {
    expect(canonicalRepairPublicationErrorCode({ code: "40001", message: "stale baseline" })).toBe("canonical-repair-stale");
    expect(canonicalRepairPublicationErrorCode({ code: "55000", message: "blocked by saved item" })).toBe("canonical-repair-protected");
    expect(canonicalRepairPublicationErrorCode({ code: "23505", message: "identity collision" })).toBe("canonical-repair-collision");
    expect(canonicalRepairPublicationErrorCode({ code: "22023", message: "invalid successor" })).toBe("canonical-repair-successor");
    expect(canonicalRepairPublicationErrorCode({ code: "55000", message: "non-public source requires review" })).toBe("canonical-repair-failed");
    expect(canonicalRepairPublicationErrorCode({ code: "55000", message: "redirect is immutable" })).toBe("canonical-repair-failed");
  });

  it("rejects duplicate canonical source URLs even when source IDs differ", () => {
    const candidate = clone(buildCanonicalRepairCandidate());
    candidate.sources.push({ ...candidate.sources[0], id: "source-alpha-canonical-repair-copy" });
    candidate.fieldEvidence.push({
      ...candidate.fieldEvidence[0],
      id: "evidence-rename-alpha-after-name-copy",
      sourceId: "source-alpha-canonical-repair-copy"
    });
    candidate.operations[0].evidenceIds.push("evidence-rename-alpha-after-name-copy");
    expect(organizationCanonicalRepairBundleV1Schema.safeParse(candidate).success).toBe(false);
  });

  it("keeps the portable JSON contracts strict and compilable", async () => {
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    for (const fileName of ["research-run.schema.json", "research-candidate-batch-v2.schema.json"]) {
      const schema = JSON.parse(await readFile(path.resolve("../research/ingestion/schema", fileName), "utf8"));
      expect(() => ajv.compile(schema)).not.toThrow();
    }
  });

  it("rejects duplicate target-match methods in both executable and portable contracts", async () => {
    const candidate = clone(buildCanonicalRepairCandidate());
    candidate.targetMatch.matchMethods = ["slug", "slug"];
    const batch = {
      schemaVersion: "research_candidate_batch_v2",
      batchId: "canonical-repair-parity-batch",
      runId: "canonical-repair-parity-run",
      title: "Canonical repair portable-schema parity fixture",
      status: "candidate",
      createdAt: "2026-09-04T12:00:00.000Z",
      selectedGap: {
        coverageView: "supply",
        dimension: "canonical target identity",
        reason: "A malformed duplicate match method must fail every representation of the research contract.",
        score: 100
      },
      sourceLeadBatchPath: "research/ingestion/source-leads-v2/canonical-repair-parity-run.json",
      guardrailNotes: ["Canonical repair remains private until individual human Review and a separate Publish decision."],
      candidates: [candidate],
      deferred: []
    };

    expect(researchCandidateBatchV2Schema.safeParse(batch).success).toBe(false);

    const portable = JSON.parse(await readFile(path.resolve("../research/ingestion/schema/research-candidate-batch-v2.schema.json"), "utf8"));
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    const validate = ajv.compile(portable);
    expect(validate(batch)).toBe(false);
    expect(validate.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ keyword: "uniqueItems" })
    ]));
  });

  it("wires archived dossier slugs only to reviewed one-hop published successors", async () => {
    const page = await readFile(path.resolve("src/app/organizations/[slug]/page.tsx"), "utf8");
    const repository = await readFile(path.resolve("src/lib/atlas/repository.ts"), "utf8");
    const supabaseRepository = await readFile(path.resolve("src/lib/atlas/supabase-repository.ts"), "utf8");

    expect(page).toContain("if (!organization)");
    expect(page).toContain("if (!query.cold_dossier_gate)");
    expect(page).toContain("getAtlasOrganizationSuccessorSlug(slug)");
    expect(page).toContain("permanentRedirect(`/organizations/${successorSlug}${returnQuery}`)");
    expect(repository).toContain("loadPublishedOrganizationSuccessorSlugFromSupabase(slug)");
    expect(supabaseRepository).toContain('.from("organization_slug_redirects")');
    expect(supabaseRepository).toContain('.eq("source_slug", sourceSlug)');
    expect(supabaseRepository).toContain('.eq("publication_status", "published")');
    expect(supabaseRepository).toContain("return destinationResult.data?.slug ? String(destinationResult.data.slug) : null");
  });
});
