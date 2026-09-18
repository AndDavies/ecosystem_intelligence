import { selectAssistantOrganizations } from "./assistant";
import type { AtlasAssistantPriorTurn, AtlasSnapshot } from "@/types/atlas";

/** Union independent catalogue views before reranking; never confuse a pool with full coverage. */
export function retrieveAssistantPool(snapshot: AtlasSnapshot, query: string, priorTurns: AtlasAssistantPriorTurn[], limit: number) {
  const original = new Map(snapshot.organizations.map(org => [org.id, org]));
  const rank = (view: AtlasSnapshot) => selectAssistantOrganizations(view, query, priorTurns, snapshot.organizations.length);
  const channels = [
    rank(snapshot),
    rank({ ...snapshot, organizations: snapshot.organizations.map(org => ({ ...org,
      description: org.capabilities.flatMap(cap => [cap.summary, ...cap.coreFeatures, ...cap.defenceApplications]).join(" ") })) }),
    rank({ ...snapshot, organizations: snapshot.organizations.map(org => ({ ...org,
      description: [...org.categories, org.entityKind, ...org.programs.map(p => p.programName),
        ...org.capabilities.flatMap(cap => [...cap.technicalDomains.map(d => `${d.name} ${d.summary}`),
          ...cap.missionMatches.map(m => `${m.missionArea.name} ${m.alignmentSummary}`), ...cap.demandMatches.map(m => `${m.demandTitle} ${m.alignmentSummary}`)])].join(" ") })) })
  ];
  const ids = new Set<string>();
  const normalized = ` ${query.toLowerCase().replace(/[^a-z0-9]+/g," ").trim()} `;
  for (const org of channels[0]) if ([org.name,org.legalName].some(name => name && normalized.includes(` ${name.toLowerCase().replace(/[^a-z0-9]+/g," ").trim()} `))) ids.add(org.id);
  for (let i=0; ids.size < Math.min(limit,original.size) && i<original.size; i++) {
    for (const channel of channels) { if (ids.size >= limit) break; if (channel[i]) ids.add(channel[i].id); }
  }
  return [...ids].map(id => original.get(id)!);
}
