export interface RankedSourceBookRow {
  name: string;
  url: string;
  score: number;
  kinds: string[];
  yield: string;
}

export function parseSourceBookCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const [headers = [], ...values] = rows;
  return values.map((columns) => Object.fromEntries(headers.map((header, index) => [header, columns[index] ?? ""])));
}

export function rankSourceBookRows(rows: Array<Record<string, string>>, targetKinds: string[] = []): RankedSourceBookRow[] {
  return rows.map((row) => {
    let score = 0;
    if (row.status === "active") score += 10;
    if (row.credibility === "high") score += 20;
    else if (row.credibility === "moderate") score += 10;
    if ((row.geography ?? "").toLowerCase().includes("canada")) score += 25;
    if (row.expected_organization_yield === "high") score += 25;
    else if (row.expected_organization_yield === "medium") score += 15;
    if (row.last_successful_discovery) score += 10;
    if (row.refresh_cadence) score += 5;
    if (row.recursive_follow_up_urls) score += 5;
    const kinds = (row.organization_kinds ?? "").split("|").filter(Boolean);
    if (targetKinds.some((kind) => kinds.includes(kind))) score += 20;
    return { name: row.name, url: row.url, score, kinds, yield: row.expected_organization_yield || "unknown" };
  }).sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));
}
