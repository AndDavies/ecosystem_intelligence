import { readFile } from "node:fs/promises";
import path from "node:path";
import { calculateRankingScore } from "../src/lib/scoring";

export const seedDir = path.join(process.cwd(), "supabase", "seed");
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

export async function readCsv(fileName: string): Promise<SeedRow[]> {
  const content = await readFile(path.join(seedDir, fileName), "utf8");
  const [headerLine, ...lines] = content.trim().split("\n");
  const headers = headerLine.split(",").map((item) => item.trim());

  return lines.map((line) => {
    const cells = line.split(",").map((item) => item.trim());
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
        ranking_score: calculateRankingScore({
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
