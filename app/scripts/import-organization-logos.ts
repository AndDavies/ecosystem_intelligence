import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { loadScriptEnv } from "./load-env";

const executeFile = promisify(execFile);
const downloader = process.env.COMPANY_LOGO_DOWNLOADER_SCRIPT
  ?? path.join(os.homedir(), ".codex/skills/company-logo-downloader/scripts/download_company_logo.py");
const bucket = "atlas-public-media";

type Organization = { id: string; slug: string; name: string; website_url: string };
type ExistingLogo = { organization_id: string; storage_path: string | null; publication_status: string };
type LogoManifest = {
  ok: true;
  source_page_url: string;
  asset_url: string;
  selection_method: string;
  selection_detail: string;
  confidence: "high" | "medium" | "low";
  content_type: string;
  sha256: string;
  logo_path: string;
  manifest_path: string;
};
type ImportStatus = "published" | "would_publish" | "review_required" | "missing" | "failed" | "skipped";
type ImportResult = {
  organizationId: string;
  slug: string;
  name: string;
  websiteUrl: string;
  status: ImportStatus;
  confidence?: string;
  detectedConfidence?: string;
  sourcePageUrl?: string;
  sourceAssetUrl?: string;
  selectionMethod?: string;
  sourceChecksum?: string;
  normalizedChecksum?: string;
  storagePath?: string;
  localLogoPath?: string;
  localManifestPath?: string;
  note?: string;
};

const genericBrandWords = new Set([
  "aerospace", "association", "canada", "canadian", "capital", "centre", "center", "company", "corporation",
  "defence", "defense", "group", "industries", "industry", "innovation", "international", "marine", "services",
  "solutions", "systems", "technologies", "technology", "ventures"
]);
const connectorWords = new Set(["and", "of", "the"]);

function brandTokens(organization: Organization) {
  const words = `${organization.name} ${organization.slug.replaceAll("-", " ")}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const distinctive = [...new Set(words.filter((word) => word.length >= 3 && !genericBrandWords.has(word) && !connectorWords.has(word)))];
  const acronymWords = organization.slug.split("-").filter((word) => word.length && !connectorWords.has(word));
  const acronym = acronymWords.map((word) => word[0]).join("");
  return acronym.length >= 3 ? [...distinctive, acronym] : distinctive;
}

function effectiveConfidence(organization: Organization, manifest: LogoManifest): "high" | "medium" | "low" {
  let assetFile = manifest.asset_url.toLowerCase();
  try {
    assetFile = new URL(manifest.asset_url).pathname.toLowerCase();
  } catch {
    // Retain the raw asset URL for defensive filename checks.
  }
  if (/(?:favicon|apple-touch-icon|android-chrome|(?:^|\/)fav\.(?:png|jpe?g|webp|svg))(?:[^a-z]|$)/i.test(assetFile)) return "low";
  if (manifest.confidence !== "high") return manifest.confidence;
  if (manifest.selection_method === "organization_jsonld") return "high";
  let assetPath = manifest.asset_url;
  try {
    const pathName = new URL(manifest.asset_url).pathname;
    assetPath = pathName.split("/").filter(Boolean).at(-1) ?? pathName;
  } catch {
    // The downloader already required HTTP(S); retain the raw value only as a defensive fallback.
  }
  const plainDetail = manifest.selection_detail
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\S*\/\S*/g, " ");
  const withoutUrls = `${assetPath} ${plainDetail}`;
  let decoded = withoutUrls;
  try {
    decoded = decodeURIComponent(withoutUrls);
  } catch {
    // Malformed percent sequences should not turn a valid local packet into a failed run.
  }
  const candidateWords = decoded.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const matchesBrand = brandTokens(organization).some((token) =>
    candidateWords.some((candidate) => candidate === token || (token.length >= 4 && candidate.includes(token)))
  );
  return matchesBrand ? "high" : "medium";
}

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

async function createContactSheets(runDirectory: string, results: ImportResult[], status: "would_publish" | "review_required") {
  const selected = results.filter((item) => item.status === status && item.localLogoPath);
  const outputPaths: string[] = [];
  for (let start = 0; start < selected.length; start += 20) {
    const page = selected.slice(start, start + 20);
    const columns = 5;
    const cellWidth = 320;
    const cellHeight = 190;
    const rows = Math.ceil(page.length / columns);
    const composites: Array<{ input: Buffer; left: number; top: number }> = [];
    for (const [index, item] of page.entries()) {
      const image = await sharp(item.localLogoPath)
        .resize({ width: 280, height: 125, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      const metadata = await sharp(image).metadata();
      const column = index % columns;
      const row = Math.floor(index / columns);
      composites.push({ input: image, left: column * cellWidth + Math.round((cellWidth - (metadata.width ?? 280)) / 2), top: row * cellHeight + 8 });
      composites.push({
        input: Buffer.from(`<svg width="300" height="42" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="42" rx="6" fill="#ffffff"/><text x="150" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#242827">${escapeXml(item.slug)}</text></svg>`),
        left: column * cellWidth + 10,
        top: row * cellHeight + 140
      });
    }
    const outputPath = path.join(runDirectory, `${status}-contact-sheet-${Math.floor(start / 20) + 1}.jpg`);
    await sharp({ create: { width: columns * cellWidth, height: rows * cellHeight, channels: 4, background: "#bfc2c0" } })
      .composite(composites)
      .jpeg({ quality: 90 })
      .toFile(outputPath);
    outputPaths.push(outputPath);
  }
  return outputPaths;
}

