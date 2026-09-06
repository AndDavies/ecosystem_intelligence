import { researchWorkflowModeForRunMode } from './workflow-registry';
import {
  researchRunCompletionIssues, researchCandidateQualityIssues, researchClaimLedgerQualityIssues,
  researchRecordSpecificityIssues, researchReviewLineageIssues,
  requiresResearchQualityContract, requiresRecordSpecificResearchContract,
  type ResearchRun, type ResearchCandidateBatchV2, type ResearchClaimLedgerV1,
  type ResearchCollectionPlanV1, type ResearchProspectInventoryV1,
  type ResearchSignalBatchV1, type SourceLeadBatchV2
} from './pipeline-schema';

export interface ResearchArtifacts {
  run: ResearchRun;
  plan: ResearchCollectionPlanV1;
  ledger: ResearchClaimLedgerV1;
  prospects: ResearchProspectInventoryV1 | null;
  signals: ResearchSignalBatchV1 | null;
  leads: SourceLeadBatchV2;
  batch: ResearchCandidateBatchV2;
}

/** One severity policy for assembly, validate, smoke and intake. No I/O or mutation. */
export function completeResearchRunIssues(a: ResearchArtifacts): string[] {
  const { run, plan, ledger, prospects, signals, leads, batch } = a;
  const errors: string[] = [...researchRunCompletionIssues(run)];
  for (const [name, artifact] of Object.entries({ plan, ledger, prospects, signals, leads, batch })) {
    if (artifact && artifact.runId !== run.runId) errors.push(`${name} runId does not match the research run.`);
  }
  if (run.status !== 'completed') errors.push('Research artifacts must be sealed before finalization; intake is a separate phase.');
  if (plan.status !== 'complete' || ledger.status !== 'complete') errors.push('Collection plan and claim ledger must be complete.');
  const expected = derivedResearchCounters(a);
  for (const [key, value] of Object.entries(expected)) {
    if (['prospectsQueued','leadsDeferred','recoveryAttempts'].includes(key)) continue; // Historical event counters are not final-state counts.
    if ((run.counters[key as keyof ResearchRun['counters']] ?? 0) !== value) errors.push(`Run counter ${key} must equal ${value} from its source artifacts.`);
  }
  if (!batch.candidates.length) {
    if (!researchWorkflowModeForRunMode(run.mode)?.typedDispositionMayReplaceCandidate || !batch.deferred.length || batch.deferred.some(item=>!item.readinessDisposition)) errors.push('Zero-candidate completion requires a permitted mode and typed target dispositions.');
  }
  if (run.mode === 'bootstrap') {
    const kinds=new Set(batch.candidates.flatMap(c=>c.candidateKind==='organization_bundle' ? [c.organization.entityKind] : []));
    for(const kind of ['company','accelerator','incubator','investor_funder'] as const) if(!kinds.has(kind)) errors.push(`Bootstrap is missing ${kind}.`);
  }
  if (requiresResearchQualityContract(run.agentVersion)) {
    errors.push(...researchClaimLedgerQualityIssues(ledger));
    for (const candidate of batch.candidates) errors.push(...researchCandidateQualityIssues(candidate));
  }
  if (requiresRecordSpecificResearchContract(run.agentVersion)) {
    errors.push(...researchReviewLineageIssues({run, ledger, signals, leads, batch}));
    errors.push(...researchRecordSpecificityIssues(a));
  }
  return [...new Set(errors)];
}

/** Discovery lanes are primary routes; recovery routes remain a separate metric. */
export function derivedResearchCounters(a: Omit<ResearchArtifacts, 'run' | 'plan'>) {
  const { ledger, prospects, signals, leads, batch } = a;
  return {
    candidatesCreated: batch.candidates.length,
    leadsQualified: leads.leads.filter(x => x.disposition === 'qualified').length,
    leadsDeferred: leads.leads.filter(x => x.disposition === 'deferred').length,
    claimsCollected: ledger.claims.length,
    claimsConflicted: ledger.claims.filter(x => x.status === 'conflicted').length,
    coverageSubjects: ledger.subjects.length,
    candidatesGreen: batch.candidates.filter(x => x.reviewTier === 'green').length,
    candidatesAmber: batch.candidates.filter(x => x.reviewTier === 'amber').length,
    ...(prospects ? {
      uniqueProspects: prospects.prospects.length,
      prospectsQueued: prospects.prospects.filter(x => x.disposition === 'queued').length,
      sourceLanesSearched: new Set(prospects.prospects.map(x => x.discoveryLane)).size,
      recoveryAttempts: prospects.prospects.reduce((n, x) => n + x.recoveryAttempts.length, 0)
    } : {}),
    ...(signals ? {
      signalsExtracted: signals.signals.length,
      signalsDispositioned: signals.signals.filter(x => x.disposition !== undefined).length,
      sourceFamiliesSearched: Object.values(signals.sourceFamilyCounters).filter(n => n > 0).length
    } : {})
  };
}
