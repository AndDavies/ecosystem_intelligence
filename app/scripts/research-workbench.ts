import path from 'node:path';
import { focusedOperationIssues, researchFocusSchema } from '../src/lib/research/focus-plan';
import { cacheResearchSource } from '../src/lib/research/source-cache';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { loadScriptEnv } from './load-env';
import * as schema from '../src/lib/research/pipeline-schema';
import { completeResearchRunIssues, derivedResearchCounters } from '../src/lib/research/run-validation';
import { appendRefreshChange, createRefreshDraft, type RefreshChange, type LeafSupport } from '../src/lib/research/candidate-builder';
import { captureOperatorSnapshot, writeImmutableSnapshot, loadOperatorSnapshot, normalizedChildBaseline } from '../src/lib/research/operator-snapshot';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
loadScriptEnv();
const args = process.argv.slice(3).filter(x => x !== '--');
const option = (name: string) => {const i=args.indexOf(name); return i<0 ? undefined : args[i+1];};
const required = (name: string) => {const value=option(name); if (!value || value.startsWith('--')) throw new Error(`Missing ${name}.`); return value;};
const json = async (file:string) => JSON.parse(await readFile(path.resolve(root,file),'utf8'));
const write = async (file:string,value:unknown) => {await mkdir(path.dirname(file),{recursive:true}); await writeFile(file,JSON.stringify(value,null,2)+'\n',{mode:0o600});};
async function main() {
  const command=process.argv[2];
  if (Number(process.versions.node.split('.')[0]) !== 24) throw new Error('Use the repository-pinned Node 24 runtime.');
  if(command==='doctor') {
    let pdf=false; try {await promisify(execFile)('pdftotext',['-v']);pdf=true;}catch{/* Optional browser recovery remains available. */}
    console.log(JSON.stringify({ok:true,node:process.versions.node,pdfTextAvailable:pdf,modelSelection:'calling Codex task',openAiApiUsed:false}));return;
  }
  const run=schema.researchRunSchema.parse(await json(required('--run')));
  const privateDir=path.join(root,'research/ingestion/local',run.runId);
  if(command==='focus') {
    if(run.mode!=='dossier_enrichment') throw new Error('Focused follow-up is a local dossier-enrichment scope.');
    const focus=researchFocusSchema.parse({schemaVersion:'research_focus_v1',runId:run.runId,fields:required('--fields').split(','),question:required('--question'),retainedEvidence:option('--retained-evidence') ? await json(required('--retained-evidence')) : []});
    await write(path.join(privateDir,'working','focus.json'),focus);
    console.log(JSON.stringify({ok:true,focus,coverageContract:'unchanged; inspect retained evidence and disposition every required dimension'}));return;
  }
  if(command==='collect') {
    const sources=option('--urls') ? await json(required('--urls')) as string[] : [required('--url')];
    const {boundedMapByKey}=await import('../src/lib/research/bounded-map');
    const results=await boundedMapByKey(sources,3,url=>new URL(url).hostname,async url=>{
      try {
        const result=await cacheResearchSource(path.join(privateDir,'sources'),url,args.includes('--refresh'));
        if(result.contentType==='application/pdf') {
          const file=path.join(privateDir,'sources',result.bodyFile);
          try {await promisify(execFile)('pdftotext',['-layout',file,file+'.txt']);} catch {return {...result,textExtraction:'browser_required'};}
        }
        return result;
      } catch {return {url,status:'browser_or_alternate_source_required'};}
    });
    await write(path.join(privateDir,'collection-attempts',Date.now()+'.json'),{attemptedAt:new Date().toISOString(),results});
    console.log(JSON.stringify(results,null,2));return;
  }
  if(command==='init') {
    const working=path.join(privateDir,'working');
    for(const [name,output] of [['plan','collectionPlan'],['ledger','claimLedger']] as const) {
      await mkdir(working,{recursive:true});
      await writeFile(path.join(working,name+'.json'),JSON.stringify(await json(run.outputs[output]!),null,2)+'\n',{flag:'wx',mode:0o600});
    }
    console.log(JSON.stringify({ok:true,working,modelSelection:'calling Codex task'}));return;
  }
  if(command==='snapshot') {
    const plan=schema.researchCollectionPlanV1Schema.parse(await json(run.outputs.collectionPlan!));
    const slugs=option('--target-slugs')?.split(',') ?? plan.targetSubjects.map(t=>t.canonicalIdentifiers[0]).filter(Boolean);
    const file=path.join(privateDir,'snapshot.json');
    const digest=await writeImmutableSnapshot(file,await captureOperatorSnapshot(run.runId,slugs));
    console.log(JSON.stringify({ok:true,file,digest}));return;
  }
  if(command==='candidate') {
    const {snapshot}=await loadOperatorSnapshot(path.join(privateDir,'snapshot.json'));
    if(snapshot.runId!==run.runId) throw new Error('Snapshot run mismatch.');
    const candidate=createRefreshDraft(snapshot,required('--slug'),await json(required('--metadata')));
    const file=path.join(privateDir,'working',candidate.candidateId+'.json');
    await mkdir(path.dirname(file),{recursive:true});
    await writeFile(file,JSON.stringify(candidate,null,2)+'\n',{flag:'wx',mode:0o600});
    console.log(JSON.stringify({ok:true,file,sourceLeadId:candidate.sourceLeadIds[0],status:'incomplete working draft'}));return;
  }
  if(command==='operation') {
    const candidate=await json(required('--candidate')) as schema.OrganizationRefreshBundleV2;
    const ledger=schema.researchClaimLedgerV1Schema.parse(await json(required('--ledger')));
    const change=await json(required('--change')) as RefreshChange;
    const supports=await json(required('--supports')) as LeafSupport[];
    const {snapshot}=await loadOperatorSnapshot(path.join(privateDir,'snapshot.json'));
    const baseline=snapshot.tables.organizations.find(o=>o.id===candidate.targetMatch.entityId);
    if(snapshot.runId!==run.runId || candidate.candidateId.indexOf(run.runId)!==0 || JSON.stringify(candidate.beforeRecord.organization)!==JSON.stringify(baseline)) throw new Error('Candidate must use the exact run snapshot.');
    const child=change.operation==='update_child' ? normalizedChildBaseline(snapshot,change.entityType,change.targetId,candidate.targetMatch.entityId) : undefined;
    const result=appendRefreshChange(candidate,ledger,change,supports,child);
    const candidateFile=path.resolve(root,required('--candidate'));
    const ledgerFile=path.resolve(root,required('--ledger'));
    const workingPrefix=path.join(privateDir,'working')+path.sep;
    if (![candidateFile,ledgerFile].every(file=>file.startsWith(workingPrefix))) throw new Error('Operation updates require private working paths.');
    await write(candidateFile,result.candidate);
    await write(ledgerFile,result.ledger);
    console.log(JSON.stringify({ok:true,operationCount:result.candidate.operations.length,output:path.join(privateDir,'working')}));return;
  }
  if(command==='assemble') {
    if(run.mode==='canonical_repair') throw new Error('Canonical repair uses its separately governed snapshot and assembly contract.');
    const working=path.resolve(root,required('--working'));
    const read=(name:string)=>json(path.join(working,name+'.json'));
    const plan=schema.researchCollectionPlanV1Schema.parse(await read('plan'));
    const ledger=schema.researchClaimLedgerV1Schema.parse(await read('ledger'));
    const batch=schema.researchCandidateBatchV2Schema.parse(await read('candidates'));
    const leads=schema.sourceLeadBatchV2Schema.parse(await read('leads'));
    const requirements=(await import('../src/lib/research/staging-integrity')).recordSpecificArtifactRequirements(run);
    const prospects=requirements.prospects ? schema.researchProspectInventoryV1Schema.parse(await read('prospects')) : null;
    const signals=requirements.signals ? schema.researchSignalBatchV1Schema.parse(await read('signals')) : null;
    const now=new Date().toISOString();
    const assembled={...run,status:'completed' as const,completedAt:run.completedAt ?? now,counters:{...run.counters,...derivedResearchCounters({ledger,batch,leads,prospects,signals})},validation:{passed:false,errors:[],warnings:[]},stopReason:'Research artifacts sealed; finalization receipt separately establishes validated private intake.'};
    const artifacts={run:assembled,plan,ledger,batch,leads,prospects,signals};
    const issues=completeResearchRunIssues(artifacts);
    let focus;
    try {focus=researchFocusSchema.parse(await read('focus'));} catch(error) {if((error as NodeJS.ErrnoException).code!=='ENOENT') throw error;}
    if(focus) {
      if(focus.runId!==run.runId || run.mode!=='dossier_enrichment') throw new Error('Focus must belong to this enrichment run.');
      for(const candidate of batch.candidates) {
        if(candidate.schemaVersion!=='organization_refresh_bundle_v2') throw new Error('Focused follow-up requires typed organization refreshes.');
        issues.push(...focusedOperationIssues(candidate,focus.fields));
      }
    }
    if(issues.length) throw new Error(issues.join('\n'));
    const folders={collectionPlan:'collection-plans-v1',claimLedger:'claim-ledgers-v1',prospectInventory:'prospect-inventories-v1',signalBatch:'signal-batches-v1',sourceLeadBatch:'source-leads-v2',candidateBatch:'candidate-batches-v2'};
    for(const [key,folder] of Object.entries(folders)) assembled.outputs[key as keyof typeof assembled.outputs]=`research/ingestion/${folder}/${run.runId}.json`;
    if(!prospects) assembled.outputs.prospectInventory=null;
    if(!signals) assembled.outputs.signalBatch=null;
    assembled.outputs.reviewPacket=`research/ingestion/reviews-v2/${batch.batchId}.md`;
    assembled.outputs.stagingExport=`research/ingestion/staging/${run.runId}.json`;
    if(args.includes('--write')) {
      for(const [key,value] of Object.entries({collectionPlan:plan,claimLedger:ledger,prospectInventory:prospects,signalBatch:signals,sourceLeadBatch:leads,candidateBatch:batch})) if(value) await write(path.resolve(root,assembled.outputs[key as keyof typeof assembled.outputs]!),value);
      await write(path.resolve(root,required('--run')),assembled);
    }
    console.log(JSON.stringify({ok:true,written:args.includes('--write'),candidates:batch.candidates.length,primaryDiscoveryLanes:assembled.counters.sourceLanesSearched,recoveryAttempts:assembled.counters.recoveryAttempts,validation:'local assembly; finalizer still required'}));return;
  }
  throw new Error('Use doctor, snapshot, init, collect, operation or assemble. See the research workbench reference.');
}
main().catch(error=>{console.error(error instanceof Error?error.message:error);process.exitCode=1;});
