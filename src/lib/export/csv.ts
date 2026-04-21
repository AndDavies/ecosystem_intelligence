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