type Options = {
  apply: boolean;
  concurrency: number;
  deferSlugs: string[];
  limit: number | null;
  runId: string;
  slug: string | null;
};

function parseOptions(): Options {
  const args = process.argv.slice(2);
  const value = (name: string) => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const concurrency = Number(value("--concurrency") ?? "4");
  const limitValue = value("--limit");
  const runId = value("--run-id") ?? new Date().toISOString().replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z");
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) throw new Error("--concurrency must be an integer from 1 to 8");
  if (limitValue && (!Number.isInteger(Number(limitValue)) || Number(limitValue) < 1)) throw new Error("--limit must be a positive integer");
  return {
    apply: args.includes("--apply"),
    concurrency,
    deferSlugs: (value("--defer") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
    limit: limitValue ? Number(limitValue) : null,
    runId,
    slug: value("--slug") ?? null
  };
}

function clientFor(options: Options) {
  loadScriptEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = options.apply
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error(`Missing ${options.apply ? "production service-role" : "public database"} configuration.`);
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function normalizeLogo(inputPath: string, outputPath: string) {
  const normalized = await sharp(inputPath)
    .rotate()
    .resize({ width: 1024, height: 512, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 92, alphaQuality: 100 })
    .toBuffer();
  const metadata = await sharp(normalized).metadata();
  if (!metadata.width || !metadata.height || metadata.width > 1024 || metadata.height > 512 || metadata.format !== "webp") {
    throw new Error("Normalized asset failed WebP dimension validation.");
  }
  await writeFile(outputPath, normalized);
  return { normalized, checksum: createHash("sha256").update(normalized).digest("hex"), width: metadata.width, height: metadata.height };
}

async function downloadOfficialLogo(organization: Organization, organizationDirectory: string): Promise<LogoManifest> {
  await mkdir(organizationDirectory, { recursive: true });
  const manifestPath = path.join(organizationDirectory, "logo.source.json");
  try {
    const stored = JSON.parse(await readFile(manifestPath, "utf8")) as LogoManifest;
    if (stored.ok && stored.logo_path) {
      await readFile(stored.logo_path);
      return stored;
    }
  } catch {
    // A missing or incomplete local packet is safe to regenerate.
  }
  const { stdout } = await executeFile("python3", [
    downloader,
    organization.website_url,
    "--output-dir", organizationDirectory,
    "--basename", "logo",
    "--min-confidence", "medium",
    "--overwrite"
  ], { maxBuffer: 4 * 1024 * 1024, timeout: 45_000 });
  const manifest = JSON.parse(stdout) as LogoManifest;
  if (!manifest.ok || !manifest.logo_path || !manifest.manifest_path) throw new Error("Downloader returned an incomplete source packet.");
  return manifest;
}

async function publishHighConfidenceLogo(
  supabase: SupabaseClient,
  organization: Organization,
  manifest: LogoManifest,
  normalized: Buffer,
  checksum: string,
  storagePath: string,
  runId: string
) {
  const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, normalized, {
    cacheControl: "31536000",
    contentType: "image/webp",
    upsert: false
  });
  const uploadedNow = !uploadError;
  if (uploadError && !uploadError.message.toLowerCase().includes("already exists")) throw uploadError;

  const { data, error } = await supabase.rpc("import_published_organization_logo", {
    p_organization_id: organization.id,
    p_storage_path: storagePath,
    p_source_page_url: manifest.source_page_url,
    p_source_asset_url: manifest.asset_url,
    p_selection_method: manifest.selection_method,
    p_confidence: manifest.confidence,
    p_checksum: checksum,
    p_attribution_text: `${organization.name} official logo`,
    p_run_id: runId
  });
  if (error) {
    if (uploadedNow) await supabase.storage.from(bucket).remove([storagePath]);
    throw error;
  }
  const archivedPaths = Array.isArray(data?.archived_paths)
    ? data.archived_paths.filter((item: unknown): item is string => typeof item === "string" && item !== storagePath)
    : [];
  if (archivedPaths.length) await supabase.storage.from(bucket).remove(archivedPaths);
}

