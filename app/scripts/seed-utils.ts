import { readFile } from "node:fs/promises";
import path from "node:path";

const relevanceScores = { high: 30, medium: 20, low: 10 } as const;
const pathwayScores = { scale: 20, validate: 12, build: 6 } as const;
const defenceScores = { high: 20, medium: 10, low: 0 } as const;
const geographyScores = { canada: 10, nato: 6, global: 3 } as const;

function signalRecencyScore(lastSignalAt: string | null) {
  if (!lastSignalAt) return 0;
  const days = Math.floor((Date.now() - new Date(lastSignalAt).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 90) return 10;
  if (days <= 180) return 6;
  if (days <= 365) return 3;
  return 0;
}

function calculateLegacySeedRanking(input: {
  relevanceBand: keyof typeof relevanceScores;
  pathway: keyof typeof pathwayScores;
  defenceRelevance: keyof typeof defenceScores;
  geography: keyof typeof geographyScores;
  lastSignalAt: string | null;
  evidenceStrength: number;
  actionabilityScore: number;
  reviewerOverrideDelta: number;
}) {
  return relevanceScores[input.relevanceBand]
    + pathwayScores[input.pathway]
    + defenceScores[input.defenceRelevance]
    + geographyScores[input.geography]
    + signalRecencyScore(input.lastSignalAt)
    + input.evidenceStrength
    + input.actionabilityScore
    + input.reviewerOverrideDelta;
}

export const seedDir = path.join(process.cwd(), "supabase", "legacy", "seed");
export type SeedValue = string | number | boolean | null | string[];
export type SeedRow = Record<string, SeedValue>;

function parseValue(value: string) {
  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  if (trimmed.includes("|")) {
    return trimmed.split("|").map((segment) => segment.trim());
  }

  return trimmed;
}

export function parseCsvContent(content: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const nextChar = content[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      currentRow.push(currentCell);
      currentCell = "";

      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }

      currentRow = [];
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell);

  if (currentRow.some((cell) => cell.length > 0)) {
    rows.push(currentRow);
  }

  return rows;
}

export async function readCsv(fileName: string): Promise<SeedRow[]> {
  const content = await readFile(path.join(seedDir, fileName), "utf8");
  const [headerRow, ...rows] = parseCsvContent(content.trim());
  const headers = headerRow.map((item) => item.trim());

  return rows.map((cells) => {
    return headers.reduce<SeedRow>((accumulator, header, index) => {
      accumulator[header] = parseValue(cells[index] ?? "");
      return accumulator;
    }, {});
  });
}

export async function loadSeedData() {
  const [
    domains,
    useCases,
    clusters,
    companies,
    contacts,
    capabilities,
    capabilityUseCases,
    signals,
    sources,
    evidenceSnippets,
    fieldCitations,
    observations
  ] = await Promise.all([
    readCsv("domains.csv"),
    readCsv("use_cases.csv"),
    readCsv("clusters.csv"),
    readCsv("companies.csv"),
    readCsv("contacts.csv"),
    readCsv("capabilities.csv"),
    readCsv("capability_use_cases.csv"),
    readCsv("signals.csv"),
    readCsv("sources.csv"),
    readCsv("evidence_snippets.csv"),
    readCsv("field_citations.csv"),
    readCsv("use_case_observations.csv")
  ]);

  return {
    domains,
    useCases,
    clusters,
    companies,
    contacts,
    capabilities,
    capabilityUseCases: capabilityUseCases.map((record): SeedRow => {
      const capability = capabilities.find((item) => item.id === record.capability_id);
      const company = companies.find((item) => item.id === capability?.company_id);
      const geography = (company?.geography ?? "global") as "canada" | "nato" | "global";

      return {
        ...record,
        ranking_score: calculateLegacySeedRanking({
          relevanceBand: record.relevance_band as "low" | "medium" | "high",
          pathway: record.pathway as "build" | "validate" | "scale",
          defenceRelevance: record.defence_relevance as "low" | "medium" | "high",
          geography,
          lastSignalAt: (record.last_signal_at as string | null) ?? null,
          evidenceStrength: Number(record.evidence_strength),
          actionabilityScore: Number(record.actionability_score),
          reviewerOverrideDelta: Number(record.reviewer_override_delta)
        })
      };
    }),
    signals,
    sources,
    evidenceSnippets,
    fieldCitations,
    observations
  };
}
