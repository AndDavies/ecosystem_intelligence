import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { appendRefreshChange, evidenceLeafPath, publicLeaves } from '@/lib/research/candidate-builder';
import { artifactDigest, canResumeIntake, type FinalizeReceipt } from '@/lib/research/finalize-state';
import { readAllPages, normalizedChildBaseline, writeImmutableSnapshot, type OperatorSnapshot } from '@/lib/research/operator-snapshot';
import { derivedResearchCounters } from '@/lib/research/run-validation';
import { focusedOperationIssues } from '@/lib/research/focus-plan';
import { researchCandidateBatchV2Schema, researchClaimLedgerV1Schema, type OrganizationRefreshBundleV2 } from '@/lib/research/pipeline-schema';
vi.mock('@/lib/security/public-outbound', () => ({fetchPublicBytes: vi.fn()}));
import { fetchPublicBytes } from '@/lib/security/public-outbound';
import { cacheResearchSource } from '@/lib/research/source-cache';

async function historicalDraft() {
  const load=async(folder:string)=>JSON.parse(await readFile(path.resolve('../research/ingestion',folder,'tnm-dossier-pilot-20260809.json'),'utf8'));
  const candidate=researchCandidateBatchV2Schema.parse(await load('candidate-batches-v2')).candidates[0] as OrganizationRefreshBundleV2;
  const ledger=researchClaimLedgerV1Schema.parse(await load('claim-ledgers-v1'));
  candidate.operations=[];candidate.fieldEvidence=[];
  return {candidate,ledger};
}

describe('research workbench regressions',()=>{
  it('binds scalar evidence to the exact operation path with deterministic IDs and no input mutation',async()=>{
    const {candidate,ledger}=await historicalDraft();
    const claim=ledger.claims[0];
    const change={operation:'set_field' as const,field:'operating_context' as const,after:claim.value,reviewerExplanation:'Restore the concrete delivery role established by the inspected company record.'};
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
