import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { candidateLogoSchema } from "./pipeline-schema";

export const candidateLogoPrivateBucket = "atlas-private-intake";
export const candidateLogoPublicBucket = "atlas-public-media";

export function preparedCandidateLogo(record: unknown) {
  if (!record || typeof record !== "object" || !("candidateLogo" in record) || !record.candidateLogo) return null;
  const logo = candidateLogoSchema.parse(record.candidateLogo);
  if ((logo.status !== "ready" && logo.status !== "review_required") || !logo.storagePath) return null;
  if (logo.storagePath !== `candidate-logos/${logo.normalizedChecksum}.webp`) throw new Error("Candidate logo path does not match its checksum.");
  return { ...logo, storagePath: logo.storagePath };
}

export async function validateCandidateLogoBytes(bytes: Buffer, checksum: string) {
  if (bytes.length > 2_097_152 || createHash("sha256").update(bytes).digest("hex") !== checksum) {
    throw new Error("Candidate logo bytes differ from the reviewed image.");
  }
  const metadata = await sharp(bytes).metadata();
  if (metadata.format !== "webp" || !metadata.width || !metadata.height || metadata.width > 1024 || metadata.height > 512) {
    throw new Error("Candidate logo must be a bounded WebP.");
  }
}

export async function uploadCandidateLogo(client: SupabaseClient, bucket: string, storagePath: string, bytes: Buffer) {
  const { error } = await client.storage.from(bucket).upload(storagePath, bytes, {
    contentType: "image/webp", cacheControl: bucket === candidateLogoPublicBucket ? "31536000" : "0", upsert: false
  });
  if (!error) return;
  if (!/already exists|duplicate/i.test(error.message)) throw error;
  const { data, error: readError } = await client.storage.from(bucket).download(storagePath);
  if (readError || !data || !Buffer.from(await data.arrayBuffer()).equals(bytes)) {
    throw new Error("Existing logo object differs from the reviewed image.");
  }
}

/** Called only after the normal staff/approved-candidate checks at Publish. */
export async function prepareCandidateLogosForPublication(client: SupabaseClient, candidates: Array<{ proposed_record: unknown }>) {
  const prepared = new Map<string, { bytes: Buffer; checksum: string }>();
  for (const candidate of candidates) {
    const logo = preparedCandidateLogo(candidate.proposed_record);
    if (!logo || prepared.has(logo.storagePath)) continue;
    const { data, error } = await client.storage.from(candidateLogoPrivateBucket).download(logo.storagePath);
    if (error || !data) throw new Error("The reviewed logo is unavailable. Publication has not started.");
    const bytes = Buffer.from(await data.arrayBuffer());
    await validateCandidateLogoBytes(bytes, logo.normalizedChecksum);
    prepared.set(logo.storagePath, { bytes, checksum: logo.normalizedChecksum });
  }
  for (const [storagePath, { bytes }] of prepared) {
    await uploadCandidateLogo(client, candidateLogoPublicBucket, storagePath, bytes);
  }
  // Immutable uploads are retained on an uncertain RPC outcome. The database
  // attaches media only in the same transaction that publishes the candidate.
}
