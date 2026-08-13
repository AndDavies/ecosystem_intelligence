import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const dossierReleaseProbeHeader = "x-tnm-dossier-release-probe";
export const dossierReleaseProbeMaxAgeMs = 2 * 60 * 1000;
const dossierReleaseProbeClockSkewMs = 15 * 1000;
const dossierReleaseProbeDerivationContext = "true-north-map/dossier-release-probe/v1";

export function deriveDossierReleaseProbeSecret(serviceRoleKey: string) {
  if (!serviceRoleKey) throw new Error("A service credential is required to derive the dossier release probe secret");
  return createHmac("sha256", serviceRoleKey)
    .update(dossierReleaseProbeDerivationContext)
    .digest("hex");
}

export function signDossierReleaseProbe(
  deployment: string,
  slug: string,
  secret: string,
  issuedAt = Date.now(),
  nonce = randomBytes(16).toString("hex")
) {
  if (!deployment || !slug || !secret) throw new Error("Dossier release probe signing inputs are required");
  if (!Number.isSafeInteger(issuedAt) || issuedAt <= 0 || !/^[a-f0-9]{32}$/i.test(nonce)) {
    throw new Error("Dossier release probe timestamp and nonce are invalid");
  }
  const signature = createHmac("sha256", secret)
    .update(`${deployment}\n${slug}\n${issuedAt}\n${nonce}`)
    .digest("hex");
  return `${issuedAt}.${nonce}.${signature}`;
}

export function verifyDossierReleaseProbe(
  deployment: string,
  slug: string,
  signature: string,
  expectedDeployment: string,
  secret: string,
  now = Date.now()
) {
  if (!deployment || deployment !== expectedDeployment || !slug || !signature || !secret) return false;
  const [issuedAtRaw, nonce, received] = signature.split(".");
  const issuedAt = Number(issuedAtRaw);
  if (!Number.isSafeInteger(issuedAt) || !/^[a-f0-9]{32}$/i.test(nonce ?? "") || !/^[a-f0-9]{64}$/i.test(received ?? "")) return false;
  if (issuedAt > now + dossierReleaseProbeClockSkewMs || now - issuedAt > dossierReleaseProbeMaxAgeMs) return false;
  const expected = createHmac("sha256", secret)
    .update(`${deployment}\n${slug}\n${issuedAt}\n${nonce}`)
    .digest("hex");
  const receivedBuffer = Buffer.from(received, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

export type DossierReleaseCandidate = {
  id: string;
  slug: string;
  entityKind: string;
  updatedAt: string | null;
  citationCount: number;
  contentCount: number;
};

export type DossierReleaseSample = DossierReleaseCandidate & {
  selectionLane: "high_citation" | "sparse" | "newly_updated" | "coverage_fill";
};

const forbiddenProfileDataKeys = [
  "reviewed_candidate_id",
  "reviewed_by",
  "research_schema_version",
  "ingestion_batch_id"
] as const;

export function percentile(values: number[], quantile: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1))];
}

/** Select a repeatable, role-balanced release sample. Every record must carry at
 * least one public citation somewhere in its admitted dossier graph so the API
 * gate proves that bounded evidence hydration survived the dossier-view split.
 */
