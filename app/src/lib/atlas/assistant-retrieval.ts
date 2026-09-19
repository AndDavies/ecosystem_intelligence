import { assistantQueryTerms, selectAssistantOrganizations } from "./assistant";
import type { AtlasAssistantPriorTurn, AtlasOrganization, AtlasSnapshot } from "@/types/atlas";

const normalize = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const concepts = [
  ["maintenance", "maintain", "diagnostics", "deterioration", "monitoring", "sustainment"],
  ["intermittent", "offline", "connectivity", "bandwidth", "telemetry", "edge"],
  ["expert", "technician", "guidance", "collaboration", "assistance"],
  ["waterfront", "dockside", "harbour", "testing", "facilities", "testbed"]
];

/** Distinct field ranks fused before Jev; a bounded pool is never full coverage. */
export function retrieveAssistantPool(snapshot: AtlasSnapshot, query: string, priorTurns: AtlasAssistantPriorTurn[], limit: number) {
  const terms = assistantQueryTerms(query);
  const expanded = new Set(terms.expanded);
  for (const group of concepts) if (group.some(word => terms.direct.includes(word))) group.forEach(word => expanded.add(word));
  const fieldRank = (fields: (org: AtlasOrganization) => Array<[string, number]>) => snapshot.organizations.map(org => {
    const score = fields(org).reduce((total, [text, weight]) => {
      const words = new Set(normalize(text).split(/\s+/));
      return total + weight * (terms.direct.filter(t => words.has(t)).length * 4 + [...expanded].filter(t => !terms.direct.includes(t) && words.has(t)).length);
    }, 0);
    return { org, score };
  }).sort((a,b) => b.score - a.score || a.org.id.localeCompare(b.org.id)).filter(row => row.score > 0).map(row => row.org);
  const lexical = selectAssistantOrganizations(snapshot, query, priorTurns, snapshot.organizations.length);
  const channels = [lexical,
    fieldRank(org => org.capabilities.flatMap(cap => [[cap.name, 3], [cap.summary, 2], [[...cap.coreFeatures, ...cap.defenceApplications].join(" "), 2]] as Array<[string,number]>)),
    fieldRank(org => [[`${org.entityKind} ${org.categories.join(" ")} ${org.programs.map(p => p.programName).join(" ")}`, 2],
      [org.capabilities.flatMap(cap => [...cap.technicalDomains.map(d => d.name), ...cap.missionMatches.map(m => m.missionArea.name), ...cap.demandMatches.map(m => m.demandTitle)]).join(" "), 1]])
  ];
  const scores = new Map<string,number>();
  channels.forEach(channel => channel.forEach((org, rank) => scores.set(org.id, (scores.get(org.id) ?? 0) + 1/(60+rank+1))));
  const normalized = ` ${normalize(query)} `;
  const referential = /\b(those|these|of them|that company|that organization)\b/i.test(query);
  const prior = new Set(referential ? priorTurns.at(-1)?.organizationIds : []);
  const pinned = (org: AtlasOrganization) => prior.has(org.id) || [org.name,org.legalName].some(name => name && normalized.includes(` ${normalize(name)} `));
  return [...snapshot.organizations].sort((a,b) => Number(pinned(b))-Number(pinned(a)) || (scores.get(b.id) ?? 0)-(scores.get(a.id) ?? 0) || a.id.localeCompare(b.id))
    .slice(0, Math.max(0, Math.min(limit, snapshot.organizations.length)));
}
