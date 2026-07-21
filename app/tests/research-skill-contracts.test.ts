import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve("..");

async function projectFile(relativePath: string) {
  return readFile(path.join(projectRoot, relativePath), "utf8");
}

describe("True North Map research skill contracts", () => {
  it("keeps the project-local research chain as the skills of record", async () => {
    const skillPaths = [
      ".agents/skills/tnm-autonomous-research/SKILL.md",
      ".agents/skills/tnm-source-discovery/SKILL.md",
      ".agents/skills/tnm-candidate-builder/SKILL.md",
      ".agents/skills/tnm-evidence-mapper/SKILL.md",
      ".agents/skills/tnm-review-steward/SKILL.md",
    ];
    const [governance, scheduleContract, ...skills] = await Promise.all([
      projectFile("AGENTS.md"),
      projectFile("context/governance/Autonomous Ecosystem Research Pipeline.md"),
      ...skillPaths.map(projectFile),
    ]);

    expect(governance).toContain("canonical skills of record");
    expect(governance).toContain("supersede cached or globally installed variants");
    expect(scheduleContract).toContain("must use the five project-local skills of record");
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
});