export function selectDossierReleaseSamples(
  candidates: DossierReleaseCandidate[],
  minimum = 10
): DossierReleaseSample[] {
  if (minimum < 1) throw new Error("Dossier release sample must contain at least one record");
  const eligible = candidates.filter((candidate) => candidate.citationCount > 0);
  const selected = new Map<string, DossierReleaseSample>();
  const add = (candidate: DossierReleaseCandidate, selectionLane: DossierReleaseSample["selectionLane"]) => {
    if (!selected.has(candidate.id)) selected.set(candidate.id, { ...candidate, selectionLane });
  };
  [...eligible]
    .sort((left, right) => right.citationCount - left.citationCount || right.contentCount - left.contentCount || left.slug.localeCompare(right.slug))
    .slice(0, 1)
    .forEach((candidate) => add(candidate, "high_citation"));
  const sparse = [...eligible]
    .sort((left, right) => left.contentCount - right.contentCount || left.citationCount - right.citationCount || left.slug.localeCompare(right.slug))
    .find((candidate) => !selected.has(candidate.id));
  if (sparse) add(sparse, "sparse");
  const newlyUpdated = [...eligible]
    .sort((left, right) => Date.parse(right.updatedAt ?? "") - Date.parse(left.updatedAt ?? "") || left.slug.localeCompare(right.slug))
    .find((candidate) => !selected.has(candidate.id));
  if (newlyUpdated) add(newlyUpdated, "newly_updated");
  const roleRepresentatives = new Map<string, DossierReleaseCandidate>();
  for (const candidate of [...eligible].sort((left, right) => left.slug.localeCompare(right.slug))) {
    if (!roleRepresentatives.has(candidate.entityKind)) roleRepresentatives.set(candidate.entityKind, candidate);
  }
  for (const candidate of roleRepresentatives.values()) {
    if (selected.size < minimum) add(candidate, "coverage_fill");
  }
  [...eligible]
    .sort((left, right) => left.slug.localeCompare(right.slug))
    .forEach((candidate) => {
      if (selected.size < minimum) add(candidate, "coverage_fill");
    });

  if (selected.size < minimum) {
    throw new Error(`Only ${selected.size} activated dossiers have public dossier citations; ${minimum} are required`);
  }
  return [...selected.values()].slice(0, minimum);
}

/** Count the evidence that actually survives in the public dossier payload,
 * including child capabilities, matches, programs, funding, relationships and
 * media. A top-level organization citation is not required when the admitted
 * record is supported entirely by its published child graph.
 */
export function countPublicDossierCitations(value: unknown) {
  const citationKeys = new Set<string>();
  const visit = (candidate: unknown, key?: string) => {
    if (Array.isArray(candidate)) {
      if (key === "citations" || key === "programCitations") {
        for (const citation of candidate) {
          if (citation === null || typeof citation !== "object" || Array.isArray(citation)) continue;
          const record = citation as Record<string, unknown>;
          const identity = [record.id, record.sourceUrl, record.sourceTitle, record.fieldName]
            .filter((item) => typeof item === "string" && item.length > 0)
            .join("|");
          if (identity) citationKeys.add(identity);
        }
      }
      candidate.forEach((item) => visit(item));
      return;
    }
    if (candidate === null || typeof candidate !== "object") return;
    for (const [childKey, child] of Object.entries(candidate as Record<string, unknown>)) visit(child, childKey);
  };
  visit(value);
  return citationKeys.size;
}

export function dossierApiContractIssues(value: unknown, expected: DossierReleaseCandidate) {
  const issues: string[] = [];
  const record = value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const editorial = record.editorialProfile !== null && typeof record.editorialProfile === "object" && !Array.isArray(record.editorialProfile)
    ? record.editorialProfile as Record<string, unknown>
    : {};
  const profileData = record.profileData !== null && typeof record.profileData === "object" && !Array.isArray(record.profileData)
    ? record.profileData as Record<string, unknown>
    : {};
  if (record.id !== expected.id || record.slug !== expected.slug) issues.push("API record identity did not match the selected dossier");
  if (editorial.version !== "organization_editorial_profile_v1") issues.push("API omitted the activated editorial profile marker");
  if (!Array.isArray(record.capabilities)) issues.push("API omitted the capabilities collection");
  if (countPublicDossierCitations(record) === 0) issues.push("API omitted the bounded public citation trail");
  const exposedKeys = forbiddenProfileDataKeys.filter((key) => Object.hasOwn(profileData, key));
  if (exposedKeys.length > 0) issues.push(`API exposed internal profile lineage: ${exposedKeys.join(", ")}`);
  return issues;
}
