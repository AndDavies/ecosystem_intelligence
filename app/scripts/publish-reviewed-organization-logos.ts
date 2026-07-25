import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { loadScriptEnv } from "./load-env";

const bucket = "atlas-public-media";
const canonicalReviewerId = "b443c433-2a78-4ca7-8a19-a8f40b140049";
const explicitFavicon = /(?:favicon|apple-touch-icon|android-chrome|(?:^|\/)fav\.(?:png|jpe?g|webp|svg))(?:[^a-z]|$)/i;

type ReviewCandidate = {
  organizationId: string;
  slug: string;
  name: string;
  status: string;
  confidence?: string;
  sourcePageUrl?: string;
  sourceAssetUrl?: string;
  selectionMethod?: string;
  sourceChecksum?: string;
  normalizedChecksum?: string;
  storagePath?: string;
  localLogoPath?: string;
  localManifestPath?: string;
};

type SourceManifest = {
  ok: boolean;
  source_page_url: string;
  asset_url: string;
  selection_method: string;
  confidence: string;
  sha256: string;
};

type ApprovalResult = {
  slug: string;
  name: string;
  status: "published" | "would_publish" | "skipped" | "excluded" | "failed";
  storagePath?: string;
  note: string;
};

type Options = {
  apply: boolean;
  exclude: Set<string>;
  reportPath: string;
  reviewNote: string;
  runId: string;
};

function parseOptions(): Options {
  const args = process.argv.slice(2);
  const value = (name: string) => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const reportPath = value("--report");
  if (!reportPath) throw new Error("--report is required.");
  const reviewNote = value("--review-note") ?? "Andrew Davies visually reviewed and approved this official-site mark for publication on 2026-07-25.";
  if (reviewNote.trim().length < 10) throw new Error("--review-note must contain at least 10 characters.");
  return {
    apply: args.includes("--apply"),
    exclude: new Set((value("--exclude") ?? "").split(",").map((item) => item.trim()).filter(Boolean)),
    reportPath: path.resolve(reportPath),
    reviewNote: reviewNote.trim(),
    runId: value("--run-id") ?? `reviewed-logo-approval-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}`
  };
}

function databaseClient(apply: boolean) {
  loadScriptEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = apply
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error(`Missing ${apply ? "service-role" : "public"} database configuration.`);
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function validateCandidate(candidate: ReviewCandidate) {
  if (candidate.status !== "review_required" || candidate.confidence !== "medium") throw new Error("The source report row is not a medium-confidence review candidate.");
  if (!candidate.sourcePageUrl?.startsWith("https://") || !candidate.sourceAssetUrl?.startsWith("https://")) throw new Error("Official HTTPS source URLs are required.");
  if (explicitFavicon.test(new URL(candidate.sourceAssetUrl).pathname.toLowerCase())) throw new Error("Explicit favicon assets remain ineligible after review.");
  if (!candidate.normalizedChecksum?.match(/^[0-9a-f]{64}$/) || !candidate.localLogoPath || !candidate.localManifestPath) throw new Error("The local normalized asset or provenance packet is incomplete.");
  const expectedPath = `organizations/${candidate.organizationId}/logos/${candidate.normalizedChecksum}.webp`;
  if (candidate.storagePath !== expectedPath) throw new Error("The immutable storage path does not match the reviewed checksum.");

  const [normalized, manifestText] = await Promise.all([readFile(candidate.localLogoPath), readFile(candidate.localManifestPath, "utf8")]);
  const checksum = createHash("sha256").update(normalized).digest("hex");
  if (checksum !== candidate.normalizedChecksum) throw new Error("The reviewed normalized asset changed after the report was generated.");
  const metadata = await sharp(normalized).metadata();
  if (metadata.format !== "webp" || !metadata.width || !metadata.height || metadata.width > 1024 || metadata.height > 512) throw new Error("The reviewed asset is not a valid normalized WebP.");

  const manifest = JSON.parse(manifestText) as SourceManifest;
  if (!manifest.ok || manifest.source_page_url !== candidate.sourcePageUrl || manifest.asset_url !== candidate.sourceAssetUrl || manifest.selection_method !== candidate.selectionMethod || manifest.sha256 !== candidate.sourceChecksum) {
    throw new Error("The source manifest no longer matches the reviewed report row.");
  }
  return normalized;
}

async function publishCandidate(supabase: SupabaseClient, candidate: ReviewCandidate, normalized: Buffer, options: Options) {
  const storagePath = candidate.storagePath!;
  const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, normalized, { cacheControl: "31536000", contentType: "image/webp", upsert: false });
  const uploadedNow = !uploadError;
  if (uploadError && !uploadError.message.toLowerCase().includes("already exists")) throw uploadError;

  const { data, error } = await supabase.rpc("import_reviewed_organization_logo", {
    p_organization_id: candidate.organizationId,
    p_reviewer_id: canonicalReviewerId,
    p_storage_path: storagePath,
    p_source_page_url: candidate.sourcePageUrl,
    p_source_asset_url: candidate.sourceAssetUrl,
    p_selection_method: candidate.selectionMethod,
    p_confidence: "medium",
    p_checksum: candidate.normalizedChecksum,
    p_attribution_text: `${candidate.name} official logo`,
    p_review_note: options.reviewNote,
    p_run_id: options.runId
  });
  if (error) {
    if (uploadedNow) await supabase.storage.from(bucket).remove([storagePath]);
    throw error;
  }
  const archivedPaths = Array.isArray(data?.archived_paths) ? data.archived_paths.filter((item: unknown): item is string => typeof item === "string" && item !== storagePath) : [];
  if (archivedPaths.length) await supabase.storage.from(bucket).remove(archivedPaths);
}

