import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { loadSeedData, type SeedRow } from "./seed-utils";

export const sourceLeadDir = path.join(process.cwd(), "data", "ingestion", "source-leads");

const sourceTypeValues = [
  "company_website",
  "company_news",
  "government_program",
  "government_policy",
  "industry_news",
  "official_report"
] as const;
const confidenceValues = ["high", "moderate", "needs_validation", "reject"] as const;

interface SourceLead {
  id: string;
  organizationName: string;
  candidateCapabilityName: string | null;
  sourceUrl: string;
  sourceTitle: string;
  publisher: string;
  sourceType: string;
  publishedAt: string | null;
  leadSummary: string;
  possibleUseCaseIds: string[];
  possibleDomainIds: string[];
  confidence: string;
  followUpQuestions: string[];
  doNotIngestReason: string | null;
}

export interface SourceLeadBatch {
  leadBatchId: string;
  createdAt: string;
  scope: {
    description: string;
    targetUseCases: string[];
    targetDomains: string[];
  };
  leads: SourceLead[];
}

export interface SourceLeadValidationResult {
  filePath: string;
  leadBatchId: string;
  counts: {
    leads: number;
    high: number;
    moderate: number;
    needsValidation: number;
    reject: number;
  };
  touchedUseCases: string[];
  touchedDomains: string[];
  errors: string[];
  warnings: string[];
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function isIsoDate(value: unknown) {
  const raw = asString(value);
  return Boolean(raw) && Number.isFinite(new Date(raw).getTime());
}

function isNotFutureDate(value: unknown) {
  return isIsoDate(value) && new Date(asString(value)).getTime() <= Date.now();
}

function isValidHttpsUrl(value: unknown) {
  const raw = asString(value);

  try {
    const url = new URL(raw);
    return url.protocol === "https:" && url.hostname !== "example.com" && !url.hostname.endsWith(".example.com");
  } catch {
    return false;
  }
}

function hasNonPortableCitationToken(value: unknown): boolean {
  if (typeof value === "string") {
    return /turn\d+(?:search|view)\d+|【|†|\[\d+\]/.test(value);
  }

  if (Array.isArray(value)) {
    return value.some(hasNonPortableCitationToken);
  }

  if (isRecord(value)) {
    return Object.values(value).some(hasNonPortableCitationToken);
  }

  return false;
}

function findDuplicates(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  });

  return [...duplicates];
}

