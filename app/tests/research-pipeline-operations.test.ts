import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import evalCases from "./fixtures/research-operation-evals.json";
import { boundedMap, boundedMapByKey } from "../src/lib/research/bounded-map";
import { buildResearchFinalizePlan } from "../src/lib/research/finalize-plan";
import { researchIdentityMatches } from "../src/lib/research/identity-match";
import { evaluateResearchOperationCases } from "../src/lib/research/operation-evals";
import type { ResearchCandidateBatchV2, ResearchRun } from "../src/lib/research/pipeline-schema";
import { withResearchWriterLock } from "../src/lib/research/single-writer-lock";
import { validateProjectSkills } from "../src/lib/research/skill-validation";
import { buildResearchSourceFamily } from "../src/lib/research/source-family";
import {
  researchWorkflowModeConfiguration,
  researchWorkflowModeConfigurations,
  researchWorkflowRegistryParityIssues,
  researchWorkflowRunMode
} from "../src/lib/research/workflow-registry";

const run = {
  runId: "synthetic-run",
  status: "completed",
  outputs: {
    collectionPlan: "research/collection.json",
    claimLedger: "research/claims.json",
    prospectInventory: null,
    signalBatch: "research/signals.json",
    sourceLeadBatch: "research/leads.json",
    candidateBatch: "research/candidates.json",
    reviewPacket: "research/review.md",
    stagingExport: "research/staging.json"
  }
} as unknown as ResearchRun;

function batch(candidates: unknown[]) {
  return { runId: "synthetic-run", candidates } as unknown as ResearchCandidateBatchV2;
}

