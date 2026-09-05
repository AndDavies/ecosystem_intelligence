import { createHash } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  researchWorkflowCliModeValues,
  researchWorkflowRegistryParityIssues
} from "./workflow-registry";

export interface SkillValidationIssue {
  level: "error" | "warning";
  skill: string;
  file: string;
  message: string;
}

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function frontmatter(markdown: string) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return null;
  const fields = new Map<string, string>();
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (field) fields.set(field[1], field[2].trim().replace(/^(["'])(.*)\1$/, "$2"));
  }
  return { raw: match[1], fields, body: markdown.slice(match[0].length) };
}

async function markdownFiles(root: string) {
  const files: string[] = [];
  const walk = async (directory: string) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(entryPath);
      else if (entry.name.endsWith(".md")) files.push(entryPath);
    }
  };
  await walk(root);
  return files;
}

function cleanLink(value: string) {
  const target = value.trim().replace(/^<|>$/g, "").split(/\s+["']/)[0].split("#")[0];
  try {
    return decodeURIComponent(target);
  } catch {
    return target;
  }
}

export async function validateProjectSkills(workspaceRoot: string) {
  const skillsRoot = path.join(workspaceRoot, ".agents/skills");
  const registryPath = path.join(skillsRoot, "tnm-skill-registry.json");
  const registry = await exists(registryPath)
    ? JSON.parse(await readFile(registryPath, "utf8")) as {
        skills?: Array<{ name?: string; implicitInvocationAllowed?: boolean }>;
      }
    : null;
  const implicitInvocationPolicy = new Map(
    (registry?.skills ?? []).flatMap((entry) => (
      typeof entry.name === "string" && typeof entry.implicitInvocationAllowed === "boolean"
        ? [[entry.name, entry.implicitInvocationAllowed] as const]
        : []
    ))
  );
  const directories = (await readdir(skillsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("tnm-"))
    .map((entry) => entry.name)
    .sort();
  const issues: SkillValidationIssue[] = [];
  const add = (level: SkillValidationIssue["level"], skill: string, file: string, message: string) => issues.push({
    level,
    skill,
    file: path.relative(workspaceRoot, file),
    message
  });

  const workflowRegistryPath = path.join(skillsRoot, "tnm-research-workflow-registry.json");
  if (await exists(workflowRegistryPath)) {
    const workflowRaw = await readFile(workflowRegistryPath, "utf8");
    const workflow = JSON.parse(workflowRaw) as {
      schemaVersion?: string;
      modes?: Array<Record<string, unknown>>;
    };
    if (workflow.schemaVersion !== "tnm_research_workflow_registry_v1") {
      add("error", "tnm-autonomous-research", workflowRegistryPath, "Research workflow registry has an unsupported schemaVersion.");
    }
    const modes = workflow.modes ?? [];
    const modeNames = modes.map((mode) => mode.name).filter((name): name is string => typeof name === "string");
    const expectedModes = [...researchWorkflowCliModeValues].sort();
    if (JSON.stringify([...new Set(modeNames)].sort()) !== JSON.stringify(expectedModes)) {
      add("error", "tnm-autonomous-research", workflowRegistryPath, "Research workflow registry mode set is incomplete or duplicated.");
    }
    for (const parityIssue of researchWorkflowRegistryParityIssues(modes)) {
      add("error", "tnm-autonomous-research", workflowRegistryPath, parityIssue);
    }
    for (const mode of modes) {
      const values = [
        mode.candidateMinimum, mode.candidateTarget, mode.candidateMaximum,
        mode.prospectMinimum, mode.prospectMaximum, mode.sourceLaneMinimum,
        mode.namedTargetMinimum, mode.namedTargetMaximum
      ];
      if (!values.every((value) => Number.isInteger(value) && Number(value) >= 0)) {
        add("error", "tnm-autonomous-research", workflowRegistryPath, `Workflow mode '${String(mode.name)}' has invalid numeric bounds.`);
        continue;
      }
      if (!(Number(mode.candidateMinimum) <= Number(mode.candidateTarget) && Number(mode.candidateTarget) <= Number(mode.candidateMaximum))) {
        add("error", "tnm-autonomous-research", workflowRegistryPath, `Workflow mode '${String(mode.name)}' has inconsistent candidate bounds.`);
      }
      if (Number(mode.prospectMinimum) > Number(mode.prospectMaximum) || Number(mode.namedTargetMinimum) > Number(mode.namedTargetMaximum)) {
        add("error", "tnm-autonomous-research", workflowRegistryPath, `Workflow mode '${String(mode.name)}' has inconsistent prospect or target bounds.`);
      }
    }
    const generatedPath = path.join(skillsRoot, "tnm-autonomous-research/references/workflow-registry.md");
    const digest = createHash("sha256").update(workflowRaw).digest("hex");
    if (!(await exists(generatedPath)) || !(await readFile(generatedPath, "utf8")).includes(`<!-- registry-sha256:${digest} -->`)) {
      add("error", "tnm-autonomous-research", generatedPath, "Generated workflow reference is stale; rerun render_tnm_research_workflow.py --write.");
    }
    const finalizerCommand = "pnpm research:finalize -- --run <run-path> --apply";
    for (const skill of ["tnm-autonomous-research", "tnm-review-steward"]) {
      const skillPath = path.join(skillsRoot, skill, "SKILL.md");
      if (await exists(skillPath) && !(await readFile(skillPath, "utf8")).includes(finalizerCommand)) {
        add("error", skill, skillPath, "Skill must teach the canonical research:finalize apply command.");
      }
    }
    const runContractPath = path.join(skillsRoot, "tnm-autonomous-research/references/run-contract.md");
    if (await exists(runContractPath) && !(await readFile(runContractPath, "utf8")).includes(finalizerCommand)) {
      add("error", "tnm-autonomous-research", runContractPath, "Run contract must teach the canonical research:finalize apply command.");
    }
  } else if (await exists(path.join(skillsRoot, "tnm-skill-registry.json"))) {
    add("error", "tnm-autonomous-research", workflowRegistryPath, "Research workflow registry is missing.");
  }

  for (const skill of directories) {
    const skillRoot = path.join(skillsRoot, skill);
    const skillFile = path.join(skillRoot, "SKILL.md");
    if (!(await exists(skillFile))) {
      add("error", skill, skillFile, "SKILL.md is missing.");
      continue;
    }
    const skillMarkdown = await readFile(skillFile, "utf8");
    const metadata = frontmatter(skillMarkdown);
    if (!metadata) {
      add("error", skill, skillFile, "SKILL.md requires YAML frontmatter.");
    } else {
      const metadataFields = [...metadata.fields.keys()];
      if (metadata.fields.get("name") !== skill) add("error", skill, skillFile, `Frontmatter name must equal '${skill}'.`);
      if (!metadata.fields.get("description")) add("error", skill, skillFile, "Frontmatter description is required.");
      for (const key of metadataFields.filter((key) => !["name", "description"].includes(key))) {
        add("error", skill, skillFile, `Unsupported frontmatter field '${key}'; use only name and description.`);
      }
      if (metadata.body.split(/\r?\n/).length > 500) add("warning", skill, skillFile, "SKILL.md exceeds the 500-line progressive-disclosure target.");
    }

    const agentFile = path.join(skillRoot, "agents/openai.yaml");
    if (!(await exists(agentFile))) {
      add("error", skill, agentFile, "agents/openai.yaml is required for the project-local skill interface.");
    } else {
      const agentYaml = await readFile(agentFile, "utf8");
      for (const key of ["display_name", "short_description", "default_prompt"]) {
        if (!new RegExp(`^\\s*${key}:`, "m").test(agentYaml)) add("error", skill, agentFile, `Interface field '${key}' is missing.`);
      }
      if (!agentYaml.includes(`$${skill}`)) add("error", skill, agentFile, `default_prompt must name $${skill}.`);
      const actualImplicitMatch = agentYaml.match(/^\s*allow_implicit_invocation:\s*(true|false)\s*$/m);
      const expectedImplicit = implicitInvocationPolicy.get(skill) ?? false;
      if (!actualImplicitMatch) {
        add("error", skill, agentFile, "Policy field 'allow_implicit_invocation' is missing.");
      } else if ((actualImplicitMatch[1] === "true") !== expectedImplicit) {
        add(
          "error",
          skill,
          agentFile,
          expectedImplicit
            ? "Skill registry permits implicit invocation, but the interface disables it."
            : "True North Map operator skills must require explicit invocation."
        );
      }
    }

    for (const markdownFile of await markdownFiles(skillRoot)) {
      const markdown = await readFile(markdownFile, "utf8");
      for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
        const target = cleanLink(match[1]);
        if (!target || /^(?:https?:|mailto:|plugin:|#)/.test(target)) continue;
        const resolved = path.resolve(path.dirname(markdownFile), target);
        if (!(await exists(resolved))) add("error", skill, markdownFile, `Broken local Markdown link '${target}'.`);
      }
      for (const match of markdown.matchAll(/(?:^|`)(?:python3|node)\s+(?:--test\s+)?([^\s`"'|;&]+)/gm)) {
        const target = match[1];
        if (!target || /[<$*]/.test(target) || path.isAbsolute(target)) continue;
        const rootPath = path.resolve(workspaceRoot, target);
        if (await exists(rootPath)) continue;
        const skillPath = path.resolve(skillRoot, target);
        const hint = await exists(skillPath) ? ` It exists only at '${path.relative(workspaceRoot, skillPath)}'; commands run from the repository root.` : "";
        add("error", skill, markdownFile, `Command path '${target}' does not exist from the repository root.${hint}`);
      }
    }
  }

  return { skillsRoot, skillCount: directories.length, issues };
}