function markdownReport(options: Options, results: ApprovalResult[]) {
  const counts = Object.fromEntries(["published", "would_publish", "skipped", "excluded", "failed"].map((status) => [status, results.filter((item) => item.status === status).length]));
  return [
    "# Reviewed organization logo publication",
    "",
    `- Run: \`${options.runId}\``,
    `- Mode: ${options.apply ? "applied to production" : "dry run"}`,
    `- Published: ${counts.published}`,
    `- Ready: ${counts.would_publish}`,
    `- Already current: ${counts.skipped}`,
    `- Excluded: ${counts.excluded}`,
    `- Failed: ${counts.failed}`,
    "",
    "| Organization | Result | Note |",
    "| --- | --- | --- |",
    ...results.map((item) => `| ${item.name.replaceAll("|", "\\|")} | ${item.status} | ${item.note.replaceAll("|", "\\|")} |`),
    ""
  ].join("\n");
}

async function main() {
  const options = parseOptions();
  const supabase = databaseClient(options.apply);
  const sourceReport = JSON.parse(await readFile(options.reportPath, "utf8")) as { results?: ReviewCandidate[] };
  const candidates = (sourceReport.results ?? []).filter((candidate) => candidate.status === "review_required");
  if (!candidates.length) throw new Error("The source report contains no review candidates.");

  const candidateIds = candidates.map((candidate) => candidate.organizationId);
  const [{ data: organizations, error: organizationError }, { data: activeLogos, error: logoError }] = await Promise.all([
    supabase.from("organizations").select("id, slug").in("id", candidateIds).eq("publication_status", "published"),
    supabase.from("media_assets").select("organization_id, storage_path").in("organization_id", candidateIds).eq("asset_type", "logo").eq("approval_status", "approved").eq("publication_status", "published")
  ]);
  if (organizationError) throw organizationError;
  if (logoError) throw logoError;
  const liveOrganizations = new Map((organizations ?? []).map((organization) => [organization.id, organization.slug]));
  const activePaths = new Map((activeLogos ?? []).map((asset) => [asset.organization_id, asset.storage_path]));

  const results: ApprovalResult[] = [];
  for (const [index, candidate] of candidates.entries()) {
    const base = { slug: candidate.slug, name: candidate.name };
    try {
      if (options.exclude.has(candidate.slug)) {
        results.push({ ...base, status: "excluded", note: "Explicitly excluded from the administrator-approved batch." });
        console.log(`[${index + 1}/${candidates.length}] ${candidate.slug}: excluded`);
        continue;
      }
      if (liveOrganizations.get(candidate.organizationId) !== candidate.slug) throw new Error("The reviewed organization no longer matches the live canonical record.");
      const normalized = await validateCandidate(candidate);
      if (activePaths.get(candidate.organizationId) === candidate.storagePath) {
        results.push({ ...base, status: "skipped", storagePath: candidate.storagePath, note: "Published checksum already matches." });
        console.log(`[${index + 1}/${candidates.length}] ${candidate.slug}: skipped`);
        continue;
      }
      if (!options.apply) {
        results.push({ ...base, status: "would_publish", storagePath: candidate.storagePath, note: "Reviewed packet and live canonical record validated." });
        console.log(`[${index + 1}/${candidates.length}] ${candidate.slug}: would_publish`);
        continue;
      }
      await publishCandidate(supabase, candidate, normalized, options);
      results.push({ ...base, status: "published", storagePath: candidate.storagePath, note: "Published with medium confidence and explicit administrator review." });
      console.log(`[${index + 1}/${candidates.length}] ${candidate.slug}: published`);
    } catch (error) {
      const note = error instanceof Error ? error.message : error && typeof error === "object" ? JSON.stringify(error) : String(error);
      results.push({ ...base, status: "failed", note: note.slice(0, 800) });
      console.log(`[${index + 1}/${candidates.length}] ${candidate.slug}: failed`);
    }
  }

  const outputDirectory = path.resolve("../research/ingestion/local/logo-import", options.runId);
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(path.join(outputDirectory, "approval-report.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), options: { ...options, exclude: [...options.exclude] }, results }, null, 2)}\n`),
    writeFile(path.join(outputDirectory, "approval-report.md"), markdownReport(options, results))
  ]);
  const counts = Object.fromEntries(["published", "would_publish", "skipped", "excluded", "failed"].map((status) => [status, results.filter((item) => item.status === status).length]));
  console.log(JSON.stringify({ outputDirectory, counts }, null, 2));
  if (results.some((item) => item.status === "failed")) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
