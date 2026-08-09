import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import { researchCandidateBatchV2Schema, type OrganizationBundleV2, type OrganizationBundleV3 } from "../src/lib/research/pipeline-schema";

const executeFile = promisify(execFile);
const downloader = process.env.COMPANY_LOGO_DOWNLOADER_SCRIPT
  ?? path.join(os.homedir(), ".codex/skills/company-logo-downloader/scripts/download_company_logo.py");
const workspaceRoot = path.resolve(process.cwd(), "..");
const localPacketRoot = path.join(workspaceRoot, "research/ingestion/local/candidate-logos");
const packetRoot = path.join(workspaceRoot, "research/ingestion/local/candidate-logo-packets-v1");

type OrganizationLogoCandidate = OrganizationBundleV2 | OrganizationBundleV3;
type CandidateLogo = NonNullable<OrganizationLogoCandidate["candidateLogo"]>;
type LogoResult = { candidateId: string; organizationName: string; logo: CandidateLogo };
const genericBrandWords = new Set(["and", "applied", "canada", "canadian", "centre", "center", "for", "in", "institute", "laboratory", "of", "research", "the", "technologies", "technology"]);

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function relative(value: string) {
  return path.relative(workspaceRoot, value);
}

async function normalizeLogo(inputPath: string, outputPath: string) {
  const output = await sharp(inputPath)
    .rotate()
    .resize({ width: 1024, height: 512, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 92, alphaQuality: 100 })
    .toBuffer();
  const metadata = await sharp(output).metadata();
  if (metadata.format !== "webp" || !metadata.width || !metadata.height || metadata.width > 1024 || metadata.height > 512) {
    throw new Error("Normalized logo is not a valid bounded WebP.");
  }
  await writeFile(outputPath, output);
  return { checksum: createHash("sha256").update(output).digest("hex"), width: metadata.width, height: metadata.height };
}

function brandTokens(candidate: OrganizationLogoCandidate) {
  return [...new Set(`${candidate.organization.name} ${candidate.organization.slug}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !genericBrandWords.has(token)))];
}

function logoConfidence(candidate: OrganizationLogoCandidate, result: { confidence?: "high" | "medium" | "low"; asset_url?: string; selection_detail?: string }) {
  if (result.confidence !== "high") return result.confidence;
  const hint = `${result.asset_url ?? ""} ${result.selection_detail ?? ""}`.toLowerCase();
  return brandTokens(candidate).some((token) => hint.includes(token)) ? "high" : "medium";
}

function conciseFailure(error: unknown) {
  const output = error && typeof error === "object" && "stdout" in error && typeof error.stdout === "string" ? error.stdout : "";
  const message = error instanceof Error ? error.message : String(error);
  try {
    const parsed = JSON.parse(output) as { error?: unknown };
    if (typeof parsed.error === "string") return parsed.error;
  } catch {
    // Retain a generic error below when the downloader did not emit its JSON contract.
  }
  const errorMatch = `${output}\n${message}`.match(/"error"\s*:\s*"([^\"]+)/);
  if (errorMatch?.[1]) return errorMatch[1];
  return message.replace(/^Command failed:[\s\S]*?\n(?=\{)/, "").replace(/\s+/g, " ").slice(0, 500);
}

async function prepareLogo(candidate: OrganizationLogoCandidate, runId: string): Promise<LogoResult> {
  const directory = path.join(localPacketRoot, runId, candidate.candidateId);
  await mkdir(directory, { recursive: true });
  const checkedAt = new Date().toISOString();
  try {
    const { stdout } = await executeFile("python3", [
      downloader,
      candidate.organization.websiteUrl,
      "--output-dir", directory,
      "--basename", "logo",
      "--min-confidence", "medium",
      "--overwrite"
    ], { maxBuffer: 4 * 1024 * 1024, timeout: 45_000 });
    const result = JSON.parse(stdout) as {
      ok?: boolean; source_page_url?: string; asset_url?: string; selection_method?: string; selection_detail?: string; confidence?: "high" | "medium" | "low";
      sha256?: string; logo_path?: string; manifest_path?: string;
    };
    if (!result.ok || !result.logo_path || !result.manifest_path || !result.source_page_url?.startsWith("https://") || !result.asset_url?.startsWith("https://") || !result.selection_method || !result.sha256?.match(/^[a-f0-9]{64}$/) || !["high", "medium"].includes(result.confidence ?? "")) {
      throw new Error("No eligible high- or medium-confidence official logo was returned.");
    }
    const normalizedPath = path.join(directory, "logo.normalized.webp");
    const normalized = await normalizeLogo(result.logo_path, normalizedPath);
    const confidence = logoConfidence(candidate, result);
    if (!confidence || confidence === "low") throw new Error("The official-site result was low confidence or did not identify the candidate organization.");
    const status = confidence === "high" ? "ready" : "review_required";
    return {
      candidateId: candidate.candidateId,
      organizationName: candidate.organization.name,
      logo: {
        status,
        confidence,
        sourcePageUrl: result.source_page_url,
        sourceAssetUrl: result.asset_url,
        selectionMethod: result.selection_method,
        sourceChecksum: result.sha256,
        normalizedChecksum: normalized.checksum,
        packetPath: relative(result.manifest_path),
        note: `${normalized.width}x${normalized.height} normalized WebP retained in the private candidate packet.`
      } as CandidateLogo
    };
  } catch (error) {
    return {
      candidateId: candidate.candidateId,
      organizationName: candidate.organization.name,
      logo: { status: "not_found", checkedAt, note: conciseFailure(error) }
    };
  }
}

async function main() {
  const candidatePath = option("--candidates");
  const runId = option("--run");
  if (!candidatePath || !runId) throw new Error("Usage: pnpm research:logos -- --run <run-id> --candidates <candidate-batch> --apply");
  const resolvedCandidatePath = path.resolve(workspaceRoot, candidatePath);
  const parsed = researchCandidateBatchV2Schema.parse(JSON.parse(await readFile(resolvedCandidatePath, "utf8")));
  if (parsed.runId !== runId) throw new Error(`Candidate batch run '${parsed.runId}' does not match --run '${runId}'.`);

  const results = await Promise.all(parsed.candidates
    .filter((candidate): candidate is OrganizationLogoCandidate => candidate.candidateKind === "organization_bundle")
    .map((candidate) => prepareLogo(candidate, runId)));
  const updated = {
    ...parsed,
    candidates: parsed.candidates.map((candidate) => {
      const result = results.find((item) => item.candidateId === candidate.candidateId);
      return result && candidate.candidateKind === "organization_bundle" ? { ...candidate, candidateLogo: result.logo } : candidate;
    })
  };
  researchCandidateBatchV2Schema.parse(updated);
  const packet = {
    schemaVersion: "research_candidate_logo_packet_v1",
    runId,
    batchId: parsed.batchId,
    generatedAt: new Date().toISOString(),
    writePolicy: "private_candidate_artifacts_only",
    results
  };
  const packetPath = path.join(packetRoot, `${parsed.batchId}.json`);
  await mkdir(packetRoot, { recursive: true });
  await writeFile(packetPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  if (process.argv.includes("--apply")) await writeFile(resolvedCandidatePath, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
  const counts = Object.fromEntries(["ready", "review_required", "not_found"].map((status) => [status, results.filter((item) => item.logo.status === status).length]));
  console.log(JSON.stringify({ candidateBatch: relative(resolvedCandidatePath), candidateLogoPacket: relative(packetPath), applied: process.argv.includes("--apply"), ...counts }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
