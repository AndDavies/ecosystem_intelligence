import { access, appendFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadSeedData, type SeedRow } from "./seed-utils";

export const candidateBatchDir = path.join(process.cwd(), "data", "ingestion", "candidate-batches");
export const candidateReviewDir = path.join(process.cwd(), "data", "ingestion", "reviews");
export const candidatePromotionDir = path.join(process.cwd(), "data", "ingestion", "promotions");

const candidateConfidenceValues = ["high", "moderate", "needs_validation"] as const;
const geographyValues = ["canada", "nato", "global"] as const;
const pathwayValues = ["build", "validate", "scale"] as const;
const relevanceValues = ["low", "medium", "high"] as const;
const suggestedActionValues = [
  "connect_to_end_user_validation",
  "explore_testbed_inclusion",
  "assess_funding_fit",
  "introduce_to_integrator",
  "monitor_for_later_stage_engagement",
  "assess_procurement_relevance"
] as const;
const signalTypeValues = [
  "funding",
  "contract",
  "pilot",
  "partnership",
  "strategic_hiring",
  "accelerator",
  "technical_milestone"
] as const;
const citationEntityTypes = ["company", "capability", "capability_use_case", "use_case", "use_case_observation"] as const;
const sourceTypeValues = [
  "company_website",
  "company_news",
  "government_program",
  "government_policy",
  "industry_news",
  "official_report"
] as const;

type CandidateConfidence = (typeof candidateConfidenceValues)[number];

export const candidatePromotionTables = [
  {
    tableName: "companies",
    fileName: "companies.csv",
    batchKey: "companies",
    headers: [
      "id",
      "slug",
      "name",
      "overview",
      "geography",
      "headquarters",
      "market_context",
      "website_url",
      "public_contact_email",
      "public_contact_phone",
      "last_updated_at",
      "data_stage",
      "source_confidence",
      "research_rationale",
      "source_batch_id"
    ]
  },
  {
    tableName: "capabilities",
    fileName: "capabilities.csv",
    batchKey: "capabilities",
    headers: [
      "id",
      "company_id",
      "slug",
      "name",
      "capability_type",
      "domain_id",
      "summary",
      "company_facing_context",
      "last_updated_at",
      "data_stage",
      "source_confidence",
      "research_rationale",
      "source_batch_id"
    ]
  },
  {
    tableName: "capability_use_cases",
    fileName: "capability_use_cases.csv",
    batchKey: "capabilityUseCases",
    headers: [
      "id",
      "capability_id",
      "use_case_id",
      "cluster_id",
      "pathway",
      "relevance_band",
      "defence_relevance",
      "suggested_action_type",
      "action_note",
      "why_it_matters",
      "reviewer_override_delta",
      "evidence_strength",
      "actionability_score",
      "last_signal_at",
      "stale_after_days",
      "data_stage",
      "source_confidence",
      "research_rationale",
      "source_batch_id"
    ]
  },
  {
    tableName: "signals",
    fileName: "signals.csv",
    batchKey: "signals",
    headers: ["id", "capability_id", "signal_type", "title", "description", "observed_at"]
  },
  {
    tableName: "sources",
    fileName: "sources.csv",
    batchKey: "sources",
    headers: ["id", "source_type", "title", "url", "publisher", "published_at"]
  },
  {
    tableName: "evidence_snippets",
    fileName: "evidence_snippets.csv",
    batchKey: "evidenceSnippets",
    headers: ["id", "source_id", "capability_id", "excerpt"]
  },
  {
    tableName: "field_citations",
    fileName: "field_citations.csv",
    batchKey: "fieldCitations",
    headers: ["id", "entity_type", "entity_id", "field_name", "evidence_snippet_id"]
  }
] as const;

interface CandidateSource {
  id: string;
  source_type: string;
  title: string;
  url: string;
  publisher: string;
  published_at: string | null;
}

interface CandidateCompany {
  id: string;
  slug: string;
  name: string;
  overview: string;
  geography: string;
  headquarters: string;
  market_context: string | null;
  website_url: string | null;
  public_contact_email: string | null;
  public_contact_phone: string | null;
  last_updated_at: string;
  confidence: CandidateConfidence;
  research_rationale: string;
}

interface CandidateCapability {
  id: string;
  company_id: string;
  slug: string;
  name: string;
  capability_type: string;
  domain_id: string;
  summary: string;
  company_facing_context: string | null;
  last_updated_at: string;
  confidence: CandidateConfidence;
  research_rationale: string;
}

interface CandidateCapabilityUseCase {
  id: string;
  capability_id: string;
  use_case_id: string;
  cluster_id: string;
  pathway: string;
  relevance_band: string;
  defence_relevance: string;
  suggested_action_type: string;
  action_note: string | null;
  why_it_matters: string;
  reviewer_override_delta: number;
  evidence_strength: number;
  actionability_score: number;
  last_signal_at: string | null;
  stale_after_days: number;
  confidence: CandidateConfidence;
  research_rationale: string;
}

