import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve("..");
const localSkillsAvailable = await access(path.join(projectRoot, ".agents/skills/tnm-autonomous-research/SKILL.md"))
  .then(() => true)
  .catch(() => false);

async function projectFile(relativePath: string) {
  return readFile(path.join(projectRoot, relativePath), "utf8");
}

describe.runIf(localSkillsAvailable)("True North Map research skill contracts", () => {
  it("keeps the project-local research chain as the skills of record", async () => {
    const skillPaths = [
      ".agents/skills/tnm-autonomous-research/SKILL.md",
      ".agents/skills/tnm-signal-refresh/SKILL.md",
      ".agents/skills/tnm-source-discovery/SKILL.md",
      ".agents/skills/tnm-candidate-builder/SKILL.md",
      ".agents/skills/tnm-evidence-mapper/SKILL.md",
      ".agents/skills/tnm-candidate-logo/SKILL.md",
      ".agents/skills/tnm-review-steward/SKILL.md",
    ];
    const [governance, scheduleContract, ...skills] = await Promise.all([
      projectFile("context/governance/Skills And Automation Map.md"),
      projectFile("context/governance/Autonomous Ecosystem Research Pipeline.md"),
      ...skillPaths.map(projectFile),
    ]);

    expect(governance).toContain("canonical skills of record");
    expect(governance).toContain("supersede cached or globally installed variants");
    expect(scheduleContract).toContain("seven project-local skills of record");
    for (const skill of skills) {
      expect(skill).toContain("skill of record");
    }
  });

  it("automatically advances qualified leads without a chat approval pause", async () => {
    const coordinator = await projectFile(".agents/skills/tnm-autonomous-research/SKILL.md");
    const discovery = await projectFile(".agents/skills/tnm-source-discovery/SKILL.md");
    const governance = await projectFile("context/governance/Skills And Automation Map.md");

    expect(coordinator).toContain("Do not pause or request source-lead approval");
    expect(discovery).toContain("Hand every validated `qualified` lead");
    expect(governance).toContain("Every validated `qualified` lead proceeds automatically");
    expect(governance).not.toContain("source leads -> human review -> candidate batch");
    expect(governance).not.toContain("Human review approves which source leads");
  });

  it("requires enriched candidates rather than schema-minimal records", async () => {
    const builder = await projectFile(".agents/skills/tnm-candidate-builder/SKILL.md");
    const mapper = await projectFile(".agents/skills/tnm-evidence-mapper/SKILL.md");
    const steward = await projectFile(".agents/skills/tnm-review-steward/SKILL.md");
    const runner = await projectFile("app/scripts/autonomous-research.ts");

    expect(builder).toContain("Enrich the candidate with every material, supported detail");
    expect(mapper).toContain("complementary official identity, capability or program");
    expect(steward).toContain("rather than merely schema-minimal");
    expect(runner).toContain("Build enriched typed candidates");
    expect(runner).toContain('if (value === "--") continue;');
    expect(runner).toContain("artifactPredatesPublication(candidateBatch.data.createdAt, publishedOrganization)");
  });

  it("prepares official logo provenance before organization candidates enter review", async () => {
    const coordinator = await projectFile(".agents/skills/tnm-autonomous-research/SKILL.md");
    const logo = await projectFile(".agents/skills/tnm-candidate-logo/SKILL.md");
    const runner = await projectFile("app/scripts/prepare-candidate-logos.ts");

    expect(coordinator).toContain("$tnm-candidate-logo");
    expect(logo).toContain("company-logo-downloader");
    expect(logo).toContain("never publishes a media asset");
    expect(runner).toContain("research_candidate_logo_packet_v1");
    expect(runner).toContain("private_candidate_artifacts_only");
  });

  it("preserves PostgreSQL refresh timestamps across every research handoff", async () => {
    const coordinator = await projectFile(".agents/skills/tnm-autonomous-research/SKILL.md");
    const runContract = await projectFile(".agents/skills/tnm-autonomous-research/references/run-contract.md");
    const builder = await projectFile(".agents/skills/tnm-candidate-builder/SKILL.md");
    const steward = await projectFile(".agents/skills/tnm-review-steward/SKILL.md");

    expect(coordinator).toContain("copy the production target's `updated_at` text byte-for-byte");
    expect(runContract).toContain("Do not pass the value through JavaScript `Date`");
    expect(builder).toContain("never parse, normalize, round, or truncate it");
    expect(steward).toContain("millisecond truncation");
  });

  it("requires claim-led OSINT collection and dossier coverage before staging", async () => {
    const coordinator = await projectFile(".agents/skills/tnm-autonomous-research/SKILL.md");
    const discovery = await projectFile(".agents/skills/tnm-source-discovery/SKILL.md");
    const mapper = await projectFile(".agents/skills/tnm-evidence-mapper/SKILL.md");
    const steward = await projectFile(".agents/skills/tnm-review-steward/SKILL.md");
    const runner = await projectFile("app/scripts/autonomous-research.ts");
    const schema = await projectFile("app/src/lib/research/pipeline-schema.ts");

    expect(coordinator).toContain("research_collection_plan_v1");
    expect(coordinator).toContain("research_claim_ledger_v1");
    expect(discovery).toContain("English/French variants");
    expect(mapper).toContain("source-independence keys");
    expect(steward).toContain("--collection-plan");
    expect(steward).toContain("--claims");
    expect(schema).toContain("must map to exactly one atomic claim-ledger leaf");
    expect(runner).toContain('status === "pending" || status === "approved"');
    expect(runner).toContain("isActiveReviewCandidateStatus(atlas.candidateStatuses[candidate.candidateId])");
  });

  it("carries a decision-useful research chain from discovery into review", async () => {
    const coordinator = await projectFile(".agents/skills/tnm-autonomous-research/SKILL.md");
    const decisionStandard = await projectFile(".agents/skills/tnm-autonomous-research/references/decision-usefulness.md");
    const discovery = await projectFile(".agents/skills/tnm-source-discovery/SKILL.md");
    const refresh = await projectFile(".agents/skills/tnm-signal-refresh/SKILL.md");
    const builder = await projectFile(".agents/skills/tnm-candidate-builder/SKILL.md");
    const mapper = await projectFile(".agents/skills/tnm-evidence-mapper/SKILL.md");
    const steward = await projectFile(".agents/skills/tnm-review-steward/SKILL.md");
    const runner = await projectFile("app/scripts/autonomous-research.ts");

    expect(coordinator).toContain("decision chain");
    expect(decisionStandard).toContain("Entity outward");
    expect(decisionStandard).toContain("Problem inward");
    expect(discovery).toContain("Search problem-inward");
    expect(refresh).toContain("decision delta");
    expect(builder).toContain("Mission/Public Need read");
    expect(mapper).toContain("two separate evidence premises");
    expect(steward).toContain("bounded reviewer action");
    expect(runner).toContain('questionId: "mission-public-need-read"');
    expect(runner).toContain('questionId: "reviewer-action"');
    expect(runner).toContain("Derived Mission Area reads");
  });

  it("hard-stops templated review prose under the pipeline 1.7 contract", async () => {
    const coordinator = await projectFile(".agents/skills/tnm-autonomous-research/SKILL.md");
    const quality = await projectFile(".agents/skills/tnm-autonomous-research/references/quality-contract.md");
    const runContract = await projectFile(".agents/skills/tnm-autonomous-research/references/run-contract.md");
    const discovery = await projectFile(".agents/skills/tnm-source-discovery/SKILL.md");
    const refresh = await projectFile(".agents/skills/tnm-signal-refresh/SKILL.md");
    const builder = await projectFile(".agents/skills/tnm-candidate-builder/SKILL.md");
    const mapper = await projectFile(".agents/skills/tnm-evidence-mapper/SKILL.md");
    const steward = await projectFile(".agents/skills/tnm-review-steward/SKILL.md");

    expect(coordinator).toContain("Pipeline 1.7");
    expect(quality).toContain("Pipeline 1.7 record specificity");
    expect(discovery).toContain("Never reuse a name-substitution sentence");
    expect(refresh).toContain("Every qualified refresh signal has a non-empty `changeSummary`");
    expect(builder).toContain("quotes a distinctive proposed-value anchor");
    expect(mapper).toContain("workflow predicates beginning with set/add/update");
    expect(quality).toContain("exactly one eligible `candidate_field` claim");
    expect(quality).toContain("Cross-subject or fabricated-subject lineage is a staging hard stop");
    expect(quality).toContain("Cross-target, wrong-outcome, or missing-delta signal lineage is a staging hard stop");
    expect(mapper).toContain("identical candidate, field path, source ID and excerpt");
    expect(steward).toContain("no duplicate heading or “fields reviewed” claim");
    expect(coordinator).toContain("typed `readinessDisposition` field");
    expect(quality).toContain("Duplicate subject IDs, duplicate canonical target keys");
    expect(runContract).toContain("Do not call `stage_research_candidates_for_review` directly");
    expect(steward).toContain("Stage only through the tracked `research:import` command");
    expect(runContract).not.toContain("call only `public.stage_research_candidates_for_review` through the Supabase connector");
    expect(steward).not.toContain("Before using the Supabase connector");
  });

  it("keeps dossier research comprehensive without turning source volume into a quota", async () => {
    const coordinator = await projectFile(".agents/skills/tnm-autonomous-research/SKILL.md");
    const quality = await projectFile(".agents/skills/tnm-autonomous-research/references/quality-contract.md");
    const discovery = await projectFile(".agents/skills/tnm-source-discovery/SKILL.md");
    const refresh = await projectFile(".agents/skills/tnm-signal-refresh/SKILL.md");
    const builder = await projectFile(".agents/skills/tnm-candidate-builder/SKILL.md");
    const steward = await projectFile(".agents/skills/tnm-review-steward/SKILL.md");
    const runner = await projectFile("app/scripts/autonomous-research.ts");
    const schema = await projectFile("app/src/lib/research/pipeline-schema.ts");

    expect(coordinator).toContain("There is no article or source-count target");
    expect(coordinator).toContain("at least three complementary lanes");
    expect(quality).toContain("There is no fixed dossier article or source quota");
    expect(discovery).toContain("Search at least three complementary lanes per target");
    expect(refresh).toContain("A dossier can proceed with zero qualified signals");
    expect(steward).toContain("decision-useful saturation explanation");
    expect(coordinator).toContain("tnm-research-pipeline/1.7.1");
    expect(coordinator).toContain("`saturation.additionalSearchYield` to be `low` or `zero`");
    expect(refresh).toContain("structured `eventDate`, `effectiveDate`, or `procurement.closingAt`");
    expect(refresh).toContain("never infer it from review or observation time");
    expect(builder).toContain("must include the explicit `set_field` operation");
    expect(steward).toContain("ordinary refresh batches require a linked qualified signal");
    expect(runner).toContain("There is no dossier article or source-count target");
    expect(runner).toContain("maxSourceItems: refreshBatch ? 50 : undefined");
    expect(schema).toContain('currentResearchPipelineVersion = "tnm-research-pipeline/1.7.1"');
    for (const contract of [coordinator, quality, discovery, refresh, steward]) {
      expect(contract).not.toContain("Pipeline 1.8");
      expect(contract).not.toContain("pipeline 1.8");
    }
  });

  it("prepares exact dossier targets and offers a genuinely non-writing smoke check", async () => {
    const coordinator = await projectFile(".agents/skills/tnm-autonomous-research/SKILL.md");
    const steward = await projectFile(".agents/skills/tnm-review-steward/SKILL.md");
    const runner = await projectFile("app/scripts/autonomous-research.ts");
    const candidateSchema = JSON.parse(await projectFile("research/ingestion/schema/research-candidate-batch-v2.schema.json")) as {
      properties: { candidates: { minItems: number } };
      $defs: { organizationRefreshBundleV2: { allOf: Array<{ properties?: { signalIds?: { minItems?: number } } }> } };
    };
    const leadSchema = JSON.parse(await projectFile("research/ingestion/schema/source-leads-v2.schema.json")) as {
      $defs: { recordRefreshLead: { allOf: Array<{ properties?: { signalIds?: { minItems?: number } } }> } };
    };

    expect(coordinator).toContain("--target-slugs <comma-separated-slugs>");
    expect(runner).toContain("dossier-enrichment requires --target-slugs");
    expect(runner).toContain("reviewQueueReadAvailable");
    expect(runner).toContain('options.get("check-only") === "true"');
    expect(runner).toContain("without writing review, staging, or database artifacts");
    expect(steward).toContain("check-only smoke validates the complete local lineage without rewriting review/staging artifacts or calling intake");
    expect(candidateSchema.properties.candidates.minItems).toBe(0);
    expect(candidateSchema.$defs.organizationRefreshBundleV2.allOf.some((part) => part.properties?.signalIds?.minItems !== undefined)).toBe(false);
    expect(leadSchema.$defs.recordRefreshLead.allOf.some((part) => part.properties?.signalIds?.minItems !== undefined)).toBe(false);
  });
});
