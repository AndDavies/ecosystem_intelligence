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
      projectFile("AGENTS.md"),
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
    const governance = await projectFile("AGENTS.md");

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

    expect(coordinator).toContain("research_collection_plan_v1");
    expect(coordinator).toContain("research_claim_ledger_v1");
    expect(discovery).toContain("English/French variants");
    expect(mapper).toContain("source-independence keys");
    expect(steward).toContain("--collection-plan");
    expect(steward).toContain("--claims");
    expect(runner).toContain("is not mapped through the claim ledger");
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
});