interface CandidateSignal {
  id: string;
  capability_id: string;
  signal_type: string;
  title: string;
  description: string;
  observed_at: string;
}

interface CandidateEvidenceSnippet {
  id: string;
  source_id: string;
  capability_id: string | null;
  excerpt: string;
}

interface CandidateFieldCitation {
  id: string;
  entity_type: string;
  entity_id: string;
  field_name: string;
  evidence_snippet_id: string;
}

export interface CandidateBatch {
  batchId: string;
  title: string;
  status: "candidate";
  createdAt: string;
  researchScope: {
    description: string;
    useCaseIds: string[];
    domainIds: string[];
  };
  guardrailNotes: string[];
  companies: CandidateCompany[];
  capabilities: CandidateCapability[];
  capabilityUseCases: CandidateCapabilityUseCase[];
  signals: CandidateSignal[];
  sources: CandidateSource[];
  evidenceSnippets: CandidateEvidenceSnippet[];
  fieldCitations: CandidateFieldCitation[];
}

export interface CandidateValidationResult {
  filePath: string;
  batchId: string;
  title: string;
  counts: {
    companies: number;
    capabilities: number;
    mappings: number;
    signals: number;
    sources: number;
    evidenceSnippets: number;
    fieldCitations: number;
  };
  touchedUseCases: string[];
  touchedDomains: string[];
  promoted: boolean;
  promotionPath: string;
  errors: string[];
  warnings: string[];
}

interface SeedData {
  domains: SeedRow[];
  useCases: SeedRow[];
  clusters: SeedRow[];
  companies: SeedRow[];
  capabilities: SeedRow[];
  capabilityUseCases: SeedRow[];
  signals: SeedRow[];
  sources: SeedRow[];
  evidenceSnippets: SeedRow[];
  fieldCitations: SeedRow[];
  observations: SeedRow[];
}

export interface CandidatePromotionTableRows {
  tableName: (typeof candidatePromotionTables)[number]["tableName"];
  fileName: (typeof candidatePromotionTables)[number]["fileName"];
  headers: readonly string[];
  rows: Array<Record<string, unknown>>;
}

export interface CandidatePromotionResult {
  result: CandidateValidationResult;
  promotionPath: string;
  promotionLog: {
    batchId: string;
    title: string;
    candidateFile: string;
    reviewer: string;
    promotedAt: string;
    counts: CandidateValidationResult["counts"];
    warnings: string[];
    promotedTables: Array<{
      tableName: string;
      fileName: string;
      rows: number;
    }>;
  };
  promotedTables: CandidatePromotionTableRows[];
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function hasValue(value: unknown) {
  return getString(value).length > 0;
}

function hasMinimumText(value: unknown, minimumLength = 40) {
  return getString(value).length >= minimumLength;
}

function isValidEnum(value: unknown, allowedValues: readonly string[]) {
  return allowedValues.includes(getString(value));
}

function isValidHttpsUrl(value: unknown) {
  const raw = getString(value);

  try {
    const url = new URL(raw);
    return url.protocol === "https:" && url.hostname !== "example.com" && !url.hostname.endsWith(".example.com");
  } catch {
    return false;
  }
}

function isIsoDate(value: unknown) {
  const raw = getString(value);

  if (!raw) {
    return false;
  }

  const time = new Date(raw).getTime();
  return Number.isFinite(time);
}

function isNotFutureDate(value: unknown, now = Date.now()) {
  if (!isIsoDate(value)) {
    return false;
  }

  return new Date(getString(value)).getTime() <= now;
}

function collectStringValues(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectStringValues(item));
  }

  if (isRecord(value)) {
    return Object.values(value).flatMap((item) => collectStringValues(item));
  }

  return [];
}

