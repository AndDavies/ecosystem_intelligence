import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { appendRefreshChange, evidenceLeafPath, publicLeaves, expandLeafSupports } from '@/lib/research/candidate-builder';
import { artifactDigest, canResumeIntake, type FinalizeReceipt } from '@/lib/research/finalize-state';
import { readAllPages, normalizedChildBaseline, writeImmutableSnapshot, type OperatorSnapshot } from '@/lib/research/operator-snapshot';
import { derivedResearchCounters } from '@/lib/research/run-validation';
import { focusedOperationIssues } from '@/lib/research/focus-plan';
import { researchCandidateBatchV2Schema, researchClaimLedgerV1Schema, type OrganizationRefreshBundleV2 } from '@/lib/research/pipeline-schema';
vi.mock('@/lib/security/public-outbound', () => ({fetchPublicBytes: vi.fn()}));
import { fetchPublicBytes } from '@/lib/security/public-outbound';
import { cacheResearchSource } from '@/lib/research/source-cache';
import { buildDossierEnvelopes } from '@/lib/research/envelope-builder';

async function historicalDraft() {
  const load=async(folder:string)=>JSON.parse(await readFile(path.resolve('../research/ingestion',folder,'tnm-dossier-pilot-20260809.json'),'utf8'));
  const candidate=researchCandidateBatchV2Schema.parse(await load('candidate-batches-v2')).candidates[0] as OrganizationRefreshBundleV2;
  const ledger=researchClaimLedgerV1Schema.parse(await load('claim-ledgers-v1'));
  candidate.operations=[];candidate.fieldEvidence=[];
  return {candidate,ledger};
}