describe("research pipeline operational controls", () => {
  it("builds stable bounded source-family keys without prefix collisions", () => {
    const prefix = "Government procurement and innovation source family ".repeat(4);
    const left = buildResearchSourceFamily(`${prefix}alpha`);
    const right = buildResearchSourceFamily(`${prefix}bravo`);
    expect(left).toHaveLength(120);
    expect(right).toHaveLength(120);
    expect(left).not.toBe(right);
    expect(buildResearchSourceFamily(`${prefix}alpha`)).toBe(left);
  });

  it("does not collapse separate agencies on a shared government host", () => {
    expect(researchIdentityMatches(
      { slug: "agency-alpha", name: "Agency Alpha", websiteDomain: "canada.ca" },
      { slug: "agency-bravo", name: "Agency Bravo", websiteDomain: "canada.ca" }
    )).toBe(false);
    expect(researchIdentityMatches(
      { slug: "program-alpha", name: "Program Alpha", websiteDomain: "ised-isde.canada.ca" },
      { slug: "program-bravo", name: "Program Bravo", websiteDomain: "ised-isde.canada.ca" }
    )).toBe(false);
    expect(researchIdentityMatches(
      { slug: "supplier-alpha", name: "Supplier Alpha", websiteDomain: "supplier.example" },
      { slug: "renamed-supplier", name: "Renamed Supplier", websiteDomain: "supplier.example" }
    )).toBe(true);
  });

  it("bounds asynchronous logo work while preserving result order", async () => {
    let active = 0;
    let maximumActive = 0;
    const results = await boundedMap([0, 1, 2, 3, 4, 5, 6], 3, async (value) => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return value * 2;
    });
    expect(maximumActive).toBeLessThanOrEqual(3);
    expect(results).toEqual([0, 2, 4, 6, 8, 10, 12]);
  });

  it("serializes logo work per host while retaining global concurrency", async () => {
    const values = [
      { host: "shared.example", value: 0 },
      { host: "other.example", value: 1 },
      { host: "shared.example", value: 2 },
      { host: "third.example", value: 3 }
    ];
    const activeByHost = new Map<string, number>();
    let maximumGlobal = 0;
    let activeGlobal = 0;
    const results = await boundedMapByKey(values, 3, (item) => item.host, async (item) => {
      activeGlobal += 1;
      maximumGlobal = Math.max(maximumGlobal, activeGlobal);
      const hostActive = (activeByHost.get(item.host) ?? 0) + 1;
      activeByHost.set(item.host, hostActive);
      expect(hostActive).toBe(1);
      await new Promise((resolve) => setTimeout(resolve, 5));
      activeByHost.set(item.host, hostActive - 1);
      activeGlobal -= 1;
      return item.value * 2;
    });
    expect(maximumGlobal).toBeGreaterThan(1);
    expect(maximumGlobal).toBeLessThanOrEqual(3);
    expect(results).toEqual([0, 2, 4, 6]);
  });

  it("plans a full guarded import and a safe zero-candidate disposition", () => {
    const apply = buildResearchFinalizePlan({
      runPath: "research/run.json",
      run,
      candidatePath: "research/candidates.json",
      batch: batch([{ candidateId: "candidate-one", candidateKind: "organization_bundle", candidateLogo: undefined }]),
      mode: "apply"
    });
    expect(apply.steps.map((step) => step.id)).toEqual([
      "logos", "validate", "review", "stage", "import", "reconcile"
    ]);

    const zero = buildResearchFinalizePlan({
      runPath: "research/run.json",
      run,
      candidatePath: "research/candidates.json",
      batch: batch([]),
      mode: "apply"
    });
    expect(zero.zeroCandidateDisposition).toBe(true);
    expect(zero.steps.map((step) => step.id)).toEqual(["validate"]);
  });

  it("validates production-shaped synthetic regression cases with trace metadata", () => {
    const results = evaluateResearchOperationCases(evalCases);
    expect(results.every((result) => result.passed)).toBe(true);
    expect(results.every((result) => result.trace.failureClass.length > 0)).toBe(true);
    expect(results.find((result) => result.caseId === "production-shaped-organization-bundle")?.observed).toMatchObject({
      eligible: true,
      schemaIssues: [],
      qualityIssues: [],
      lineageIssues: [],
      specificityIssues: []
    });
  });

  it("keeps current runtime modes in exact parity with the skill registry envelope", () => {
    expect(researchWorkflowRegistryParityIssues(researchWorkflowModeConfigurations)).toEqual([]);
    expect(researchWorkflowModeConfiguration("gap-targeted")).toBeUndefined();
    expect(researchWorkflowModeConfiguration("deep-dossier")).toMatchObject({ candidateMinimum: 0, candidateTarget: 5, candidateMaximum: 5, prospectMinimum: 1, sourceLaneMinimum: 3 });
    expect(researchWorkflowModeConfiguration("bootstrap")).toMatchObject({ candidateMinimum: 4, candidateTarget: 10, prospectMinimum: 4, sourceLaneMinimum: 6 });
    expect(researchWorkflowRunMode("corpus-refresh")).toBe("corpus_refresh");
    const drifted: Array<Record<string, unknown>> = researchWorkflowModeConfigurations.map((mode) => ({ ...mode }));
    drifted[0].candidateTarget = 9;
    expect(researchWorkflowRegistryParityIssues(drifted)).toContain("Research workflow registry modes do not exactly match the executable runtime mode configuration.");
  });

  it("serializes research preparation and import writers within one checkout", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "tnm-research-writer-"));
    const lockPath = path.join(workspace, "writer.lock");
    let allowRelease!: () => void;
    let markAcquired!: () => void;
    const acquired = new Promise<void>((resolve) => { markAcquired = resolve; });
    const release = new Promise<void>((resolve) => { allowRelease = resolve; });
    const first = withResearchWriterLock(workspace, "research-prepare", async () => {
      markAcquired();
      await release;
    }, { lockPath, ttlMs: 5_000 });
    await acquired;
    await expect(withResearchWriterLock(workspace, "research-import", async () => undefined, { lockPath, ttlMs: 5_000 }))
      .rejects.toThrow("Research preparation or Admin Review intake is already running in this checkout");
    allowRelease();
    await first;
    await expect(withResearchWriterLock(workspace, "research-import", async () => "acquired", { lockPath, ttlMs: 5_000 }))
      .resolves.toBe("acquired");

    const pipelineSource = await readFile(path.join(process.cwd(), "scripts/autonomous-research.ts"), "utf8");
    expect(pipelineSource).toContain("withResearchWriterLock(workspaceRoot, \"research-prepare\"");
    expect(pipelineSource).toContain("`research-import:${path.basename(stagingPath)}`");
  });

  it("reports broken skill commands and implicit invocation policy", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "tnm-skill-validation-"));
    const skillRoot = path.join(workspace, ".agents/skills/tnm-fixture");
    await mkdir(path.join(skillRoot, "agents"), { recursive: true });
    await writeFile(path.join(skillRoot, "SKILL.md"), "---\nname: tnm-fixture\ndescription: Validate a synthetic TNM fixture.\n---\n\nRun `python3 scripts/missing.py`.\n", "utf8");
    await writeFile(path.join(skillRoot, "agents/openai.yaml"), "interface:\n  display_name: TNM Fixture\n  short_description: Fixture validator\n  default_prompt: Use $tnm-fixture.\npolicy:\n  allow_implicit_invocation: true\n", "utf8");
    const result = await validateProjectSkills(workspace);
    expect(result.issues.map((issue) => issue.message)).toContain("True North Map operator skills must require explicit invocation.");
    expect(result.issues.some((issue) => issue.message.includes("does not exist from the repository root"))).toBe(true);
  });

  it("rejects a stale generated workflow reference", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "tnm-workflow-validation-"));
    const skillRoot = path.join(workspace, ".agents/skills/tnm-autonomous-research");
    await mkdir(path.join(skillRoot, "agents"), { recursive: true });
    await mkdir(path.join(skillRoot, "references"), { recursive: true });
    await writeFile(path.join(skillRoot, "SKILL.md"), "---\nname: tnm-autonomous-research\ndescription: Validate synthetic TNM workflow drift.\n---\n\nUse $tnm-autonomous-research and pnpm research:finalize -- --run <run-path> --apply.\n", "utf8");
    await writeFile(path.join(skillRoot, "agents/openai.yaml"), "interface:\n  display_name: TNM Research\n  short_description: Synthetic workflow validator\n  default_prompt: Use $tnm-autonomous-research.\npolicy:\n  allow_implicit_invocation: false\n", "utf8");
    await writeFile(path.join(skillRoot, "references/run-contract.md"), "Use pnpm research:finalize -- --run <run-path> --apply.\n", "utf8");
    await writeFile(path.join(skillRoot, "references/workflow-registry.md"), "<!-- registry-sha256:stale -->\n", "utf8");
    await writeFile(path.join(workspace, ".agents/skills/tnm-research-workflow-registry.json"), JSON.stringify({
      schemaVersion: "tnm_research_workflow_registry_v1",
      modes: [
        "bootstrap", "corpus-refresh", "deep-dossier", "discovery-batch", "dossier-enrichment", "refresh-batch"
      ].map((name) => ({
        name,
        candidateMinimum: 0,
        candidateTarget: 1,
        candidateMaximum: 1,
        prospectMinimum: 0,
        prospectMaximum: 1,
        sourceLaneMinimum: 1,
        namedTargetMinimum: 0,
        namedTargetMaximum: 1
      }))
    }), "utf8");
    const result = await validateProjectSkills(workspace);
    expect(result.issues.map((issue) => issue.message)).toContain("Generated workflow reference is stale; rerun render_tnm_research_workflow.py --write.");
    expect(result.issues.map((issue) => issue.message)).toContain("Research workflow registry modes do not exactly match the executable runtime mode configuration.");
  });
});
