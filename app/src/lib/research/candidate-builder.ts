import { createHash } from 'node:crypto';
import {
  organizationRefreshOperationV2Schema, validateOrganizationRefreshV2Field,
  type OrganizationRefreshBundleV2, type ResearchClaimLedgerV1
} from './pipeline-schema';

type Operation = OrganizationRefreshBundleV2['operations'][number];
type Claim = ResearchClaimLedgerV1['claims'][number];
export type RefreshChange =
  | { operation: 'set_field'; field: Extract<Operation, {operation: 'set_field'}>['field']; after: unknown; reviewerExplanation: string }
  | { operation: 'set_profile_field'; profileField: string; after: unknown; reviewerExplanation: string }
  | { operation: 'add_child'; entityType: Extract<Operation, {operation: 'add_child'}>['entityType']; value: Record<string, unknown>; reviewerExplanation: string }
  | { operation: 'update_child'; entityType: Extract<Operation, {operation: 'update_child'}>['entityType']; targetId: string; after: Record<string, unknown>; reviewerExplanation: string };
export interface LeafSupport { leaf: string; claimId: string; claimClass: 'source_backed' | 'derived' }

export function stableResearchId(prefix: string, value: unknown) {
  return `${prefix}-${createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16)}`;
}
export function publicLeaves(value: unknown, prefix: string): string[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => publicLeaves(v, `${prefix}.${i}`));
  if (value !== null && typeof value === 'object') return Object.entries(value).flatMap(([k,v]) => publicLeaves(v, `${prefix}.${k}`));
  return [prefix];
}
export function evidenceLeafPath(operationId: string, leaf: string, executive = false) {
  return executive ? 'executiveRelevanceSummary' : `operations.${operationId}.${leaf === 'after' ? 'after.value' : leaf}`;
}

/** Deterministic mechanics only. Claims, coverage and editorial judgments are supplied by Codex. */
export function appendRefreshChange(
  input: OrganizationRefreshBundleV2, inputLedger: ResearchClaimLedgerV1,
  change: RefreshChange, supports: LeafSupport[],
  childBefore?: Record<string, unknown>
) {
  const candidate = structuredClone(input);
  const ledger = structuredClone(inputLedger);
  const organization = candidate.beforeRecord.organization as Record<string, unknown>;
  if (!organization || organization.updated_at !== candidate.targetMatch.baselineUpdatedAt) throw new Error('Exact raw baseline is required.');
  const operationId = stableResearchId('op', [candidate.candidateId, change]);
  if (candidate.operations.some(o => o.operationId === operationId)) throw new Error('This change is already assembled.');
  let operation: Record<string, unknown> = { ...change, operationId, evidenceIds: [], leafEvidence: [] };
  if (change.operation === 'set_field' || change.operation === 'set_profile_field') {
    const profile = (organization.profile_data ?? {}) as Record<string, unknown>;
    let before = change.operation === 'set_profile_field' ? profile[change.profileField] ?? null : organization[change.field] ?? null;
    if (change.operation === 'set_field' && change.field === 'public_contact') {
      before = {contactPageUrl: null, publicEmail: null, publicPhone: null, linkedInUrl: null, ...(profile.publicContact as object ?? {})};
    }
    if (change.operation === 'set_field' && !validateOrganizationRefreshV2Field(change.field, change.after)) throw new Error(`Invalid proposed field ${change.field}.`);
    if (JSON.stringify(before) === JSON.stringify(change.after)) throw new Error('Unchanged fields do not need an operation.');
    operation = {...operation, before, entityType: 'organization', targetId: candidate.targetMatch.entityId};
  } else {
    operation.parentId = candidate.targetMatch.entityId;
    if (change.operation === 'update_child') {
      if (!childBefore) throw new Error('Use the complete normalized child baseline from the run snapshot.');
      operation.before = childBefore;
    }
  }
  const leaves = publicLeaves(change.operation === 'add_child' ? change.value : change.after, change.operation === 'add_child' ? 'value' : 'after');
  const executive = change.operation === 'set_field' && change.field === 'executive_relevance_summary';
  const mappings: Array<{fieldPath: string; evidenceIds: string[]}> = [];
  for (const leaf of leaves) {
    const bindings = supports.filter(s => s.leaf === leaf);
    if (!bindings.length) throw new Error(`Missing evidence binding for ${leaf}.`);
    const ids: string[] = [];
    for (const support of bindings) {
      const claim = ledger.claims.find(c => c.claimId === support.claimId);
      if (!claim || !['supported','corroborated'].includes(claim.status) || claim.source.sourcePosture === 'discovery_only') throw new Error(`Claim ${support.claimId} is not eligible evidence.`);
      const subject = ledger.subjects.find(s => s.subjectId === claim.subjectId && s.candidateIds.includes(candidate.candidateId));
      if (!subject) throw new Error('Evidence belongs to a different subject or candidate.');
      if (!candidate.sources.some(s => s.id === claim.source.sourceId)) throw new Error('Register the inspected source in the candidate before binding evidence.');
      if (executive && support.claimClass !== 'derived') throw new Error('Executive relevance must remain an assessment.');
      const fieldPath = evidenceLeafPath(operationId, leaf, executive);
      const id = stableResearchId('evidence', [candidate.candidateId, fieldPath, claim.source.sourceId]);
      if (ids.includes(id) || candidate.fieldEvidence.some(e => e.id === id)) throw new Error('Duplicate source/leaf evidence binding.');
      ids.push(id);
      candidate.fieldEvidence.push({id, sourceId: claim.source.sourceId, fieldPath, claimClass: support.claimClass, excerpt: claim.value, confidence: 'moderate'});
      if (support.claimClass === 'source_backed') {
        const bound: Claim = {...structuredClone(claim), claimId: stableResearchId('claim', [id,claim.claimId]), disposition: 'candidate_field', candidateTargets: [{candidateId: candidate.candidateId, fieldPath, operationId}], analystNote: `${claim.analystNote} Bound to ${fieldPath}.`.slice(0,2000)};
        ledger.claims.push(bound);
        const coverage = subject.coverage.filter(c => c.claimIds.includes(claim.claimId));
        if (!coverage.length) throw new Error('Associate the original claim with an assessed coverage dimension first.');
        for (const dimension of coverage) dimension.claimIds.push(bound.claimId);
      }
    }
    mappings.push({fieldPath: leaf, evidenceIds: ids});
  }
  if (supports.some(s => !leaves.includes(s.leaf))) throw new Error('Evidence binding names a nonexistent leaf.');
  operation.leafEvidence = mappings;
  operation.evidenceIds = [...new Set(mappings.flatMap(m => m.evidenceIds))];
  candidate.operations.push(organizationRefreshOperationV2Schema.parse(operation));
  if (executive) candidate.executiveRelevanceSummary = change.after as string | null;
  candidate.sourceChannels = [...new Set(candidate.sources.map(source => ledger.claims.find(c => c.source.sourceId === source.id)?.source.sourceChannel).filter((c): c is OrganizationRefreshBundleV2['sourceChannels'][number] => Boolean(c)))];
  return {candidate, ledger};
}

