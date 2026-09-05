import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import { researchCandidateBatchV2Schema, type OrganizationBundleV2, type OrganizationBundleV3 } from "../src/lib/research/pipeline-schema";
import { boundedMapByKey } from "../src/lib/research/bounded-map";
import { mergeLogoResults, needsLogoRecovery, officialLogoSourcePages } from "../src/lib/research/logo-recovery";

const executeFile = promisify(execFile);
const downloader = process.env.COMPANY_LOGO_DOWNLOADER_SCRIPT
  ?? path.join(os.homedir(), ".codex/skills/company-logo-downloader/scripts/download_company_logo.py");
const workspaceRoot = path.resolve(process.cwd(), "..");
const localPacketRoot = path.join(workspaceRoot, "research/ingestion/local/candidate-logos");
const packetRoot = path.join(workspaceRoot, "research/ingestion/local/candidate-logo-packets-v1");

type OrganizationLogoCandidate = OrganizationBundleV2 | OrganizationBundleV3;
type CandidateLogo = NonNullable<OrganizationLogoCandidate["candidateLogo"]>;
type LogoResult = { candidateId: string; organizationName: string; logo: CandidateLogo };
const defaultLogoConcurrency = 4;
const maximumLogoConcurrency = 8;
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

function candidateHost(candidate: OrganizationLogoCandidate) {
  try {
    return new URL(candidate.organization.websiteUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return candidate.organization.websiteUrl;
  }
}

async function prepareLogo(candidate: OrganizationLogoCandidate, runId: string, additionalPages: string[] = []): Promise<LogoResult> {
  const directory = path.join(localPacketRoot, runId, candidate.candidateId);
  await mkdir(directory, { recursive: true });
  const checkedAt = new Date().toISOString();
  const failures: string[] = [];
  for (const sourcePage of officialLogoSourcePages(candidate.organization.websiteUrl, [...additionalPages, ...candidate.sources.map((source) => source.url)])) {
    try {
      const { stdout } = await executeFile("python3", [
        downloader,
        sourcePage,
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
      const failure = conciseFailure(error);
      failures.push(`${sourcePage}: ${failure}`);
      if (/\b429\b|too many requests|rate limit/i.test(failure)) break;
    }
  }
  return {
    candidateId: candidate.candidateId,
    organizationName: candidate.organization.name,
    logo: { status: "not_found", checkedAt, note: failures.join("; ").slice(0, 1000) }
  };
}

async function atomicJson(filePath: string, value: unknown) {
  const temporary = `${filePath}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await rename(temporary, filePath);
  } finally {
    await rm(temporary, { force: true });
  }
}

async function prepareBatch() {
  const candidatePath = option("--candidates");
  const runId = option("--run");
  if (!candidatePath || !runId) throw new Error("Usage: pnpm research:logos -- --run <run-id> --candidates <candidate-batch> [--retry-missing] --apply");
  const resolvedCandidatePath = path.resolve(workspaceRoot, candidatePath);
  const parsed = researchCandidateBatchV2Schema.parse(JSON.parse(await readFile(resolvedCandidatePath, "utf8")));
  if (parsed.runId !== runId) throw new Error(`Candidate batch run '${parsed.runId}' does not match --run '${runId}'.`);

  const requestedConcurrency = Number(option("--concurrency") ?? defaultLogoConcurrency);
  if (!Number.isInteger(requestedConcurrency) || requestedConcurrency < 1 || requestedConcurrency > maximumLogoConcurrency) {
    throw new Error(`--concurrency must be an integer from 1 to ${maximumLogoConcurrency}.`);
  }
  const sourcePagesPath = option("--source-pages");
  const sourcePages: Record<string, string[]> = sourcePagesPath
    ? JSON.parse(await readFile(path.resolve(workspaceRoot, sourcePagesPath), "utf8")) : {};
  if (!sourcePages || typeof sourcePages !== "object" || Array.isArray(sourcePages)
    || Object.entries(sourcePages).some(([id, urls]) => !parsed.candidates.some((candidate) => candidate.candidateId === id)
      || !Array.isArray(urls) || urls.some((url) => typeof url !== "string"))) {
    throw new Error("--source-pages must map known candidate IDs to arrays of observed official page URLs.");
  }
  const logoCandidates = parsed.candidates
    .filter((candidate): candidate is OrganizationLogoCandidate => candidate.candidateKind === "organization_bundle" && needsLogoRecovery(candidate.candidateLogo?.status, process.argv.includes("--retry-missing")));
  const results = await boundedMapByKey(
    logoCandidates,
    requestedConcurrency,
    candidateHost,
    (candidate) => prepareLogo(candidate, runId, sourcePages[candidate.candidateId])
  );
  const updated = {
    ...parsed,
    candidates: parsed.candidates.map((candidate) => {
      const result = results.find((item) => item.candidateId === candidate.candidateId);
      return result && candidate.candidateKind === "organization_bundle" ? { ...candidate, candidateLogo: result.logo } : candidate;
    })
  };
  researchCandidateBatchV2Schema.parse(updated);
  const packetPath = path.join(packetRoot, `${parsed.batchId}.json`);
  let previousResults: LogoResult[] = [];
  try {
    const previous = JSON.parse(await readFile(packetPath, "utf8"));
    if (previous.runId !== runId || previous.batchId !== parsed.batchId || !Array.isArray(previous.results)) {
      throw new Error("Existing private logo packet does not match this run and batch.");
    }
    previousResults = previous.results;
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error;
  }
  const packet = {
    schemaVersion: "research_candidate_logo_packet_v1",
    runId,
    batchId: parsed.batchId,
    generatedAt: new Date().toISOString(),
    writePolicy: "private_candidate_artifacts_only",
    executionPolicy: {
      globalConcurrency: requestedConcurrency,
      perHostConcurrency: 1,
      cachePolicy: "preserve_existing_dispositions_retry_not_found_only_when_requested",
      retryTelemetry: "retained_in_downloader_manifest_or_candidate_failure_note"
    },
    results: mergeLogoResults(previousResults, results)
  };
  if (results.length > 0) {
    await mkdir(packetRoot, { recursive: true });
    await atomicJson(packetPath, packet);
    if (process.argv.includes("--apply")) await atomicJson(resolvedCandidatePath, updated);
  }
  const counts = Object.fromEntries(["ready", "review_required", "not_found"].map((status) => [status, results.filter((item) => item.logo.status === status).length]));
  console.log(JSON.stringify({ candidateBatch: relative(resolvedCandidatePath), candidateLogoPacket: results.length > 0 ? relative(packetPath) : null, applied: process.argv.includes("--apply") && results.length > 0, skippedExisting: logoCandidates.length === 0, ...counts }, null, 2));
}

async function main() {
  const candidatePath = option("--candidates");
  if (!candidatePath) throw new Error("--candidates is required.");
  const lock = `${path.resolve(workspaceRoot, candidatePath)}.logos.lock`;
  try {
    await mkdir(lock);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") {
      throw new Error(`Logo preparation is locked: ${lock}. Resume after the active writer completes; inspect an interrupted lock before removing it.`);
    }
    throw error;
  }
  try {
    await prepareBatch();
  } finally {
    await rm(lock, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
