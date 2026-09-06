import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { assertDeployedResearchReviewContract } from './deployment-contract';
import { boundedMap } from './bounded-map';

export type SnapshotRow = Record<string, unknown>;
export interface OperatorSnapshot {
  schemaVersion: 'research_operator_snapshot_v1';
  runId: string;
  projectId: string;
  collectedAt: string;
  completedAt: string;
  targetSlugs: string[];
  deployedContract: Record<string, unknown>;
  tables: Record<string, SnapshotRow[]>;
}
export async function readAllPages<T>(read: (offset: number, limit: number) => Promise<T[]>, size = 500) {
  const rows: T[] = [];
  for (let offset = 0; ; offset += size) {
    const page = await read(offset, size);
    rows.push(...page);
    if (page.length < size) return rows;
  }
}
export async function captureOperatorSnapshot(runId: string, slugs: string[]): Promise<OperatorSnapshot> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Private snapshot requires the approved Supabase operator credentials.');
  const projectId = new URL(url).hostname.split('.')[0];
  if (projectId !== 'facoactpdckkhciamflk') throw new Error('Snapshot requires the canonical production project.');
  if (!slugs.length || slugs.length > 50 || new Set(slugs).size !== slugs.length) throw new Error('Supply 1–50 unique exact target slugs.');
  const collectedAt = new Date().toISOString();
  const client = createClient(url, key, {auth: {persistSession: false, autoRefreshToken: false}});
  const read = (table: string, columns: string, filter?: [string, string[]], published = false, order = 'id') => readAllPages(async (offset, size) => {
    let query = client.from(table).select(columns).order(order).range(offset, offset + size - 1);
    if (table === 'capability_domains') query = query.order('technical_domain_id');
    if (filter) query = query.in(filter[0], filter[1]);
    if (published) query = query.eq('publication_status', 'published');
    const {data,error} = await query;
    if (error) throw new Error(`Snapshot read failed for ${table} (${error.code}); no partial snapshot was saved.`);
    return data as unknown as SnapshotRow[];
  });
  const organizations = await read('organizations', '*', ['slug',slugs], true);
  if (organizations.length !== slugs.length) throw new Error('Every target must resolve to one published organization.');
  const ids = organizations.map(o => String(o.id));
  const tables: OperatorSnapshot['tables'] = {organizations};
  await boundedMap(['capabilities','organization_locations','organization_aliases','program_participations','organization_relationships','funding_events'], 3, async table => {
    tables[table] = await read(table, '*', ['organization_id',ids]);
  });
  const capabilityIds = tables.capabilities.map(c => String(c.id));
  await boundedMap(['programs','mission_areas','technical_domains','demand_requirements'], 3, async table => {tables[table] = await read(table, '*', undefined, true);});
  tables.identities = await read('organizations', 'id,slug,name,legal_name,website_url,entity_kind,editorial_profile_version,updated_at', undefined, true);
  const relatedIds=[...new Set(tables.organization_relationships.map(r=>r.related_organization_id).filter((id): id is string=>typeof id==='string'))];
  tables.relatedIdentities=relatedIds.length ? await read('organizations','id,slug,name',['id',relatedIds]) : [];
  tables.aliases = await read('organization_aliases', '*');
  tables.activeCandidates = await read('candidate_changes', 'id,client_candidate_id,target_entity_id,status', ['status',['pending','approved']]);
  tables.capability_domains = capabilityIds.length ? await read('capability_domains', '*', ['capability_id',capabilityIds], true, 'capability_id') : [];
  tables.mission_matches = capabilityIds.length ? await read('capability_mission_matches', '*', ['capability_id',capabilityIds], true) : [];
  if (capabilityIds.length) {
    if (JSON.stringify(await read('capability_domains','*',['capability_id',capabilityIds],true,'capability_id')) !== JSON.stringify(tables.capability_domains) || JSON.stringify(await read('capability_mission_matches','*',['capability_id',capabilityIds],true)) !== JSON.stringify(tables.mission_matches)) throw new Error('Capability links changed during capture.');
  }
  // REST is not a transaction. Detect target/child graph drift across the bounded capture.
  await boundedMap(['capabilities','organization_locations','organization_aliases','program_participations','organization_relationships','funding_events'], 3, async table => {
    if (JSON.stringify(await read(table, '*', ['organization_id',ids])) !== JSON.stringify(tables[table])) throw new Error('Child graph changed during capture; retry with a new snapshot.');
  });
  const after = await read('organizations', '*', ['slug',slugs], true);
  if (JSON.stringify(after) !== JSON.stringify(organizations)) throw new Error('Targets changed during capture; retry with a new snapshot.');
  const deployedContract = await assertDeployedResearchReviewContract([], {phase:'preparation'});
  return {schemaVersion:'research_operator_snapshot_v1', runId, projectId, collectedAt, completedAt:new Date().toISOString(), targetSlugs:slugs, deployedContract, tables};
}
export async function writeImmutableSnapshot(file: string, snapshot: OperatorSnapshot) {
  await mkdir(path.dirname(file), {recursive: true});
  const raw = JSON.stringify(snapshot, null, 2) + '\n';
  await writeFile(file, raw, {flag:'wx',mode:0o600});
  return createHash('sha256').update(raw).digest('hex');
}
export async function loadOperatorSnapshot(file: string) {
  const raw = await readFile(file, 'utf8');
  const value = JSON.parse(raw) as OperatorSnapshot;
  if (value.schemaVersion !== 'research_operator_snapshot_v1' || value.projectId !== 'facoactpdckkhciamflk' || !value.tables?.organizations) throw new Error('Invalid operator snapshot.');
  return {snapshot:value, digest:createHash('sha256').update(raw).digest('hex')};
}

