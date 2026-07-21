import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  DEFENCE_WIKI_PACKET_VERSION,
  compactWikiText,
  defenceSourcePacketV1Schema,
  safeWikiSourceUrl,
  stableWikiPacketHash,
  type DefenceSourcePacketV1
} from "../src/lib/research/defence-wiki-contract";
import { parseSourceBookCsv } from "../src/lib/research/source-ranking";
import { loadScriptEnv } from "./load-env";

loadScriptEnv();

type Row = Record<string, unknown>;
type Mode = "inventory" | "export";

const PAGE_SIZE = 500;
const workspaceRoot = path.resolve(process.cwd(), "..");

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function flag(name: string) {
  return process.argv.includes(name);
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asObject(value: unknown): Row {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function isoDate(value: unknown) {
  const raw = asString(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function hostname(value: string | null) {
  if (!value) return "unknown-source";
  try {
    return new URL(value).hostname.toLocaleLowerCase("en-CA").replace(/^www\./, "");
  } catch {
    return "unknown-source";
  }
}

function byId(rows: Row[]) {
  return new Map(rows.map((row) => [asString(row.id), row]));
}

function groupBy(rows: Row[], key: string) {
  const grouped = new Map<string, Row[]>();
  for (const row of rows) {
    const value = asString(row[key]);
    if (!value) continue;
    grouped.set(value, [...(grouped.get(value) ?? []), row]);
  }
  return grouped;
}

async function readAll(client: SupabaseClient, table: string, configure?: (query: any) => any) {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = client.from(table).select("*").order("id", { ascending: true });
    if (configure) query = configure(query);
    const result = await query.range(from, from + PAGE_SIZE - 1);
    if (result.error) throw new Error(`${table} read failed: ${result.error.message}`);
    const page = (result.data ?? []) as Row[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();
  if (!url || !key) throw new Error("Production public database configuration is required.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    global: { headers: { "X-Client-Info": "true-north-map-defence-wiki-read-only-export" } }
  });
}

function freshness(date: string | null) {
  if (!date) return "unknown" as const;
  const days = (Date.now() - new Date(date).getTime()) / 86_400_000;
  if (days <= 120) return "current" as const;
  if (days <= 365) return "review_due" as const;
  return "stale" as const;
}

function authorityFor(kind: string, publisher = ""): DefenceSourcePacketV1["authorityTier"] {
  const value = `${kind} ${publisher}`.toLocaleLowerCase("en-CA");
  if (/government|official|company|nato|dnd|department|ministry|research_lab|procurement_portal|standards_body/u.test(value)) return "primary";
  if (/publication|industry_association|conference|newsletter/u.test(value)) return "specialist";
  if (/social|linkedin|youtube|reddit/u.test(value)) return "community";
  return "unknown";
}

async function loadAtlasUniverse(client: SupabaseClient) {
  const [sources, evidence, citations, organizations, capabilities, demandSources, demandRequirements, missionAreas, technicalDomains] = await Promise.all([
    readAll(client, "sources", (query) => query.eq("visibility", "public").eq("public_approved", true)),
    readAll(client, "evidence_snippets", (query) => query.eq("visibility", "public").eq("public_approved", true)),
    readAll(client, "field_citations"),
    readAll(client, "organizations", (query) => query.eq("publication_status", "published")),
    readAll(client, "capabilities", (query) => query.eq("publication_status", "published")),
    readAll(client, "demand_sources", (query) => query.eq("publication_status", "published")),
    readAll(client, "demand_requirements", (query) => query.eq("publication_status", "published")),
    readAll(client, "mission_areas", (query) => query.eq("publication_status", "published")),
    readAll(client, "technical_domains", (query) => query.eq("publication_status", "published"))
  ]);
  return { sources, evidence, citations, organizations, capabilities, demandSources, demandRequirements, missionAreas, technicalDomains };
}

function entityDescriptor(entityType: string, entityId: string, lookups: Record<string, Map<string, Row>>) {
  const normalizedType = entityType.replace(/s$/u, "");
  const row = lookups[normalizedType]?.get(entityId);
  if (!row) return null;
  if (normalizedType === "organization") {
    return { label: asString(row.name), concepts: asStringArray(row.organization_categories), geography: ["Canada"] };
  }
  if (normalizedType === "capability") {
    return { label: asString(row.name), concepts: unique([asString(row.capability_type), ...asStringArray(row.technical_tags), ...asStringArray(row.defence_applications)]), geography: ["Canada"] };
  }
  if (normalizedType === "demand_requirement") {
    return { label: asString(row.title), concepts: [asString(row.title)], geography: ["Canada", "Allied"] };
  }
  if (normalizedType === "demand_source") {
    return { label: asString(row.title), concepts: [asString(row.title)], geography: ["Canada", "Allied"] };
  }
  if (normalizedType === "mission_area") {
    return { label: asString(row.name), concepts: [asString(row.name)], geography: ["Canada"] };
  }
  if (normalizedType === "technical_domain") {
    return { label: asString(row.name), concepts: [asString(row.name)], geography: ["Canada"] };
  }
  return null;
}

function buildPublishedEvidencePackets(universe: Awaited<ReturnType<typeof loadAtlasUniverse>>) {
  const evidenceBySource = groupBy(universe.evidence, "source_id");
  const citationsByEvidence = groupBy(universe.citations, "evidence_snippet_id");
  const demandBySource = groupBy(universe.demandSources, "source_id");
  const lookups: Record<string, Map<string, Row>> = {
    organization: byId(universe.organizations),
    capability: byId(universe.capabilities),
    demand_source: byId(universe.demandSources),
    demand_requirement: byId(universe.demandRequirements),
    mission_area: byId(universe.missionAreas),
    technical_domain: byId(universe.technicalDomains)
  };
  const generatedAt = new Date().toISOString();

  return universe.sources.flatMap((source): DefenceSourcePacketV1[] => {
    const sourceId = asString(source.id);
    const sourceEvidence = evidenceBySource.get(sourceId) ?? [];
    const citationRows = sourceEvidence.flatMap((item) => citationsByEvidence.get(asString(item.id)) ?? []);
    const descriptors = citationRows
      .map((citation) => entityDescriptor(asString(citation.entity_type), asString(citation.entity_id), lookups))
      .filter((value): value is NonNullable<typeof value> => Boolean(value));
    const linkedDemand = demandBySource.get(sourceId) ?? [];
    if (!sourceEvidence.length && !linkedDemand.length) return [];
    const sourceType = asString(source.source_type) || "public_source";
    const publisher = asString(source.publisher) || "Unknown publisher";
    const canonicalUrl = safeWikiSourceUrl(source.canonical_url);
    if (!canonicalUrl) return [];
    const evidenceText = sourceEvidence.map((row) => asString(row.excerpt)).filter(Boolean).join("\n\n");
    const entities = unique(descriptors.map((descriptor) => descriptor.label));
    const concepts = unique([
      ...descriptors.flatMap((descriptor) => descriptor.concepts),
      ...linkedDemand.map((row) => asString(row.title))
    ]);
    const relatedTrueNorthIds = unique([
      ...citationRows.map((row) => `${asString(row.entity_type)}:${asString(row.entity_id)}`),
      ...linkedDemand.map((row) => `demand_source:${asString(row.id)}`)
    ]);
    const authorityTier = authorityFor(sourceType, publisher);
    const publishedAt = isoDate(source.published_at);
    const packetBase: Omit<DefenceSourcePacketV1, "contentHash" | "generatedAt"> = {
      schemaVersion: DEFENCE_WIKI_PACKET_VERSION,
      packetId: `true_north_map:source:${sourceId}`,
      sourceSystem: "true_north_map",
      sourceRecordIds: unique([`source:${sourceId}`, ...sourceEvidence.map((row) => `evidence:${asString(row.id)}`)]),
      sourceKind: sourceType,
      title: asString(source.title) || "Published True North Map source",
      publisher,
      sourceFamily: hostname(canonicalUrl),
      authorityTier,
      canonicalUrl,
      publishedAt,
      capturedAt: isoDate(source.accessed_at),
      relevantExcerpt: compactWikiText(evidenceText || asString(source.notes), 2200),
      summary: compactWikiText(source.notes, 1600) || null,
      selectionReasons: ["published_evidence"],
      defenceRelevanceReason: "Approved public evidence supports a published True North Map organization, capability, demand signal, Mission Area, or Technical Domain.",
      canadaRelevanceReason: "The source is connected to Canada-first True North Map records or an allied demand source used to interpret Canadian opportunity and capability.",
      concepts,
      entities,
      geography: unique(descriptors.flatMap((descriptor) => descriptor.geography)),
      labels: [],
      sourceConfidence: authorityTier === "primary" ? "high" : "moderate",
      evidenceRole: authorityTier === "primary" ? "primary" : "supporting",
      freshness: freshness(publishedAt ?? isoDate(source.accessed_at)),
      claimRisk: linkedDemand.length ? "mixed" : "needs_verification",
      visibility: "public",
      reusePolicy: "public_reference",
      needsVerification: false,
      relatedTrueNorthIds
    };
    return [defenceSourcePacketV1Schema.parse({ ...packetBase, contentHash: stableWikiPacketHash(packetBase), generatedAt })];
  });
}

function buildSourceBookPackets(rows: Array<Record<string, string>>) {
  const generatedAt = new Date().toISOString();
  return rows.flatMap((row): DefenceSourcePacketV1[] => {
    const canonicalUrl = safeWikiSourceUrl(row.url);
    const active = row.status === "active";
    const mapped = Boolean(row.mission_area_fit || row.domain_fit);
    if (!canonicalUrl || !active || !mapped) return [];
    const sourceId = createHash("sha256").update(canonicalUrl).digest("hex").slice(0, 20);
    const authorityTier = authorityFor(row.source_kind, row.name);
    const sourceConfidence = row.credibility === "high" ? "high" as const : row.credibility === "moderate" ? "moderate" as const : "needs_review" as const;
    const excerpt = compactWikiText([row.coverage_notes, row.search_notes, row.recurring_feed_notes].filter(Boolean).join(" "), 2200);
    const packetBase: Omit<DefenceSourcePacketV1, "contentHash" | "generatedAt"> = {
      schemaVersion: DEFENCE_WIKI_PACKET_VERSION,
      packetId: `true_north_map:source_book:${sourceId}`,
      sourceSystem: "true_north_map",
      sourceRecordIds: [`source_book:${sourceId}`],
      sourceKind: row.source_kind || "research_lead",
      title: row.name || hostname(canonicalUrl),
      publisher: row.canonical_domain_owner || row.name || hostname(canonicalUrl),
      sourceFamily: hostname(canonicalUrl),
      authorityTier,
      canonicalUrl,
      publishedAt: null,
      capturedAt: row.last_checked ? isoDate(`${row.last_checked}T00:00:00.000Z`) : null,
      relevantExcerpt: excerpt,
      summary: compactWikiText(row.coverage_notes, 1600) || null,
      selectionReasons: ["source_book_fit"],
      defenceRelevanceReason: "Active durable source mapped in the Global Source Book to at least one True North Map Mission Area or Technical Domain.",
      canadaRelevanceReason: /canada|canadian|all mission areas/iu.test([row.geography, row.coverage_notes, row.mission_area_fit].join(" "))
        ? "The source is Canadian, Canada-facing, or mapped across Canada-first Mission Areas."
        : "Global or allied source retained to identify relevant demand, benchmarks, partners, competitors, or industrial gaps for Canada.",
      concepts: unique([...(row.mission_area_fit ?? "").split("|"), ...(row.domain_fit ?? "").split("|")]),
      entities: [],
      geography: unique((row.geography ?? "").split("|")),
      labels: unique([row.source_kind, row.recurring_feed_available === "yes" ? "recurring_feed" : null]),
      sourceConfidence,
      evidenceRole: "research_lead",
      freshness: freshness(row.last_checked ? `${row.last_checked}T00:00:00.000Z` : null),
      claimRisk: "needs_verification",
      visibility: "public",
      reusePolicy: "citation_only",
      needsVerification: true,
      relatedTrueNorthIds: []
    };
    return [defenceSourcePacketV1Schema.parse({ ...packetBase, contentHash: stableWikiPacketHash(packetBase), generatedAt })];
  });
}

function tally(values: string[]) {
  return Object.fromEntries([...values.reduce((map, value) => map.set(value || "unknown", (map.get(value || "unknown") ?? 0) + 1), new Map<string, number>())]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])));
}

function sample<T>(items: T[], size: number, key: (value: T) => string) {
  return [...items]
    .sort((a, b) => createHash("sha256").update(key(a)).digest("hex").localeCompare(createHash("sha256").update(key(b)).digest("hex")))
    .slice(0, size);
}

function buildInventory(
  universe: Awaited<ReturnType<typeof loadAtlasUniverse>>,
  sourceBookRows: Array<Record<string, string>>,
  packets: DefenceSourcePacketV1[],
  sampleSize: number
) {
  return {
    schemaVersion: "defence-wiki-inventory-v1",
    generatedAt: new Date().toISOString(),
    sourceSystem: "true_north_map",
    universe: {
      sourceBookRows: sourceBookRows.length,
      activeSourceBookRows: sourceBookRows.filter((row) => row.status === "active").length,
      publicApprovedSources: universe.sources.length,
      publicApprovedEvidenceSnippets: universe.evidence.length,
      fieldCitations: universe.citations.length,
      publishedOrganizations: universe.organizations.length,
      publishedCapabilities: universe.capabilities.length,
      publishedDemandSources: universe.demandSources.length,
      publishedDemandRequirements: universe.demandRequirements.length,
      publishedMissionAreas: universe.missionAreas.length,
      publishedTechnicalDomains: universe.technicalDomains.length
    },
    selection: {
      packets: packets.length,
      sourceBookLeads: packets.filter((packet) => packet.selectionReasons.includes("source_book_fit")).length,
      publishedEvidencePackets: packets.filter((packet) => packet.selectionReasons.includes("published_evidence")).length,
      bySourceKind: tally(packets.map((packet) => packet.sourceKind)),
      byAuthority: tally(packets.map((packet) => packet.authorityTier)),
      byEvidenceRole: tally(packets.map((packet) => packet.evidenceRole)),
      byConfidence: tally(packets.map((packet) => packet.sourceConfidence)),
      byFreshness: tally(packets.map((packet) => packet.freshness)),
      byGeography: tally(packets.flatMap((packet) => packet.geography)),
      byConcept: tally(packets.flatMap((packet) => packet.concepts)),
      byReason: tally(packets.flatMap((packet) => packet.selectionReasons))
    },
    selectedSample: sample(packets, sampleSize, (packet) => packet.packetId).map((packet) => ({
      packetId: packet.packetId,
      title: packet.title,
      sourceKind: packet.sourceKind,
      reasons: packet.selectionReasons,
      concepts: packet.concepts,
      canonicalUrl: packet.canonicalUrl
    }))
  };
}

function inventoryMarkdown(inventory: ReturnType<typeof buildInventory>) {
  return [
    "# True North Map Defence Wiki Source Inventory",
    "",
    `Generated: ${inventory.generatedAt}`,
    "",
    "## Universe",
    "",
    ...Object.entries(inventory.universe).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Selection",
    "",
    `- Packets: ${inventory.selection.packets}`,
    `- Source-book research leads: ${inventory.selection.sourceBookLeads}`,
    `- Published-evidence packets: ${inventory.selection.publishedEvidencePackets}`,
    `- Authority mix: ${JSON.stringify(inventory.selection.byAuthority)}`,
    `- Evidence roles: ${JSON.stringify(inventory.selection.byEvidenceRole)}`,
    `- Freshness: ${JSON.stringify(inventory.selection.byFreshness)}`,
    `- Selection reasons: ${JSON.stringify(inventory.selection.byReason)}`,
    "",
    "## Selected sample",
    "",
    ...inventory.selectedSample.map((item) => `- **${item.title}** — ${item.sourceKind}; ${item.reasons.join(", ")}; ${item.canonicalUrl ?? "no public URL"}`),
    "",
    "Source-book rows remain research leads until a durable page is retrieved and verified. This report does not publish or promote any source.",
    ""
  ].join("\n");
}

function packetFileName(packet: DefenceSourcePacketV1) {
  return `${packet.packetId.replace(/[^a-z0-9]+/gi, "-").toLocaleLowerCase("en-CA")}.json`;
}

async function existingHashes(rawDir: string) {
  const hashes = new Map<string, string>();
  try {
    for (const file of (await readdir(rawDir)).filter((name) => name.startsWith("true-north-map-") && name.endsWith(".json"))) {
      try {
        const parsed = defenceSourcePacketV1Schema.parse(JSON.parse(await readFile(path.join(rawDir, file), "utf8")));
        hashes.set(file, parsed.contentHash);
      } catch {
        hashes.set(file, "invalid");
      }
    }
  } catch {
    return hashes;
  }
  return hashes;
}

async function writeReports(reportDir: string, inventory: ReturnType<typeof buildInventory>) {
  await mkdir(reportDir, { recursive: true });
  await writeFile(path.join(reportDir, "true-north-map-defence-source-inventory.json"), `${JSON.stringify(inventory, null, 2)}\n`, "utf8");
  await writeFile(path.join(reportDir, "true-north-map-defence-source-inventory.md"), inventoryMarkdown(inventory), "utf8");
}

async function main() {
  const mode = (process.argv[2] ?? "inventory") as Mode;
  if (mode !== "inventory" && mode !== "export") throw new Error("Use inventory or export.");
  const root = argument("--root") ?? process.env.TNM_DEFENCE_WIKI_ROOT?.trim();
  if (mode === "export" && !root) throw new Error("Export requires --root or TNM_DEFENCE_WIKI_ROOT.");
  const reportDir = argument("--report-dir") ?? (root ? path.join(root, "outputs") : null);
  const dryRun = flag("--dry-run") || mode === "inventory";
  const sampleSize = Math.max(5, Math.min(50, Number(argument("--sample-size") ?? 20)));
  const sourceBookPath = path.join(workspaceRoot, "research", "source-book", "known-sources.csv");
  const sourceBookRows = parseSourceBookCsv(await readFile(sourceBookPath, "utf8"));
  const universe = await loadAtlasUniverse(publicClient());
  const packets = [...buildPublishedEvidencePackets(universe), ...buildSourceBookPackets(sourceBookRows)]
    .sort((left, right) => left.packetId.localeCompare(right.packetId));
  const inventory = buildInventory(universe, sourceBookRows, packets, sampleSize);
  if (reportDir) await writeReports(reportDir, inventory);

  let written = 0;
  let changed = 0;
  let unchanged = 0;
  let missingPriorPackets = 0;
  if (mode === "export" && root) {
    const rawDir = path.join(root, "raw");
    const existing = await existingHashes(rawDir);
    const selected = new Set<string>();
    if (!dryRun) await mkdir(rawDir, { recursive: true });
    for (const packet of packets) {
      const file = packetFileName(packet);
      selected.add(file);
      const prior = existing.get(file);
      if (prior === packet.contentHash) {
        unchanged += 1;
        continue;
      }
      if (prior) changed += 1;
      if (!dryRun) {
        await writeFile(path.join(rawDir, file), `${JSON.stringify(packet, null, 2)}\n`, "utf8");
        written += 1;
      }
    }
    missingPriorPackets = [...existing.keys()].filter((file) => !selected.has(file)).length;
  }

  process.stdout.write(`${JSON.stringify({
    mode,
    dryRun,
    packetSchema: DEFENCE_WIKI_PACKET_VERSION,
    selected: packets.length,
    written,
    changed,
    unchanged,
    missingPriorPackets,
    reportDir
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