function hasNonPortableCitationToken(value: unknown) {
  return collectStringValues(value).some((item) => /turn\d+(?:search|view)\d+|【|†|\[\d+\]/.test(item));
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

function setFromRows(rows: SeedRow[], fieldName: string) {
  return new Set(rows.map((item) => getString(item[fieldName])).filter(Boolean));
}

function buildCitationLookup(batch: CandidateBatch) {
  return new Set(
    batch.fieldCitations.map(
      (citation) => `${citation.entity_type}:${citation.entity_id}:${citation.field_name}:${citation.evidence_snippet_id}`
    )
  );
}

function hasCitationForField(batch: CandidateBatch, entityType: string, entityId: string, fieldName: string) {
  return batch.fieldCitations.some(
    (citation) =>
      citation.entity_type === entityType && citation.entity_id === entityId && citation.field_name === fieldName
  );
}

function assertUnique(
  values: string[],
  label: string,
  errors: string[],
  existingValues?: Set<string>,
  existingLabel = "seed"
) {
  findDuplicates(values).forEach((value) => errors.push(`${label} '${value}' is duplicated inside the candidate batch.`));

  if (existingValues) {
    values
      .filter((value) => existingValues.has(value))
      .forEach((value) => errors.push(`${label} '${value}' already exists in ${existingLabel}.`));
  }
}

function validateArray(value: unknown, label: string, errors: string[]) {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array.`);
    return [];
  }

  return value;
}

export async function loadCandidateBatch(filePath: string): Promise<CandidateBatch> {
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as CandidateBatch;
  return parsed;
}

export async function loadCandidateBatches(directory = candidateBatchDir) {
  const entries = await readdir(directory);
  const jsonFiles = entries.filter((entry) => entry.endsWith(".json")).sort();

  return Promise.all(
    jsonFiles.map(async (fileName) => ({
      filePath: path.join(directory, fileName),
      batch: await loadCandidateBatch(path.join(directory, fileName))
    }))
  );
}

export async function validateCandidateBatch(
  batch: CandidateBatch,
  filePath: string,
  seedData?: SeedData
): Promise<CandidateValidationResult> {
  const seed = seedData ?? (await loadSeedData());
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(batch)) {
    errors.push("Candidate batch must be a JSON object.");
  }

  if (!hasValue(batch.batchId)) {
    errors.push("batchId is required.");
  }

  if (!hasMinimumText(batch.title, 8)) {
    errors.push("title is required.");
  }

  if (batch.status !== "candidate") {
    errors.push("status must be 'candidate' so research output cannot be mistaken for approved seed data.");
  }

  if (!isNotFutureDate(batch.createdAt)) {
    errors.push("createdAt must be a valid ISO date that is not in the future.");
  }

  if (hasNonPortableCitationToken(batch)) {
    errors.push("Candidate batch contains non-portable citation tokens. Use canonical URLs and local citation ids instead.");
  }

  const companies = validateArray(batch.companies, "companies", errors) as CandidateCompany[];
  const capabilities = validateArray(batch.capabilities, "capabilities", errors) as CandidateCapability[];
  const mappings = validateArray(batch.capabilityUseCases, "capabilityUseCases", errors) as CandidateCapabilityUseCase[];
  const signals = validateArray(batch.signals, "signals", errors) as CandidateSignal[];
  const sources = validateArray(batch.sources, "sources", errors) as CandidateSource[];
  const snippets = validateArray(batch.evidenceSnippets, "evidenceSnippets", errors) as CandidateEvidenceSnippet[];
  const citations = validateArray(batch.fieldCitations, "fieldCitations", errors) as CandidateFieldCitation[];

  if (!companies.length) {
    errors.push("Candidate batch must include at least one company.");
  }

  if (!capabilities.length) {
    errors.push("Candidate batch must include at least one capability.");
  }

  if (!mappings.length) {
    errors.push("Candidate batch must include at least one capability-use-case mapping.");
  }

  const seedDomainIds = setFromRows(seed.domains, "id");
  const seedUseCaseIds = setFromRows(seed.useCases, "id");
  const activeUseCaseIds = new Set(seed.useCases.filter((item) => Boolean(item.active)).map((item) => getString(item.id)));
  const seedClusterIds = setFromRows(seed.clusters, "id");
  const seedCompanyIds = setFromRows(seed.companies, "id");
  const seedCompanySlugs = setFromRows(seed.companies, "slug");
  const seedCapabilityIds = setFromRows(seed.capabilities, "id");
  const seedCapabilitySlugs = setFromRows(seed.capabilities, "slug");
  const seedMappingIds = setFromRows(seed.capabilityUseCases, "id");
  const seedSignalIds = setFromRows(seed.signals, "id");
  const seedSourceIds = setFromRows(seed.sources, "id");
  const seedSourceUrls = setFromRows(seed.sources, "url");
  const seedSnippetIds = setFromRows(seed.evidenceSnippets, "id");
  const seedCitationIds = setFromRows(seed.fieldCitations, "id");
  const promotionPath = getCandidatePromotionPath(batch.batchId);
  const alreadyPromoted = await fileExists(promotionPath);

  const candidateCompanyIds = new Set(companies.map((item) => item.id));
  const candidateCapabilityIds = new Set(capabilities.map((item) => item.id));
  const candidateMappingIds = new Set(mappings.map((item) => item.id));
  const candidateSourceIds = new Set(sources.map((item) => item.id));
  const candidateSnippetIds = new Set(snippets.map((item) => item.id));

  assertUnique(companies.map((item) => item.id), "Company id", errors, alreadyPromoted ? undefined : seedCompanyIds);
  assertUnique(companies.map((item) => item.slug), "Company slug", errors, alreadyPromoted ? undefined : seedCompanySlugs);
  assertUnique(capabilities.map((item) => item.id), "Capability id", errors, alreadyPromoted ? undefined : seedCapabilityIds);
  assertUnique(capabilities.map((item) => item.slug), "Capability slug", errors, alreadyPromoted ? undefined : seedCapabilitySlugs);
  assertUnique(mappings.map((item) => item.id), "Mapping id", errors, alreadyPromoted ? undefined : seedMappingIds);
  assertUnique(signals.map((item) => item.id), "Signal id", errors, alreadyPromoted ? undefined : seedSignalIds);
  assertUnique(sources.map((item) => item.id), "Source id", errors, alreadyPromoted ? undefined : seedSourceIds);
  assertUnique(sources.map((item) => item.url), "Source URL", errors, alreadyPromoted ? undefined : seedSourceUrls);
  assertUnique(snippets.map((item) => item.id), "Evidence snippet id", errors, alreadyPromoted ? undefined : seedSnippetIds);
  assertUnique(citations.map((item) => item.id), "Field citation id", errors, alreadyPromoted ? undefined : seedCitationIds);

  const citedFields = buildCitationLookup(batch);

  sources.forEach((source) => {
    if (!hasValue(source.id)) {
      errors.push("Source id is required.");
    }
    if (!isValidEnum(source.source_type, sourceTypeValues)) {
      errors.push(`Source ${source.id} has unsupported source_type '${source.source_type}'.`);
    }
    if (!hasMinimumText(source.title, 8)) {
      errors.push(`Source ${source.id} needs a title.`);
    }
    if (!hasMinimumText(source.publisher, 2)) {
      errors.push(`Source ${source.id} needs a publisher.`);
    }
    if (!isValidHttpsUrl(source.url)) {
      errors.push(`Source ${source.id} needs a canonical https URL that is not example.com.`);
    }
    if (source.published_at !== null && !isNotFutureDate(source.published_at)) {
      errors.push(`Source ${source.id} has an invalid or future published_at date.`);
    }
  });

  companies.forEach((company) => {
    if (!hasMinimumText(company.overview)) {
      errors.push(`Company ${company.id} needs a substantive overview.`);
    }
    if (!isValidEnum(company.geography, geographyValues)) {
      errors.push(`Company ${company.id} has unsupported geography '${company.geography}'.`);
    }
    if (!hasMinimumText(company.headquarters, 6)) {
      errors.push(`Company ${company.id} needs headquarters context.`);
    }
    if (company.website_url && !isValidHttpsUrl(company.website_url)) {
      errors.push(`Company ${company.id} needs a valid https website_url.`);
    }
    if (!isNotFutureDate(company.last_updated_at)) {
      errors.push(`Company ${company.id} needs a valid last_updated_at date that is not in the future.`);
    }
    if (!isValidEnum(company.confidence, candidateConfidenceValues)) {
      errors.push(`Company ${company.id} needs a valid confidence value.`);
    }
    if (!hasMinimumText(company.research_rationale)) {
      errors.push(`Company ${company.id} needs a research_rationale.`);
    }
    if (!hasCitationForField(batch, "company", company.id, "overview")) {
      errors.push(`Company ${company.id} needs an overview field citation.`);
    }
  });

  capabilities.forEach((capability) => {
    if (!candidateCompanyIds.has(capability.company_id)) {
      errors.push(`Capability ${capability.id} references missing candidate company ${capability.company_id}.`);
    }
    if (!seedDomainIds.has(capability.domain_id)) {
      errors.push(`Capability ${capability.id} references unknown domain ${capability.domain_id}.`);
    }
    if (!hasMinimumText(capability.summary)) {
      errors.push(`Capability ${capability.id} needs a substantive summary.`);
    }
    if (!hasMinimumText(capability.capability_type, 4)) {
      errors.push(`Capability ${capability.id} needs capability_type.`);
    }
    if (!isNotFutureDate(capability.last_updated_at)) {
      errors.push(`Capability ${capability.id} needs a valid last_updated_at date that is not in the future.`);
    }
    if (!isValidEnum(capability.confidence, candidateConfidenceValues)) {
      errors.push(`Capability ${capability.id} needs a valid confidence value.`);
    }
    if (!hasMinimumText(capability.research_rationale)) {
      errors.push(`Capability ${capability.id} needs a research_rationale.`);
    }
    if (!hasCitationForField(batch, "capability", capability.id, "summary")) {
      errors.push(`Capability ${capability.id} needs a summary field citation.`);
    }
  });

  mappings.forEach((mapping) => {
    const capability = capabilities.find((item) => item.id === mapping.capability_id);
    const cluster = seed.clusters.find((item) => item.id === mapping.cluster_id);

    if (!candidateCapabilityIds.has(mapping.capability_id)) {
      errors.push(`Mapping ${mapping.id} references missing candidate capability ${mapping.capability_id}.`);
    }
    if (!seedUseCaseIds.has(mapping.use_case_id)) {
      errors.push(`Mapping ${mapping.id} references unknown use case ${mapping.use_case_id}.`);
    }
    if (!activeUseCaseIds.has(mapping.use_case_id)) {
      errors.push(`Mapping ${mapping.id} references inactive use case ${mapping.use_case_id}.`);
    }
    if (!seedClusterIds.has(mapping.cluster_id)) {
      errors.push(`Mapping ${mapping.id} references unknown cluster ${mapping.cluster_id}.`);
    }
    if (capability && cluster && getString(cluster.domain_id) !== capability.domain_id) {
      errors.push(
        `Mapping ${mapping.id} uses cluster ${mapping.cluster_id}, but that cluster is not in capability domain ${capability.domain_id}.`
      );
    }
    if (!isValidEnum(mapping.pathway, pathwayValues)) {
      errors.push(`Mapping ${mapping.id} has unsupported pathway '${mapping.pathway}'.`);
    }
    if (!isValidEnum(mapping.relevance_band, relevanceValues)) {
      errors.push(`Mapping ${mapping.id} has unsupported relevance_band '${mapping.relevance_band}'.`);
    }
    if (!isValidEnum(mapping.defence_relevance, relevanceValues)) {
      errors.push(`Mapping ${mapping.id} has unsupported defence_relevance '${mapping.defence_relevance}'.`);
    }
    if (!isValidEnum(mapping.suggested_action_type, suggestedActionValues)) {
      errors.push(`Mapping ${mapping.id} has unsupported suggested_action_type '${mapping.suggested_action_type}'.`);
    }
    if (!hasMinimumText(mapping.why_it_matters)) {
      errors.push(`Mapping ${mapping.id} needs a substantive why_it_matters.`);
    }
    if (![-10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(mapping.reviewer_override_delta)) {
      errors.push(`Mapping ${mapping.id} reviewer_override_delta must be between -10 and 10.`);
    }
    if (![1, 3, 5].includes(mapping.evidence_strength)) {
      errors.push(`Mapping ${mapping.id} evidence_strength must be 1, 3, or 5.`);
    }
    if (![0, 5].includes(mapping.actionability_score)) {
      errors.push(`Mapping ${mapping.id} actionability_score must be 0 or 5.`);
    }
    if (mapping.last_signal_at !== null && !isNotFutureDate(mapping.last_signal_at)) {
      errors.push(`Mapping ${mapping.id} has an invalid or future last_signal_at date.`);
    }
    if (!Number.isInteger(mapping.stale_after_days) || mapping.stale_after_days < 30) {
      errors.push(`Mapping ${mapping.id} stale_after_days must be at least 30.`);
    }
    if (!isValidEnum(mapping.confidence, candidateConfidenceValues)) {
      errors.push(`Mapping ${mapping.id} needs a valid confidence value.`);
    }
    if (!hasMinimumText(mapping.research_rationale)) {
      errors.push(`Mapping ${mapping.id} needs a research_rationale.`);
    }
    if (mapping.relevance_band === "high" && mapping.defence_relevance === "high" && mapping.evidence_strength < 3) {
      errors.push(`Mapping ${mapping.id} cannot be high relevance and high defence relevance with weak evidence.`);
    }
    if (!hasCitationForField(batch, "capability_use_case", mapping.id, "why_it_matters")) {
      errors.push(`Mapping ${mapping.id} needs a why_it_matters field citation.`);
    }
  });

  signals.forEach((signal) => {
    if (!candidateCapabilityIds.has(signal.capability_id)) {
      errors.push(`Signal ${signal.id} references missing candidate capability ${signal.capability_id}.`);
    }
    if (!isValidEnum(signal.signal_type, signalTypeValues)) {
      errors.push(`Signal ${signal.id} has unsupported signal_type '${signal.signal_type}'.`);
    }
    if (!hasMinimumText(signal.title, 8)) {
      errors.push(`Signal ${signal.id} needs a title.`);
    }
    if (!hasMinimumText(signal.description)) {
      errors.push(`Signal ${signal.id} needs a substantive description.`);
    }
    if (!isNotFutureDate(signal.observed_at)) {
      errors.push(`Signal ${signal.id} needs a valid observed_at date that is not in the future.`);
    }
  });

  snippets.forEach((snippet) => {
    if (!candidateSourceIds.has(snippet.source_id)) {
      errors.push(`Evidence snippet ${snippet.id} references missing candidate source ${snippet.source_id}.`);
    }
    if (snippet.capability_id && !candidateCapabilityIds.has(snippet.capability_id)) {
      errors.push(`Evidence snippet ${snippet.id} references missing candidate capability ${snippet.capability_id}.`);
    }
    if (!hasMinimumText(snippet.excerpt)) {
      errors.push(`Evidence snippet ${snippet.id} needs a substantive paraphrased excerpt.`);
    }
  });

  citations.forEach((citation) => {
    if (!isValidEnum(citation.entity_type, citationEntityTypes)) {
      errors.push(`Citation ${citation.id} has unsupported entity_type '${citation.entity_type}'.`);
    }
    if (!candidateSnippetIds.has(citation.evidence_snippet_id)) {
      errors.push(`Citation ${citation.id} references missing candidate snippet ${citation.evidence_snippet_id}.`);
    }
    if (!hasValue(citation.field_name)) {
      errors.push(`Citation ${citation.id} needs field_name.`);
    }

    if (citation.entity_type === "company" && !candidateCompanyIds.has(citation.entity_id)) {
      errors.push(`Citation ${citation.id} references missing candidate company ${citation.entity_id}.`);
    }
    if (citation.entity_type === "capability" && !candidateCapabilityIds.has(citation.entity_id)) {
      errors.push(`Citation ${citation.id} references missing candidate capability ${citation.entity_id}.`);
    }
    if (citation.entity_type === "capability_use_case" && !candidateMappingIds.has(citation.entity_id)) {
      errors.push(`Citation ${citation.id} references missing candidate mapping ${citation.entity_id}.`);
    }
    if (citation.entity_type === "use_case" && !seedUseCaseIds.has(citation.entity_id)) {
      errors.push(`Citation ${citation.id} references unknown existing use case ${citation.entity_id}.`);
    }
  });

  citations.forEach((citation) => {
    const key = `${citation.entity_type}:${citation.entity_id}:${citation.field_name}:${citation.evidence_snippet_id}`;
    if (!citedFields.has(key)) {
      warnings.push(`Citation ${citation.id} could not be indexed.`);
    }
  });

  const sourceIdsWithSnippet = new Set(snippets.map((snippet) => snippet.source_id));
  sources
    .filter((source) => !sourceIdsWithSnippet.has(source.id))
    .forEach((source) => warnings.push(`Source ${source.id} is present but not used by an evidence snippet.`));

  const mappedCapabilityIds = new Set(mappings.map((mapping) => mapping.capability_id));
  capabilities
    .filter((capability) => !mappedCapabilityIds.has(capability.id))
    .forEach((capability) => warnings.push(`Capability ${capability.id} has no use-case mapping.`));

  const touchedUseCases = [...new Set(mappings.map((mapping) => mapping.use_case_id))].sort();
  const touchedDomains = [...new Set(capabilities.map((capability) => capability.domain_id))].sort();

  return {
    filePath,
    batchId: batch.batchId,
    title: batch.title,
    counts: {
      companies: companies.length,
      capabilities: capabilities.length,
      mappings: mappings.length,
      signals: signals.length,
      sources: sources.length,
      evidenceSnippets: snippets.length,
      fieldCitations: citations.length
    },
    touchedUseCases,
    touchedDomains,
    promoted: alreadyPromoted,
    promotionPath,
    errors,
    warnings
  };
}

export function formatCandidateValidationReport(results: CandidateValidationResult[]) {
  const lines: string[] = [];
  const totalErrors = results.reduce((sum, result) => sum + result.errors.length, 0);
  const totalWarnings = results.reduce((sum, result) => sum + result.warnings.length, 0);

  lines.push("Candidate ingestion validation");
  lines.push(`Batches: ${results.length}`);
  lines.push(`Errors: ${totalErrors}`);
  lines.push(`Warnings: ${totalWarnings}`);

  results.forEach((result) => {
    lines.push("");
    lines.push(`${result.title} (${result.batchId})`);
    lines.push(`File: ${path.relative(process.cwd(), result.filePath)}`);
    lines.push(
      `Counts: ${result.counts.companies} companies, ${result.counts.capabilities} capabilities, ${result.counts.mappings} mappings, ${result.counts.sources} sources, ${result.counts.evidenceSnippets} snippets, ${result.counts.fieldCitations} citations`
    );
    lines.push(`Use cases: ${result.touchedUseCases.join(", ") || "none"}`);
    lines.push(`Domains: ${result.touchedDomains.join(", ") || "none"}`);
    lines.push(`Promoted: ${result.promoted ? path.relative(process.cwd(), result.promotionPath) : "no"}`);

    result.errors.forEach((error) => lines.push(`ERROR: ${error}`));
    result.warnings.forEach((warning) => lines.push(`WARN: ${warning}`));
  });

  return lines.join("\n");
}

function formatMarkdownList(items: string[]) {
  if (!items.length) {
    return "- None";
  }

  return items.map((item) => `- ${item}`).join("\n");
}

function formatMarkdownTable(headers: string[], rows: string[][]) {
  if (!rows.length) {
    return "_None_";
  }

  const escapeCell = (value: string) => value.replace(/\|/g, "\\|").replace(/\n/g, " ");
  const header = `| ${headers.map(escapeCell).join(" | ")} |`;
  const separator = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map((cell) => escapeCell(cell)).join(" | ")} |`);

  return [header, separator, ...body].join("\n");
}