async function processOrganization(
  organization: Organization,
  existingPath: string | null,
  supabase: SupabaseClient,
  options: Options,
  runDirectory: string
): Promise<ImportResult> {
  const base: Omit<ImportResult, "status"> = {
    organizationId: organization.id,
    slug: organization.slug,
    name: organization.name,
    websiteUrl: organization.website_url
  };
  const organizationDirectory = path.join(runDirectory, organization.slug);
  try {
    const manifest = await downloadOfficialLogo(organization, organizationDirectory);
    const normalizedPath = path.join(organizationDirectory, "logo.normalized.webp");
    const { normalized, checksum, width, height } = await normalizeLogo(manifest.logo_path, normalizedPath);
    const storagePath = `organizations/${organization.id}/logos/${checksum}.webp`;
    let confidence = effectiveConfidence(organization, manifest);
    const confidenceReasons: string[] = [];
    if (confidence !== manifest.confidence) confidenceReasons.push("the selected page image did not clearly identify the organization or was a favicon");
    if (confidence === "high" && (width < 80 || height < 24)) {
      confidence = "medium";
      confidenceReasons.push("the official asset is too small for a crisp profile mark");
    }
    if (confidence === "high" && options.deferSlugs.includes(organization.slug)) {
      confidence = "medium";
      confidenceReasons.push("the visual quality review found a legacy, parent-brand, or otherwise ambiguous mark");
    }
    const confidenceNote = confidenceReasons.length ? `; downgraded because ${confidenceReasons.join(" and ")}` : "";
    const details = {
      ...base,
      confidence,
      detectedConfidence: manifest.confidence,
      sourcePageUrl: manifest.source_page_url,
      sourceAssetUrl: manifest.asset_url,
      selectionMethod: manifest.selection_method,
      sourceChecksum: manifest.sha256,
      normalizedChecksum: checksum,
      storagePath,
      localLogoPath: normalizedPath,
      localManifestPath: manifest.manifest_path,
      note: `${width}x${height} transparent-capable WebP${confidenceNote}`
    };

    if (confidence === "medium") return { ...details, status: "review_required" };
    if (confidence !== "high") return { ...details, status: "missing", note: "Low-confidence marks and favicons are not accepted." };
    if (existingPath === storagePath) return { ...details, status: "skipped", note: "Published checksum already matches." };
    if (!options.apply) return { ...details, status: "would_publish" };
    await publishHighConfidenceLogo(supabase, organization, manifest, normalized, checksum, storagePath, options.runId);
    return { ...details, status: "published" };
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : error && typeof error === "object"
        ? JSON.stringify(error)
        : String(error);
    const noCandidate = /No acceptable official-logo candidate found|returned non-zero|Could not read official website/i.test(message);
    return { ...base, status: noCandidate ? "missing" : "failed", note: message.slice(0, 800) };
  }
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, operation: (item: T, index: number) => Promise<R>) {
  const results = new Array<R>(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await operation(items[index], index);
    }
  }));
  return results;
}

