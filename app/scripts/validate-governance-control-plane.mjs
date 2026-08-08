import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const today = new Date();
today.setUTCHours(0, 0, 0, 0);

const errors = [];
const warnings = [];

const agentsPath = "AGENTS.md";
const agents = read(agentsPath);
const agentsLines = agents.trimEnd().split(/\r?\n/).length;
const agentsBytes = Buffer.byteLength(agents, "utf8");

if (agentsLines > 140) errors.push(`${agentsPath} has ${agentsLines} lines; maximum is 140.`);
if (agentsBytes > 24 * 1024) errors.push(`${agentsPath} is ${agentsBytes} bytes; maximum is 24576.`);

const activeDocuments = [
  "context/governance/INDEX.md",
  "context/governance/Access And Privacy Matrix.md",
  "context/governance/Admin Workflow And Data Contract.md",
  "context/governance/Autonomous Ecosystem Research Pipeline.md",
  "context/governance/Cross-System Change And Regression Contract.md",
  "context/governance/Development Log.md",
  "context/governance/Email And Domain Infrastructure.md",
  "context/governance/Email Updates Operations.md",
  "context/governance/Internal Wiki Plan.md",
  "context/governance/PRD.md",
  "context/governance/Production Release Runbook.md",
  "context/governance/Project Status.md",
  "context/governance/Project Structure.md",
  "context/governance/Research Agent Schema And Source Contract.md",
  "context/governance/Security And Reliability Remediation Log.md",
  "context/governance/Skills And Automation Map.md",
  "context/governance/True North Map Project Overview.md",
  "context/governance/plans/README.md",
];

const criticalDocuments = new Set([
  "context/governance/INDEX.md",
  "context/governance/Admin Workflow And Data Contract.md",
  "context/governance/Cross-System Change And Regression Contract.md",
  "context/governance/Production Release Runbook.md",
  "context/governance/Project Status.md",
  "context/governance/Security And Reliability Remediation Log.md",
  "context/governance/Skills And Automation Map.md",
  "context/governance/True North Map Project Overview.md",
]);

const scratchPatterns = [
  "/Users/andrewdavies/Downloads/",
  "/tmp/",
  ".codex/attachments/",
  "codex-clipboard-",
  ".playwright-cli/",
  ".tmp/",
  "tmp/pdfs/",
];

for (const documentPath of activeDocuments) {
  const document = read(documentPath);
  const status = field(document, "Status");
  const owner = field(document, "Owner");
  const lastReviewed = field(document, "Last reviewed");

  if (!status) errors.push(`${documentPath} is missing Status metadata.`);
  if (!owner) errors.push(`${documentPath} is missing Owner metadata.`);
  if (!lastReviewed) {
    errors.push(`${documentPath} is missing Last reviewed metadata.`);
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(lastReviewed)) {
    errors.push(`${documentPath} has an invalid Last reviewed date: ${lastReviewed}.`);
  } else {
    const reviewedAt = new Date(`${lastReviewed}T00:00:00Z`);
    const ageDays = Math.floor((today - reviewedAt) / 86_400_000);
    if (ageDays > 30 && criticalDocuments.has(documentPath)) {
      errors.push(`${documentPath} is operationally critical and ${ageDays} days out of review.`);
    } else if (ageDays > 14) {
      warnings.push(`${documentPath} is ${ageDays} days out of review.`);
    }
  }

  for (const pattern of scratchPatterns) {
    if (document.includes(pattern)) {
      errors.push(`${documentPath} contains an obsolete local scratch or generated-artifact reference: ${pattern}`);
    }
  }
}

for (const documentPath of [
  agentsPath,
  "context/governance/INDEX.md",
  "context/governance/Skills And Automation Map.md",
]) {
  validateLinks(documentPath, read(documentPath));
}

const registryPath = "context/governance/Skills And Automation Map.md";
const registry = read(registryPath);
const registryBlock = between(registry, "<!-- registry:start -->", "<!-- registry:end -->");
const registryRows = registryBlock
  .split(/\r?\n/)
  .filter((line) => line.startsWith("|") && !line.includes("| ---") && !line.startsWith("| ID |"));
const registryIds = new Set();

if (!registryRows.length) errors.push(`${registryPath} has no registry rows.`);

for (const row of registryRows) {
  const cells = row.split("|").slice(1, -1).map((cell) => cell.trim());
  if (cells.length !== 13) {
    errors.push(`${registryPath} row has ${cells.length} columns instead of 13: ${row}`);
    continue;
  }
  const [id, type, operatorFacing, location, trigger, inputs, outputs, authority, validator, humanGate, status, owner, lastReviewed] = cells;
  const required = { id, type, operatorFacing, location, trigger, inputs, outputs, authority, validator, humanGate, status, owner, lastReviewed };
  for (const [name, value] of Object.entries(required)) {
    if (!value) errors.push(`${registryPath} row ${id || "<unknown>"} is missing ${name}.`);
  }
  if (registryIds.has(id)) errors.push(`${registryPath} contains duplicate ID ${id}.`);
  registryIds.add(id);
  if (!new Set(["Yes", "No"]).has(operatorFacing)) errors.push(`${id} has invalid Operator-facing value ${operatorFacing}.`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lastReviewed)) errors.push(`${id} has invalid Last reviewed date ${lastReviewed}.`);
}

const archiveNotice = read("context/archive/governance/README.md");
if (!archiveNotice.toLowerCase().includes("not active operating contracts")) {
  errors.push("context/archive/governance/README.md must state that archived material is not active operating guidance.");
}

if (errors.length) {
  console.error("Governance control-plane validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  if (warnings.length) {
    console.error("Warnings:");
    for (const warning of warnings) console.error(`- ${warning}`);
  }
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  agents: { lines: agentsLines, bytes: agentsBytes },
  activeDocuments: activeDocuments.length,
  registryRows: registryRows.length,
  warnings,
}, null, 2));

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    errors.push(`Required file is missing: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function field(document, name) {
  const match = document.match(new RegExp(`^${name}:\\s*(.+?)\\s*$`, "mi"));
  return match?.[1]?.replace(/\s{2}$/, "").trim() ?? "";
}

function between(document, startMarker, endMarker) {
  const start = document.indexOf(startMarker);
  const end = document.indexOf(endMarker);
  if (start === -1 || end === -1 || end <= start) {
    errors.push(`Missing or invalid registry markers in ${registryPath}.`);
    return "";
  }
  return document.slice(start + startMarker.length, end);
}

function validateLinks(documentPath, document) {
  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;
  for (const match of document.matchAll(linkPattern)) {
    const rawTarget = match[1].trim();
    if (!rawTarget || rawTarget.startsWith("#") || /^(https?:|mailto:)/i.test(rawTarget)) continue;
    const withoutFragment = rawTarget.split("#", 1)[0].split("?", 1)[0];
    let decoded;
    try {
      decoded = decodeURIComponent(withoutFragment);
    } catch {
      errors.push(`${documentPath} contains an invalid encoded link: ${rawTarget}`);
      continue;
    }
    const absoluteTarget = path.resolve(root, path.dirname(documentPath), decoded);
    if (!fs.existsSync(absoluteTarget)) errors.push(`${documentPath} links to missing file ${rawTarget}.`);
  }
}