export function normalizedChildBaseline(snapshot: OperatorSnapshot, kind: string, id: string, organizationId: string) {
  const table = {capability:'capabilities', program_participation:'program_participations', organization_relationship:'organization_relationships', funding_event:'funding_events'}[kind];
  if (!table) throw new Error('Unsupported child type.');
  const row = snapshot.tables[table]?.find(r => r.id === id && r.organization_id === organizationId && r.publication_status === 'published');
  if (!row) throw new Error('Child is not in this published target snapshot.');
  const fields = kind === 'capability'
    ? ['name','summary','capability_type','features','applications','technical_tags','technology_readiness_level','maturity','commercial_availability']
    : kind === 'program_participation' ? ['participation_type','cohort_label','public_summary','lifecycle_stage','announced_on','started_on','ended_on','external_identifiers']
    : kind === 'funding_event' ? ['event_type','announced_on','amount_value','amount_currency','disclosed_summary']
    : ['related_organization_name','relationship_type','public_summary'];
  const result: SnapshotRow = Object.fromEntries(fields.map(k => [k.replace(/_([a-z])/g, (_,c:string)=>c.toUpperCase()), row[k] ?? null]));
  if (kind === 'capability') {
    result.features = row.core_features ?? [];
    result.applications = row.defence_applications ?? [];
    result.technicalDomainSlugs = snapshot.tables.capability_domains.filter(d => d.capability_id === id).map(d => snapshot.tables.technical_domains.find(t => t.id === d.technical_domain_id)?.slug).filter(Boolean).sort();
    result.missionMatches = snapshot.tables.mission_matches.filter(m => m.capability_id === id && m.review_status === 'approved' && snapshot.tables.mission_areas.some(a=>a.id===m.mission_area_id)).map(m => ({missionAreaSlug:snapshot.tables.mission_areas.find(a => a.id === m.mission_area_id)?.slug, alignmentSummary:m.alignment_summary, matchClass:'derived', confidence:m.confidence})).sort((a,b) => String(a.missionAreaSlug).localeCompare(String(b.missionAreaSlug)));
  }
  if (kind === 'organization_relationship') {
    const related = (snapshot.tables.relatedIdentities ?? snapshot.tables.identities).find(o => o.id === row.related_organization_id);
    result.relatedOrganizationName = row.related_organization_name ?? related?.name ?? null;
    result.relatedOrganizationSlug = related?.slug ?? null;
  }
  return result;
}