export function createRefreshDraft(
  snapshot: import('./operator-snapshot').OperatorSnapshot,
  slug: string,
  metadata: Pick<OrganizationRefreshBundleV2, 'reviewerRationale' | 'reviewTier' | 'inclusionScore' | 'completenessScore' | 'reviewWarnings' | 'sources' | 'confidence'>
): OrganizationRefreshBundleV2 {
  const organization = snapshot.tables.organizations.find(o => o.slug === slug);
  if (!organization || typeof organization.updated_at !== 'string') throw new Error('Exact published target and raw timestamp required.');
  const candidateId = `${snapshot.runId}-${slug}`;
  if (snapshot.tables.activeCandidates.some(c => c.target_entity_id === organization.id && c.client_candidate_id !== candidateId)) throw new Error('Target already has an active candidate.');
  return {
    ...metadata, schemaVersion:'organization_refresh_bundle_v2',candidateKind:'organization_refresh_bundle',candidateId,
    sourceLeadIds:[`${snapshot.runId}-${slug}-lead`],reviewStatus:'candidate_pending',
    duplicateCheck:{status:'clear',checkedAt:snapshot.completedAt,methods:['slug'],matches:[],note:`Intentional refresh of the exact published ${slug} identity; snapshot verifies active-target overlap. Inclusion and identity evidence still require substantive review.`},
    targetMatch:{entityType:'organization',entityId:String(organization.id),slug,matchMethods:['slug'],confidence:'high',baselineUpdatedAt:organization.updated_at},
    beforeRecord:{organization,capabilities:snapshot.tables.capabilities.filter(c=>c.organization_id===organization.id),locations:snapshot.tables.organization_locations.filter(c=>c.organization_id===organization.id),programParticipations:snapshot.tables.program_participations.filter(c=>c.organization_id===organization.id)},
    operations:[],fieldEvidence:[],sourceChannels:[],signalIds:[],corroboration:[],executiveRelevanceSummary:organization.executive_relevance_summary as string | null ?? null
  };
}
