import { access } from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { validateProjectSkills } from "../src/lib/research/skill-validation";

const projectRoot = path.resolve("..");
const localSkillsAvailable = await access(path.join(projectRoot, ".agents/skills/tnm-autonomous-research/SKILL.md"))
  .then(() => true)
  .catch(() => false);

// Skills are private and absent in CI. Validate the installed dependency graph,
// mode parity and invocation policy locally. Exact sentence matching made
// progressive disclosure impossible; executable pipeline tests cover data gates.
describe.runIf(localSkillsAvailable)("installed Research workflow integrity", () => {
  it("resolves installed references, commands, registry modes and invocation policies", async () => {
    const result = await validateProjectSkills(projectRoot);
    expect(result.skillCount).toBeGreaterThan(0);
    expect(result.issues.filter((issue) => issue.level === "error")).toEqual([]);
  });
});

it("rejects unsupported validation flags before silently scanning the archive", async () => {
  await expect(promisify(execFile)(process.execPath, [
    path.resolve("node_modules/tsx/dist/cli.mjs"),
    path.resolve("scripts/autonomous-research.ts"), "validate", "--run", "absent-fixture.json"
  ], { timeout: 5000 })).rejects.toMatchObject({
    code: 1,
    stderr: expect.stringContaining("No archive scan was started.")
  });
});