function getCitationCount(batch: CandidateBatch, entityType: string, entityId: string) {
  return batch.fieldCitations.filter((citation) => citation.entity_type === entityType && citation.entity_id === entityId)
    .length;
}

export function getCandidateReviewPath(batchId: string) {
  return path.join(candidateReviewDir, `${batchId}.md`);
}

export function getCandidatePromotionPath(batchId: string) {
  return path.join(candidatePromotionDir, `${batchId}.json`);
}

export function formatCandidateReviewPacket(batch: CandidateBatch, result: CandidateValidationResult) {
  const validationStatus = result.errors.length
    ? "Blocked"
    : result.warnings.length
      ? "Review warnings before promotion"
      : "Ready for human review";

  const lines: string[] = [];

  lines.push(`# ${batch.title}`);
  lines.push("");
  lines.push(`- Batch ID: \`${batch.batchId}\``);
  lines.push(`- Candidate file: \`${path.relative(process.cwd(), result.filePath)}\``);
  lines.push(`- Created: \`${batch.createdAt}\``);
  lines.push(`- Validation status: **${validationStatus}**`);
  lines.push(
    `- Counts: ${result.counts.companies} companies, ${result.counts.capabilities} capabilities, ${result.counts.mappings} mappings, ${result.counts.sources} sources, ${result.counts.evidenceSnippets} snippets, ${result.counts.fieldCitations} citations`
  );
  lines.push(`- Use cases: ${result.touchedUseCases.map((item) => `\`${item}\``).join(", ") || "none"}`);
  lines.push(`- Domains: ${result.touchedDomains.map((item) => `\`${item}\``).join(", ") || "none"}`);
  lines.push("");
  lines.push("## Research Scope");
  lines.push("");
  lines.push(batch.researchScope.description);
  lines.push("");
  lines.push("## Guardrail Notes");
  lines.push("");
  lines.push(formatMarkdownList(batch.guardrailNotes));
  lines.push("");
  lines.push("## Validation");
  lines.push("");
  lines.push(`- Errors: ${result.errors.length}`);
  lines.push(`- Warnings: ${result.warnings.length}`);
  lines.push("");
  lines.push("### Errors");
  lines.push("");
  lines.push(formatMarkdownList(result.errors));
  lines.push("");
  lines.push("### Warnings");
  lines.push("");
  lines.push(formatMarkdownList(result.warnings));
  lines.push("");
  lines.push("## Reviewer Checklist");
  lines.push("");
  lines.push("- [ ] Company records are real organizations and are not duplicates of existing seed records.");
  lines.push("- [ ] Capability summaries are public-source grounded and do not imply classified alignment.");
  lines.push("- [ ] Use-case mappings are realistic and not stretched to fill the catalog.");
  lines.push("- [ ] High relevance or high defence relevance mappings have enough evidence to justify their confidence.");
  lines.push("- [ ] Source URLs are canonical, useful to an analyst, and acceptable for public-source traceability.");
  lines.push("- [ ] Promotion should proceed into `supabase/seed`.");
  lines.push("");
  lines.push("## Companies");
  lines.push("");
  lines.push(
    formatMarkdownTable(
      ["Company", "Geography", "HQ", "Confidence", "Citations", "Rationale"],
      batch.companies.map((company) => [
        company.name,
        company.geography,
        company.headquarters,
        company.confidence,
        String(getCitationCount(batch, "company", company.id)),
        company.research_rationale
      ])
    )
  );
  lines.push("");
  lines.push("## Capabilities");
  lines.push("");
  lines.push(
    formatMarkdownTable(
      ["Capability", "Company", "Domain", "Confidence", "Citations", "Rationale"],
      batch.capabilities.map((capability) => {
        const company = batch.companies.find((item) => item.id === capability.company_id);

        return [
          capability.name,
          company?.name ?? capability.company_id,
          capability.domain_id,
          capability.confidence,
          String(getCitationCount(batch, "capability", capability.id)),
          capability.research_rationale
        ];
      })
    )
  );
  lines.push("");
  lines.push("## Use-Case Mappings");
  lines.push("");
  lines.push(
    formatMarkdownTable(
      ["Capability", "Use case", "Pathway", "Relevance", "Defence", "Confidence", "Citations", "Why it matters"],
      batch.capabilityUseCases.map((mapping) => {
        const capability = batch.capabilities.find((item) => item.id === mapping.capability_id);

        return [
          capability?.name ?? mapping.capability_id,
          mapping.use_case_id,
          mapping.pathway,
          mapping.relevance_band,
          mapping.defence_relevance,
          mapping.confidence,
          String(getCitationCount(batch, "capability_use_case", mapping.id)),
          mapping.why_it_matters
        ];
      })
    )
  );
  lines.push("");
  lines.push("## Sources");
  lines.push("");
  lines.push(
    formatMarkdownTable(
      ["Source", "Publisher", "Type", "Published", "URL"],
      batch.sources.map((source) => [
        source.title,
        source.publisher,
        source.source_type,
        source.published_at ?? "n/a",
        source.url
      ])
    )
  );
  lines.push("");
  lines.push("## Promotion Command");
  lines.push("");
  lines.push("After reviewing and accepting the checklist, promote with:");
  lines.push("");
  lines.push("```bash");
  lines.push(`pnpm ingest:promote ${path.relative(process.cwd(), result.filePath)} --reviewer "Reviewer Name"`);
  lines.push("```");
  lines.push("");
  lines.push("Preview the promotion without writing seed files:");
  lines.push("");
  lines.push("```bash");
  lines.push(`pnpm ingest:promote ${path.relative(process.cwd(), result.filePath)} --reviewer "Reviewer Name" --dry-run`);
  lines.push("```");

  return `${lines.join("\n")}\n`;
}

function serializeCsvValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const raw = Array.isArray(value) ? value.join("|") : String(value);

  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }

  return raw;
}

export function serializeCandidateRowsForSeed(batch: CandidateBatch, batchKey: (typeof candidatePromotionTables)[number]["batchKey"]) {
  return batch[batchKey] as unknown as Array<Record<string, unknown>>;
}

export function formatCandidateRowsAsCsv(
  rows: Array<Record<string, unknown>>,
  headers: readonly string[]
) {
  return rows.map((row) => headers.map((header) => serializeCsvValue(row[header])).join(",")).join("\n");
}

function projectCandidateRowToHeaders(
  row: Record<string, unknown>,
  headers: readonly string[],
  batch: CandidateBatch,
  tableName: (typeof candidatePromotionTables)[number]["tableName"]
) {
  const rowWithOperationalMetadata =
    tableName === "companies" || tableName === "capabilities" || tableName === "capability_use_cases"
      ? {
          ...row,
          data_stage: "validated",
          source_confidence: row.confidence ?? "needs_validation",
          research_rationale: row.research_rationale ?? null,
          source_batch_id: batch.batchId
        }
      : row;

  return Object.fromEntries(headers.map((header) => [header, rowWithOperationalMetadata[header] ?? null]));
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function appendRowsToSeedCsv(fileName: string, csvRows: string) {
  if (!csvRows) {
    return;
  }

  const seedPath = path.join(process.cwd(), "supabase", "seed", fileName);
  const existing = await readFile(seedPath, "utf8");
  const prefix = existing.endsWith("\n") ? "" : "\n";

  await appendFile(seedPath, `${prefix}${csvRows}\n`, "utf8");
}

export function getCandidatePromotionTables(batch: CandidateBatch): CandidatePromotionTableRows[] {
  return candidatePromotionTables.map((table) => ({
    tableName: table.tableName,
    fileName: table.fileName,
    headers: table.headers,
    rows: serializeCandidateRowsForSeed(batch, table.batchKey).map((row) =>
      projectCandidateRowToHeaders(row, table.headers, batch, table.tableName)
    )
  }));
}

export async function promoteCandidateBatch(input: {
  batch: CandidateBatch;
  filePath: string;
  reviewer: string;
  seedData?: SeedData;
  dryRun?: boolean;
  beforeWrite?: (tables: CandidatePromotionTableRows[]) => Promise<void>;
}): Promise<CandidatePromotionResult> {
  const seedData = input.seedData ?? (await loadSeedData());
  const result = await validateCandidateBatch(input.batch, input.filePath, seedData);
  const promotionPath = getCandidatePromotionPath(input.batch.batchId);
  const dryRun = input.dryRun ?? false;

  if (!input.reviewer.trim()) {
    throw new Error('Promotion requires --reviewer "Reviewer Name".');
  }

  if (!dryRun && (await fileExists(promotionPath))) {
    throw new Error(
      `Batch ${input.batch.batchId} already has a promotion log at ${path.relative(process.cwd(), promotionPath)}.`
    );
  }

  if (result.errors.length > 0) {
    throw new Error(`Batch ${input.batch.batchId} cannot be promoted until validation errors are resolved.`);
  }

  const promotedTables = getCandidatePromotionTables(input.batch);
  const promotionLog = {
    batchId: input.batch.batchId,
    title: input.batch.title,
    candidateFile: path.relative(process.cwd(), input.filePath),
    reviewer: input.reviewer,
    promotedAt: new Date().toISOString(),
    counts: result.counts,
    warnings: result.warnings,
    promotedTables: promotedTables.map((table) => ({
      tableName: table.tableName,
      fileName: path.join("supabase", "seed", table.fileName),
      rows: table.rows.length
    }))
  };

  if (!dryRun) {
    await input.beforeWrite?.(promotedTables);
    await mkdir(candidatePromotionDir, { recursive: true });

    for (const table of promotedTables) {
      await appendRowsToSeedCsv(table.fileName, formatCandidateRowsAsCsv(table.rows, table.headers));
    }

    await writeFile(promotionPath, `${JSON.stringify(promotionLog, null, 2)}\n`, "utf8");
  }

  return {
    result,
    promotionPath,
    promotionLog,
    promotedTables
  };
}
