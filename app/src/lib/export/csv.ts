import type { AtlasCapability, AtlasQuery } from "@/types/atlas";

export const organizationLevelProgramExportNote = "Program filters apply to reviewed organization participation only. Owned capabilities are omitted and are not attributed to the program.";

export function atlasResultsCapabilityExportScope(query: AtlasQuery) {
  if (query.capabilityIds || query.discovery) return { includeCapabilities: true, note: "Capabilities are limited to the saved discovery selection. This export contains current published records, not a new Ask assessment." };
  return query.program
    ? { includeCapabilities: false, note: organizationLevelProgramExportNote }
    : { includeCapabilities: true, note: "" };
}

export function escapeCsvValue(value: string | number | null | undefined, options: { alwaysQuote?: boolean } = {}) {
  let normalized = value === null || value === undefined ? "" : String(value);
  // Quoting protects CSV structure, not spreadsheet formula interpretation.
  // Preserve actual numbers (including negatives); untrusted strings stay text.
  let significantPrefix: string | undefined;
  for (const character of normalized) {
    const code = character.charCodeAt(0);
    if (character.trim() !== "" && code > 31 && (code < 127 || code > 159)) {
      significantPrefix = character;
      break;
    }
  }
  if (typeof value === "string" && ((significantPrefix !== undefined && "=+-@".includes(significantPrefix)) || /^[\t\r\n]/.test(value))) {
    normalized = `'${value}`;
  }

  if (!options.alwaysQuote && !/[",\n\r]/.test(normalized)) {
    return normalized;
  }

  return `"${normalized.replaceAll('"', '""')}"`;
}

export function buildCsv(header: string[], rows: Array<Array<string | number | null | undefined>>) {
  return [header.map((value) => escapeCsvValue(value)).join(","), ...rows.map((row) => row.map((value) => escapeCsvValue(value)).join(","))].join("\n");
}

export function atlasResultsCapabilities(capabilities: AtlasCapability[], query: AtlasQuery) {
  if (!atlasResultsCapabilityExportScope(query).includeCapabilities) return [];
  if (query.capabilityIds || query.discovery) return capabilities.filter(capability => query.capabilityIds?.includes(capability.id));
  return capabilities;
}
