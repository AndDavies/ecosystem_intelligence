import { z } from 'zod';
import {
  researchCandidateBatchV2Schema, researchProspectInventoryV1Schema, researchSignalBatchV1Schema,
  sourceLeadBatchV2Schema, type OrganizationRefreshBundleV2, type ResearchRun,
  type ResearchCollectionPlanV1, type ResearchClaimLedgerV1, type ResearchSignalBatchV1
} from './pipeline-schema';
import type { OperatorSnapshot } from './operator-snapshot';

const decisionSchema = z.object({
  slug: z.string().min(1), primarySourceId: z.string().min(1), discoveryLane: z.string().min(1),
  fitSummary: z.string().min(30), refreshSummary: z.string().min(40),
  recoveryAttempts: z.array(z.object({lane:z.string(),url:z.string().url(),outcome:z.string().min(20)})).max(10),
  possibleMissionAreaSlugs: z.array(z.string()).default([]),
  possibleTechnicalDomainSlugs: z.array(z.string()).default([]),
  followUpQuestions: z.array(z.string()).default([])
}).strict();
export const dossierEnvelopeDecisionsSchema = z.object({
  title:z.string().min(8), targets:z.array(decisionSchema).min(1).max(50)
}).strict();

/** Copies mechanical lineage only. Decisions, sources and searched routes are explicit inputs. */
export function buildDossierEnvelopes(input: {
  run: ResearchRun; plan: ResearchCollectionPlanV1; ledger: ResearchClaimLedgerV1;
  snapshot: OperatorSnapshot; candidates: OrganizationRefreshBundleV2[]; decisions: unknown;
  signals?: ResearchSignalBatchV1; now: string;
}) {
  const {run,plan,ledger,snapshot,candidates,now} = input;
  if (run.mode !== 'dossier_enrichment') throw new Error('Envelope builder supports positive dossier-enrichment drafts only.');
  if ([plan,ledger,snapshot].some(value=>value.runId!==run.runId)) throw new Error('Envelope inputs must belong to the same run.');
  const decisions = dossierEnvelopeDecisionsSchema.parse(input.decisions);
  const slugs = decisions.targets.map(d=>d.slug);
  if (new Set(slugs).size!==slugs.length || new Set(candidates.map(c=>c.targetMatch.slug)).size!==candidates.length) throw new Error('Duplicate target in envelope inputs.');
  if (slugs.length!==candidates.length || slugs.length!==snapshot.targetSlugs.length || snapshot.targetSlugs.some(slug=>!slugs.includes(slug))) throw new Error('Every snapshot target needs one candidate and one explicit decision. Use typed dispositions separately for held targets.');
  const sourceFamilyCounters = Object.fromEntries([...new Set(ledger.claims.map(c=>c.source.sourceChannel))].map(channel=>[
    channel,new Set(ledger.claims.filter(c=>c.source.sourceChannel===channel).map(c=>c.source.sourceFamily)).size
  ]));
  const signals = researchSignalBatchV1Schema.parse(input.signals ?? {
    schemaVersion:'research_signal_batch_v1',signalBatchId:`${run.runId}-signals`,runId:run.runId,
    createdAt:now,watermarkStart:run.startedAt,watermarkEnd:now,sourceFamilyCounters,warnings:[],signals:[]
  });
  if (signals.runId!==run.runId) throw new Error('Signal batch belongs to another run.');
  const leads = [];
  const prospects = [];
  for (const decision of decisions.targets) {
    const candidate = candidates.find(c=>c.targetMatch.slug===decision.slug);
    if (!candidate) throw new Error(`Missing draft for ${decision.slug}.`);
    const organization = snapshot.tables.organizations.find(o=>o.id===candidate.targetMatch.entityId && o.slug===decision.slug);
    if (!organization || JSON.stringify(candidate.beforeRecord.organization)!==JSON.stringify(organization)
      || candidate.targetMatch.baselineUpdatedAt!==organization.updated_at) throw new Error(`Snapshot baseline mismatch for ${decision.slug}.`);
    const subject = plan.targetSubjects.find(s=>s.canonicalIdentifiers.includes(decision.slug));
    if (!subject || !ledger.subjects.some(s=>s.subjectId===subject.subjectId && s.candidateIds.includes(candidate.candidateId))) throw new Error(`Missing plan/ledger target binding for ${decision.slug}.`);
    const source = candidate.sources.find(s=>s.id===decision.primarySourceId);
    if (!source) throw new Error(`Primary source is not registered for ${decision.slug}.`);
    if (candidate.sourceLeadIds.length!==1 || candidate.sourceLeadIds[0]!==`${run.runId}-${decision.slug}-lead`) throw new Error(`Unexpected source lead identity for ${decision.slug}.`);
    for (const signalId of candidate.signalIds) {
      const signal=signals.signals.find(s=>s.signalId===signalId && s.disposition==='qualified');
      if (!signal || !signal.liveEntityMatches.some(m=>m.entityId===candidate.targetMatch.entityId && m.slug===decision.slug && m.baselineUpdatedAt===candidate.targetMatch.baselineUpdatedAt)) throw new Error(`Missing or mismatched signal ${signalId}.`);
    }
    const canonicalUrl=`https://truenorthmap.ca/organizations/${decision.slug}`;
    const aliases=snapshot.tables.organization_aliases.filter(a=>a.organization_id===organization.id).map(a=>String(a.alias));
    leads.push({leadType:'record_refresh_lead',id:candidate.sourceLeadIds[0],source,
      discoveryPath:[...new Set([source.url,...decision.recoveryAttempts.map(a=>a.url)])],
      possibleMissionAreaSlugs:decision.possibleMissionAreaSlugs,possibleTechnicalDomainSlugs:decision.possibleTechnicalDomainSlugs,
      sourceConfidence:candidate.confidence,alignmentConfidence:candidate.confidence,
      evidenceLocator:source.locator,duplicateFingerprint:{canonicalUrl,websiteDomain:new URL(String(organization.website_url)).hostname.replace(/^www\./,''),stableSlug:decision.slug,legalName:organization.legal_name,aliases},
      followUpQuestions:decision.followUpQuestions,discoveryLane:decision.discoveryLane,
      inclusionScore:candidate.inclusionScore,completenessScore:candidate.completenessScore,reviewWarnings:candidate.reviewWarnings,
      recoveryAttempts:decision.recoveryAttempts,disposition:'qualified',doNotIngestReason:null,targetMatch:candidate.targetMatch,
      signalIds:candidate.signalIds,refreshSummary:decision.refreshSummary,intendedChanges:candidate.operations.map(o=>o.reviewerExplanation)
    });
    prospects.push({id:subject.subjectId,name:organization.name,proposedEntityType:'organization',proposedOrganizationKind:organization.entity_kind,
      canonicalUrl,discoverySourceUrl:source.url,discoveryLane:decision.discoveryLane,countryCode:'CA',fitSummary:decision.fitSummary,
      disposition:'selected',rejectionReason:null,recoveryAttempts:decision.recoveryAttempts});
  }
  return {
    candidates:researchCandidateBatchV2Schema.parse({schemaVersion:'research_candidate_batch_v2',batchId:run.runId,runId:run.runId,title:decisions.title,status:'candidate',createdAt:now,selectedGap:run.selectedGap,sourceLeadBatchPath:`research/ingestion/source-leads-v2/${run.runId}.json`,guardrailNotes:['Private refresh proposals preserve exact published baselines; human Admin Review and a separate Publish action remain mandatory.'],candidates,deferred:[]}),
    leads:sourceLeadBatchV2Schema.parse({schemaVersion:'source_lead_batch_v2',leadBatchId:`${run.runId}-leads`,runId:run.runId,createdAt:now,scope:{description:plan.intelligenceRequirement,targetMissionAreaSlugs:run.scope.missionAreaSlugs,targetTechnicalDomainSlugs:run.scope.technicalDomainSlugs,targetOrganizationKinds:run.scope.organizationKinds,targetDemandIssuerTypes:[]},leads}),
    prospects:researchProspectInventoryV1Schema.parse({schemaVersion:'research_prospect_inventory_v1',inventoryId:`${run.runId}-prospects`,runId:run.runId,createdAt:now,scope:plan.intelligenceRequirement,prospects}),signals
  };
}