function seedSet(rows: SeedRow[], fieldName: string) {
  return new Set(rows.map((row) => asString(row[fieldName])).filter(Boolean));
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function loadSourceLeadBatch(filePath: string): Promise<SourceLeadBatch> {
  return JSON.parse(await readFile(filePath, "utf8")) as SourceLeadBatch;
}

export async function loadSourceLeadBatches(directory = sourceLeadDir) {
  if (!(await fileExists(directory))) {
    return [];
  }

  const entries = await readdir(directory);
  const files = entries.filter((entry) => entry.endsWith(".json")).sort();

  return Promise.all(
    files.map(async (fileName) => ({
      filePath: path.join(directory, fileName),
      batch: await loadSourceLeadBatch(path.join(directory, fileName))
    }))
  );
}

export async function validateSourceLeadBatch(
  batch: SourceLeadBatch,
  filePath: string,
  seedData?: Awaited<ReturnType<typeof loadSeedData>>
): Promise<SourceLeadValidationResult> {
  const seed = seedData ?? (await loadSeedData());
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(batch)) {
    errors.push("Source lead batch must be a JSON object.");
  }

  if (!/^[a-z0-9][a-z0-9-]+$/.test(asString(batch.leadBatchId))) {
    errors.push("leadBatchId must be kebab-case.");
  }

  if (!isNotFutureDate(batch.createdAt)) {
    errors.push("createdAt must be a valid ISO date that is not in the future.");
  }

  if (!isRecord(batch.scope) || asString(batch.scope.description).length < 20) {
    errors.push("scope.description must explain the lead batch purpose.");
  }

  if (hasNonPortableCitationToken(batch)) {
    errors.push("Source lead batch contains non-portable citation tokens. Use canonical URLs only.");
  }

  const domainIds = seedSet(seed.domains, "id");
  const activeUseCaseIds = new Set(seed.useCases.filter((useCase) => Boolean(useCase.active)).map((useCase) => asString(useCase.id)));
  const existingSourceUrls = seedSet(seed.sources, "url");
  const leads = asArray(batch.leads) as SourceLead[];

  if (!leads.length) {
    errors.push("Source lead batch must include at least one lead.");
  }

  asArray(batch.scope?.targetUseCases).forEach((useCaseId) => {
    if (!activeUseCaseIds.has(asString(useCaseId))) {
      errors.push(`Scope references unknown or inactive use case ${useCaseId}.`);
    }
  });

  asArray(batch.scope?.targetDomains).forEach((domainId) => {
    if (!domainIds.has(asString(domainId))) {
      errors.push(`Scope references unknown domain ${domainId}.`);
    }
  });

  findDuplicates(leads.map((lead) => asString(lead.id))).forEach((id) =>
    errors.push(`Lead id '${id}' is duplicated inside the batch.`)
  );
  findDuplicates(leads.map((lead) => asString(lead.sourceUrl))).forEach((url) =>
    errors.push(`Source URL '${url}' is duplicated inside the batch.`)
  );

  leads.forEach((lead) => {
    if (!/^[a-z0-9][a-z0-9-]+$/.test(asString(lead.id))) {
      errors.push(`Lead ${lead.id || "(missing id)"} needs a kebab-case id.`);
    }
    if (asString(lead.organizationName).length < 2) {
      errors.push(`Lead ${lead.id} needs organizationName.`);
    }
    if (!isValidHttpsUrl(lead.sourceUrl)) {
      errors.push(`Lead ${lead.id} needs a canonical https sourceUrl that is not example.com.`);
    }
    if (existingSourceUrls.has(asString(lead.sourceUrl))) {
      warnings.push(`Lead ${lead.id} sourceUrl already exists in seed sources.`);
    }
    if (asString(lead.sourceTitle).length < 8) {
      errors.push(`Lead ${lead.id} needs sourceTitle.`);
    }
    if (asString(lead.publisher).length < 2) {
      errors.push(`Lead ${lead.id} needs publisher.`);
    }
    if (!sourceTypeValues.includes(asString(lead.sourceType) as (typeof sourceTypeValues)[number])) {
      errors.push(`Lead ${lead.id} has unsupported sourceType '${lead.sourceType}'.`);
    }
    if (lead.publishedAt !== null && !isNotFutureDate(lead.publishedAt)) {
      errors.push(`Lead ${lead.id} has invalid or future publishedAt.`);
    }
    if (asString(lead.leadSummary).length < 40) {
      errors.push(`Lead ${lead.id} needs a substantive leadSummary.`);
    }
    if (!confidenceValues.includes(asString(lead.confidence) as (typeof confidenceValues)[number])) {
      errors.push(`Lead ${lead.id} has unsupported confidence '${lead.confidence}'.`);
    }
    if (lead.confidence === "reject" && asString(lead.doNotIngestReason).length < 20) {
      errors.push(`Rejected lead ${lead.id} needs doNotIngestReason.`);
    }
    if (lead.confidence !== "reject" && asString(lead.doNotIngestReason)) {
      warnings.push(`Lead ${lead.id} is not rejected but has doNotIngestReason.`);
    }
    asArray(lead.possibleUseCaseIds).forEach((useCaseId) => {
      if (!activeUseCaseIds.has(asString(useCaseId))) {
        errors.push(`Lead ${lead.id} references unknown or inactive use case ${useCaseId}.`);
      }
    });
    asArray(lead.possibleDomainIds).forEach((domainId) => {
      if (!domainIds.has(asString(domainId))) {
        errors.push(`Lead ${lead.id} references unknown domain ${domainId}.`);
      }
    });
    if (!asArray(lead.followUpQuestions).length && lead.confidence !== "reject") {
      warnings.push(`Lead ${lead.id} has no follow-up questions.`);
    }
  });

  const touchedUseCases = [...new Set(leads.flatMap((lead) => asArray(lead.possibleUseCaseIds).map(asString)).filter(Boolean))].sort();
  const touchedDomains = [...new Set(leads.flatMap((lead) => asArray(lead.possibleDomainIds).map(asString)).filter(Boolean))].sort();

  return {
    filePath,
    leadBatchId: asString(batch.leadBatchId),
    counts: {
      leads: leads.length,
      high: leads.filter((lead) => lead.confidence === "high").length,
      moderate: leads.filter((lead) => lead.confidence === "moderate").length,
      needsValidation: leads.filter((lead) => lead.confidence === "needs_validation").length,
      reject: leads.filter((lead) => lead.confidence === "reject").length
    },
    touchedUseCases,
    touchedDomains,
    errors,
    warnings
  };
}

export function formatSourceLeadValidationReport(results: SourceLeadValidationResult[]) {
  const errors = results.reduce((sum, result) => sum + result.errors.length, 0);
  const warnings = results.reduce((sum, result) => sum + result.warnings.length, 0);
  const lines: string[] = [];

  lines.push("Source lead validation");
  lines.push(`Batches: ${results.length}`);
  lines.push(`Errors: ${errors}`);
  lines.push(`Warnings: ${warnings}`);

  if (!results.length) {
    lines.push("");
    lines.push("No source lead batches found. Add JSON files to data/ingestion/source-leads when research begins.");
  }

  results.forEach((result) => {
    lines.push("");
    lines.push(`${result.leadBatchId || "(missing leadBatchId)"}`);
    lines.push(`File: ${path.relative(process.cwd(), result.filePath)}`);
    lines.push(
      `Counts: ${result.counts.leads} leads (${result.counts.high} high, ${result.counts.moderate} moderate, ${result.counts.needsValidation} needs validation, ${result.counts.reject} reject)`
    );
    lines.push(`Use cases: ${result.touchedUseCases.join(", ") || "none"}`);
    lines.push(`Domains: ${result.touchedDomains.join(", ") || "none"}`);
    result.errors.forEach((error) => lines.push(`ERROR: ${error}`));
    result.warnings.forEach((warning) => lines.push(`WARN: ${warning}`));
  });

  return lines.join("\n");
}