function markdownReport(options: Options, results: ImportResult[]) {
  const counts = Object.fromEntries(["published", "would_publish", "review_required", "missing", "failed", "skipped"].map((status) => [status, results.filter((item) => item.status === status).length]));
  const lines = [
    "# Organization logo import report",
    "",
    `- Run: \`${options.runId}\``,
    `- Mode: ${options.apply ? "applied to production" : "dry run"}`,
    `- Organizations inspected: ${results.length}`,
    `- Published: ${counts.published}`,
    `- Ready to publish: ${counts.would_publish}`,
    `- Needs editorial review: ${counts.review_required}`,
    `- Already current: ${counts.skipped}`,
    `- Missing: ${counts.missing}`,
    `- Failed: ${counts.failed}`,
    "",
    "| Organization | Result | Confidence | Source | Note |",
    "| --- | --- | --- | --- | --- |",
    ...results.map((item) => `| ${item.name.replaceAll("|", "\\|")} | ${item.status} | ${item.confidence ?? "-"} | ${item.sourcePageUrl ? `[official page](${item.sourcePageUrl})` : "-"} | ${(item.note ?? "").replaceAll("|", "\\|").replaceAll("\n", " ")} |`),
    ""
  ];
  return lines.join("\n");
}

async function main() {
  const options = parseOptions();
  const supabase = clientFor(options);
  const runDirectory = path.resolve("../research/ingestion/local/logo-import", options.runId);
  await mkdir(runDirectory, { recursive: true });

  let organizationsQuery = supabase
    .from("organizations")
    .select("id, slug, name, website_url")
    .eq("publication_status", "published")
    .not("website_url", "is", null)
    .order("name");
  if (options.slug) organizationsQuery = organizationsQuery.eq("slug", options.slug);
  if (options.limit) organizationsQuery = organizationsQuery.limit(options.limit);
  const [{ data: organizations, error: organizationError }, { data: existingLogos, error: logoError }] = await Promise.all([
    organizationsQuery,
    supabase.from("media_assets").select("organization_id, storage_path, publication_status").eq("asset_type", "logo").eq("approval_status", "approved").eq("publication_status", "published")
  ]);
  if (organizationError) throw organizationError;
  if (logoError) throw logoError;
  const targets = (organizations ?? []).filter((item): item is Organization => typeof item.website_url === "string");
  const currentPaths = new Map(((existingLogos ?? []) as ExistingLogo[]).map((item) => [item.organization_id, item.storage_path]));
  console.log(`Inspecting ${targets.length} published organizations in ${options.apply ? "apply" : "dry-run"} mode.`);

  const results = await mapWithConcurrency(targets, options.concurrency, async (organization, index) => {
    const result = await processOrganization(organization, currentPaths.get(organization.id) ?? null, supabase, options, runDirectory);
    console.log(`[${index + 1}/${targets.length}] ${organization.slug}: ${result.status}`);
    return result;
  });
  const report = { generatedAt: new Date().toISOString(), options, counts: Object.fromEntries(["published", "would_publish", "review_required", "missing", "failed", "skipped"].map((status) => [status, results.filter((item) => item.status === status).length])), results };
  const [publishSheets, reviewSheets] = await Promise.all([
    createContactSheets(runDirectory, results, "would_publish"),
    createContactSheets(runDirectory, results, "review_required")
  ]);
  const reportWithReviewAssets = { ...report, contactSheets: { ready: publishSheets, review: reviewSheets } };
  await Promise.all([
    writeFile(path.join(runDirectory, "report.json"), `${JSON.stringify(reportWithReviewAssets, null, 2)}\n`),
    writeFile(path.join(runDirectory, "report.md"), markdownReport(options, results))
  ]);
  console.log(JSON.stringify({ runDirectory, ...report.counts }, null, 2));
  if (results.some((item) => item.status === "failed")) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
