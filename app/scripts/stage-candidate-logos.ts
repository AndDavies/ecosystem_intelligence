import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { candidateLogoPrivateBucket, preparedCandidateLogo, uploadCandidateLogo, validateCandidateLogoBytes } from "../src/lib/research/candidate-logo-storage";

export async function stageCandidateLogos(client: SupabaseClient, workspaceRoot: string, candidates: unknown[]) {
  for (const candidate of candidates) {
    const record = candidate as { proposed_record?: unknown };
    const logo = preparedCandidateLogo(record.proposed_record);
    if (!logo) continue;
    const root = await realpath(path.join(workspaceRoot, "research/ingestion/local/candidate-logos"));
    const manifestPath = await realpath(path.resolve(workspaceRoot, logo.packetPath));
    const imagePath = await realpath(path.join(path.dirname(manifestPath), "logo.normalized.webp"));
    if (![manifestPath, imagePath].every((file) => file.startsWith(`${root}${path.sep}`))) throw new Error("Candidate logo must come from its private research packet.");
    const [manifestText, bytes] = await Promise.all([readFile(manifestPath, "utf8"), readFile(imagePath)]);
    const manifest = JSON.parse(manifestText);
    if (!manifest.ok || manifest.sha256 !== logo.sourceChecksum || manifest.source_page_url !== logo.sourcePageUrl || manifest.asset_url !== logo.sourceAssetUrl) {
      throw new Error("Candidate logo provenance differs from the research packet.");
    }
    await validateCandidateLogoBytes(bytes, logo.normalizedChecksum);
    await uploadCandidateLogo(client, candidateLogoPrivateBucket, logo.storagePath, bytes);
  }
}
