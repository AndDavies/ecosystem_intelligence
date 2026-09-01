import type { AtlasQuery } from "@/types/atlas";

export const organizationLevelProgramExportNote = "Program filters apply to reviewed organization participation only. Owned capabilities are omitted and are not attributed to the program.";

export function atlasResultsCapabilityExportScope(query: AtlasQuery) {
  return query.program
    ? { includeCapabilities: false, note: organizationLevelProgramExportNote }
    : { includeCapabilities: true, note: "" };
}

export function escapeCsvValue(value: string | number | null | undefined) {
  const normalized = value === null || value === undefined ? "" : String(value);

  if (!/[",\n\r]/.test(normalized)) {
    return normalized;
  }

  return `"${normalized.replaceAll('"', '""')}"`;
}

export function buildCsv(header: string[], rows: Array<Array<string | number | null | undefined>>) {
  return [header.map((value) => escapeCsvValue(value)).join(","), ...rows.map((row) => row.map((value) => escapeCsvValue(value)).join(","))].join("\n");
}