describe('research workbench regressions',()=>{
  it('expands a question selector only within that question, deduplicates overlap and rejects missing or conflicting support',()=>{
    const leaves=['after.0.id','after.0.question','after.1.question'];
    const common={claimId:'inspected',claimClass:'derived' as const};
    const supports=[{...common,leaf:'after.0.*'},{...common,leaf:'after.0.id'},{...common,leaf:'after.1.question',claimId:'other'}];
    expect(expandLeafSupports(leaves,supports)).toEqual([{...common,leaf:'after.0.id'},{...common,leaf:'after.0.question'},{...common,leaf:'after.1.question',claimId:'other'}]);
    expect(()=>expandLeafSupports(leaves,supports.slice(0,2))).toThrow('Missing evidence binding for after.1.question');
    expect(()=>expandLeafSupports(leaves,[...supports,{...common,leaf:'after.2.*'}])).toThrow('names no actual leaf');
    expect(()=>expandLeafSupports(leaves,[...supports,{...common,leaf:'after.0.id',claimClass:'source_backed'}])).toThrow('Conflicting evidence classes');
  });
  it('rejects a generic explanation before changing the draft or ledger',async()=>{
    const {candidate,ledger}=await historicalDraft();
    const before=JSON.stringify({candidate,ledger});
    expect(()=>appendRefreshChange(candidate,ledger,{operation:'set_field',field:'operating_context',after:ledger.claims[0].value,reviewerExplanation:'Make the content better for the human reviewer.'},[{leaf:'after',claimId:ledger.claims[0].claimId,claimClass:'source_backed'}])).toThrow('explanation does not name');
    expect(JSON.stringify({candidate,ledger})).toBe(before);
  });
  it('builds same-run envelopes without inventing decisions and rejects identity or signal drift',async()=>{
    const runId='tnm-manual-20260906091350';
    const load=async(folder:string)=>JSON.parse(await readFile(path.resolve('../research/ingestion',folder,runId+'.json'),'utf8'));
    const [run,plan,ledger,batch,leads,prospects,signals]=await Promise.all(['runs','collection-plans-v1','claim-ledgers-v1','candidate-batches-v2','source-leads-v2','prospect-inventories-v1','signal-batches-v1'].map(load));
    const candidates=batch.candidates as OrganizationRefreshBundleV2[];
    const snapshot={runId,targetSlugs:candidates.map(c=>c.targetMatch.slug),tables:{organizations:candidates.map(c=>c.beforeRecord.organization),organization_aliases:[]}} as unknown as OperatorSnapshot;
    const decisions={title:batch.title,targets:candidates.map((c,index)=>({slug:c.targetMatch.slug,primarySourceId:leads.leads[index].source.id,discoveryLane:prospects.prospects[index].discoveryLane,fitSummary:prospects.prospects[index].fitSummary,refreshSummary:leads.leads[index].refreshSummary,recoveryAttempts:prospects.prospects[index].recoveryAttempts}))};
    const input={run,plan,ledger,candidates,snapshot,decisions,signals,now:run.completedAt};
    const result=buildDossierEnvelopes(input);
    expect(result.candidates.candidates).toEqual(candidates);
    expect(result.leads.leads[0].id).toBe(candidates[0].sourceLeadIds[0]);
    expect(result.prospects.prospects.map(p=>p.canonicalUrl)).toEqual(prospects.prospects.map((p:{canonicalUrl:string})=>p.canonicalUrl));
    expect(()=>buildDossierEnvelopes({...input,decisions:{...decisions,targets:decisions.targets.slice(0,1)}})).toThrow('Every snapshot target');
    const wrongSignal=structuredClone(signals);wrongSignal.signals[0].liveEntityMatches[0].baselineUpdatedAt='2026-01-01T00:00:00Z';
    expect(()=>buildDossierEnvelopes({...input,signals:wrongSignal})).toThrow('mismatched signal');
    expect(()=>buildDossierEnvelopes({...input,decisions:{...decisions,targets:decisions.targets.map(d=>({...d,primarySourceId:'uninspected'}))}})).toThrow('Primary source');
  });
  it('binds scalar evidence to the exact operation path with deterministic IDs and no input mutation',async()=>{
    const {candidate,ledger}=await historicalDraft();
    const claim=ledger.claims[0];
    const change={operation:'set_field' as const,field:'operating_context' as const,after:claim.value,reviewerExplanation:`Update or record operating context: ${claim.value.slice(0, 350)}`};
    const supports=[{leaf:'after',claimId:claim.claimId,claimClass:'source_backed' as const}];
    const first=appendRefreshChange(candidate,ledger,change,supports);
    expect(first).toEqual(appendRefreshChange(candidate,ledger,change,supports));
    const op=first.candidate.operations[0];
    expect(first.candidate.fieldEvidence[0].fieldPath).toBe(`operations.${op.operationId}.after.value`);
    expect(first.ledger.claims.at(-1)?.candidateTargets[0].fieldPath).toBe(first.candidate.fieldEvidence[0].fieldPath);
    expect(candidate.operations).toHaveLength(0);
    expect(()=>appendRefreshChange(first.candidate,first.ledger,change,supports)).toThrow('already assembled');
    expect(()=>appendRefreshChange(candidate,ledger,change,[])).toThrow('Missing evidence');
    claim.source.sourcePosture='discovery_only';
    expect(()=>appendRefreshChange(candidate,ledger,change,supports)).toThrow('eligible evidence');
  });
  it('keeps exact nested leaves, nulls and executive assessment paths distinct',()=>{
    expect(publicLeaves([{question:'Why?',context:null}], 'after')).toEqual(['after.0.question','after.0.context']);
    expect(evidenceLeafPath('op','after',true)).toBe('executiveRelevanceSummary');
  });
  it('rejects source claims for another subject',async()=>{
    const {candidate,ledger}=await historicalDraft();ledger.subjects.forEach(s=>s.candidateIds=[]);
    expect(()=>appendRefreshChange(candidate,ledger,{operation:'set_field',field:'operating_context',after:ledger.claims[0].value,reviewerExplanation:'A concrete description grounded in the current inspected document.'},[{leaf:'after',claimId:ledger.claims[0].claimId,claimClass:'source_backed'}])).toThrow('different subject');
  });
  it('keeps focused changes within the explicitly named fields',async()=>{
    const {candidate}=await historicalDraft();candidate.operations=[{operation:'set_field',field:'current_activity',operationId:'focus',entityType:'organization',targetId:candidate.targetMatch.entityId,before:null,after:'A supported dated update.',evidenceIds:['e'],leafEvidence:[],reviewerExplanation:'Supported current activity.'}];
    expect(focusedOperationIssues(candidate,['field:operating_context'])).toHaveLength(1);
    expect(focusedOperationIssues(candidate,['field:current_activity'])).toEqual([]);
  });
  it('never overwrites immutable snapshots and preserves child taxonomy and timestamp precision',async()=>{
    const directory=await mkdtemp(path.join(tmpdir(),'tnm-snapshot-test-'));
    const snapshot={schemaVersion:'research_operator_snapshot_v1',tables:{capabilities:[{id:'c',organization_id:'o',publication_status:'published',core_features:['f'],defence_applications:['a']}],capability_domains:[{capability_id:'c',technical_domain_id:'d'}],technical_domains:[{id:'d',slug:'underwater'}],mission_matches:[],mission_areas:[]}} as unknown as OperatorSnapshot;
    const child=normalizedChildBaseline(snapshot,'capability','c','o');expect(child.features).toEqual(['f']);expect(child.technicalDomainSlugs).toEqual(['underwater']);
    await writeImmutableSnapshot(path.join(directory,'snapshot.json'),snapshot);
    await expect(writeImmutableSnapshot(path.join(directory,'snapshot.json'),snapshot)).rejects.toMatchObject({code:'EEXIST'});
    expect(()=>normalizedChildBaseline(snapshot,'capability','c','other')).toThrow('published target');
  });
  it('reads beyond one page including an exact page boundary',async()=>{
    const read=vi.fn(async(offset:number,size:number)=>[1,2,3,4].slice(offset,offset+size));
    expect(await readAllPages(read,2)).toEqual([1,2,3,4]);expect(read).toHaveBeenCalledTimes(3);
  });
  it('resumes only unchanged uncertain or verified intake and detects input mutations',async()=>{
    const directory=await mkdtemp(path.join(tmpdir(),'tnm-receipt-test-'));await writeFile(path.join(directory,'a.json'),'{}');
    const digest=await artifactDigest(directory,['a.json']);
    const receipt={inputDigest:digest,phase:'intake_started'} as FinalizeReceipt;
    expect(canResumeIntake(receipt,digest)).toBe(true);expect(canResumeIntake({...receipt,phase:'failed'},digest)).toBe(false);
    await writeFile(path.join(directory,'a.json'),'{"changed":true}');expect(canResumeIntake(receipt,await artifactDigest(directory,['a.json']))).toBe(false);
  });
  it('reuses inspected bytes without another fetch and fails on corrupted cache content',async()=>{
    const directory=await mkdtemp(path.join(tmpdir(),'tnm-source-test-'));
    vi.mocked(fetchPublicBytes).mockResolvedValue({body:Buffer.from('public evidence'),contentType:'text/plain',finalUrl:'https://example.com/record'} as Awaited<ReturnType<typeof fetchPublicBytes>>);
    const first=await cacheResearchSource(directory,'https://example.com/record');
    expect((await cacheResearchSource(directory,'https://example.com/record')).cached).toBe(true);
    expect(fetchPublicBytes).toHaveBeenCalledTimes(1);
    await writeFile(path.join(directory,first.bodyFile),'corrupted');
    await expect(cacheResearchSource(directory,'https://example.com/record')).rejects.toThrow('mismatch');
    await expect(cacheResearchSource(directory,'http://example.com')).rejects.toThrow('HTTPS');
  });
  it('separates discovery lanes from recovery attempts',()=>{
    const counters=derivedResearchCounters({ledger:{claims:[],subjects:[]},batch:{candidates:[]},leads:{leads:[]},signals:null,prospects:{prospects:[{discoveryLane:'official',disposition:'queued',recoveryAttempts:[{lane:'buyer'},{lane:'filing'}]},{discoveryLane:'official',disposition:'qualified',recoveryAttempts:[]}]}} as unknown as Parameters<typeof derivedResearchCounters>[0]);
    expect(counters.sourceLanesSearched).toBe(1);expect(counters.recoveryAttempts).toBe(2);
  });
});
