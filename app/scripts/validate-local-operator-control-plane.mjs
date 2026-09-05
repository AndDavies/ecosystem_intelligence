import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const skillsRoot = path.join(root, ".agents/skills");
const expected = new Map([
  ["tnm-autonomous-research", false],
  ["tnm-daily-signals", false],
  ["tnm-north-signal", true],
  ["tnm-visibility", false],
  ["tnm-site-assurance", false],
  ["tnm-signal-refresh", false],
  ["tnm-source-discovery", false],
  ["tnm-candidate-builder", false],
  ["tnm-evidence-mapper", false],
  ["tnm-candidate-logo", false],
  ["tnm-review-steward", false],
]);
const errors = [];
const expectedAutomations = new Map([
  ["true-north-map-weekday-signal-refresh", {
    status: "PAUSED",
    rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=8;BYMINUTE=0;BYSECOND=0",
    registryId: "AUTO-02",
  }],
  ["true-north-map-weekly-visibility-refresh", {
    status: "PAUSED",
    rrule: "RRULE:FREQ=WEEKLY;BYDAY=MO;BYHOUR=8;BYMINUTE=0",
    registryId: "AUTO-03",
  }],
]);

if (!fs.existsSync(skillsRoot)) {
  console.error("Local operator control-plane validation failed: .agents/skills is not installed in this checkout.");
  process.exit(1);
}

for (const [skill, expectedImplicit] of expected) {
  const skillFile = path.join(skillsRoot, skill, "SKILL.md");
  const metadataFile = path.join(skillsRoot, skill, "agents/openai.yaml");
  if (!fs.existsSync(skillFile)) errors.push(`${skill} is missing SKILL.md.`);
  if (!fs.existsSync(metadataFile)) {
    errors.push(`${skill} is missing agents/openai.yaml.`);
    continue;
  }
  const metadata = fs.readFileSync(metadataFile, "utf8");
  const match = metadata.match(/allow_implicit_invocation:\s*(true|false)/);
  if (!match) {
    errors.push(`${skill} must declare allow_implicit_invocation explicitly.`);
    continue;
  }
  const actualImplicit = match[1] === "true";
  if (actualImplicit !== expectedImplicit) {
    errors.push(`${skill} has allow_implicit_invocation=${actualImplicit}; expected ${expectedImplicit}.`);
  }
  if (!/short_description:\s*"[^"\n]+"/.test(metadata)) errors.push(`${skill} is missing a concise short_description.`);
}

const installed = fs.readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.startsWith("tnm-"))
  .map((entry) => entry.name)
  .sort();
const unregistered = installed.filter((skill) => !expected.has(skill));
if (unregistered.length) errors.push(`Unregistered TNM skills are installed: ${unregistered.join(", ")}.`);

const registry = fs.readFileSync(path.join(root, "context/governance/Skills And Automation Map.md"), "utf8");
for (const [automationId, contract] of expectedAutomations) {
  const automationFile = path.join(os.homedir(), ".codex/automations", automationId, "automation.toml");
  if (!fs.existsSync(automationFile)) {
    errors.push(`${automationId} is missing automation.toml.`);
    continue;
  }
  const automation = fs.readFileSync(automationFile, "utf8");
  const actualId = automation.match(/^id = "([^"]+)"$/m)?.[1];
  const actualStatus = automation.match(/^status = "([^"]+)"$/m)?.[1];
  const actualRrule = automation.match(/^rrule = "([^"]+)"$/m)?.[1];
  if (actualId !== automationId) errors.push(`${automationId} declares id ${actualId ?? "<missing>"}.`);
  if (actualStatus !== contract.status) errors.push(`${automationId} has status ${actualStatus ?? "<missing>"}; expected ${contract.status}.`);
  if (actualRrule !== contract.rrule) errors.push(`${automationId} has rrule ${actualRrule ?? "<missing>"}; expected ${contract.rrule}.`);
  if (!registry.includes(`| ${contract.registryId} |`) || !registry.includes(`~/.codex/automations/${automationId}/automation.toml`)) {
    errors.push(`${automationId} is not correctly represented by ${contract.registryId} in the system registry.`);
  }
}

if (errors.length) {
  console.error("Local operator control-plane validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  installedSkills: installed.length,
  operatorFacing: [...expected.values()].filter(Boolean).length,
  explicitOnly: [...expected.values()].filter((value) => !value).length,
  automations: expectedAutomations.size,
}, null, 2));
