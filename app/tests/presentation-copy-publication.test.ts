import {afterAll,beforeAll,describe,expect,it} from 'vitest';
import type {PGlite} from '@electric-sql/pglite';
import {createAtlasTestDatabase} from './helpers/atlas-database';
import {buildMinimalOrganizationV3Candidate,buildMinimalOrganizationRefreshV2Candidate,buildStagingCandidate,dossierFixtureResearchRun} from './fixtures/organization-dossier-candidates';
import {organizationBundleV3Schema} from '@/lib/research/pipeline-schema';
import {researchCandidateContractIssues,researchReviewContract} from '@/lib/research/deployment-contract';
import {publicLeaves} from '@/lib/research/candidate-builder';
const reviewer='b443c433-2a78-4ca7-8a19-a8f40b140049';
let db:PGlite; let org:string; let cap:string;
const base=buildMinimalOrganizationV3Candidate();
const copy={displayLead:'Reviewed source-backed introduction with its material qualification intact.',roleDescriptor:'Systems integration company'};
const capCopy={displayLead:'An engineering offer, not a documented deployment.',catalogueTeaser:'Integration and support for the specified configuration; customer acceptance remains unestablished.'};
const bundle={...base,organization:{...base.organization,presentationCopy:copy},capabilities:base.capabilities.map(c=>({...c,presentationCopy:capCopy})),fieldEvidence:[...base.fieldEvidence,...['organization.presentationCopy.displayLead','organization.presentationCopy.roleDescriptor','capabilities.0.presentationCopy.displayLead','capabilities.0.presentationCopy.catalogueTeaser'].map((fieldPath,i)=>({...base.fieldEvidence[0],id:`copy-evidence-${i}`,fieldPath}))]};
async function stage(record:Record<string,unknown> & {client_candidate_id:string}){await db.query('select * from public.stage_research_candidates_for_review($1::jsonb,$2::jsonb)',[JSON.stringify({...dossierFixtureResearchRun,client_run_id:`tnm-${record.client_candidate_id}`}),JSON.stringify([record])]);}
async function accept(id:string){await db.query('select * from public.review_research_run_candidates((select research_run_id from public.candidate_changes where client_candidate_id=$1),$2::uuid,array(select id from public.candidate_changes where client_candidate_id=$1))',[id,reviewer]);}
async function publish(id:string){return db.query('select * from public.publish_reviewed_research_candidates(array(select id from public.candidate_changes where client_candidate_id=$1),$2::uuid)',[id,reviewer]);}
async function current(){return (await db.query<{record:Record<string,unknown>,updated_at:string}>('select row_to_json(o) record,updated_at::text from public.organizations o where id=$1',[org])).rows[0];}
async function childRefresh(id:string,beforeCopy?:typeof capCopy|null,afterCopy?:Partial<typeof capCopy>|{displayLead:null}){
 const saved=await current();const b=buildMinimalOrganizationRefreshV2Candidate({organizationId:org,baselineUpdatedAt:saved.updated_at,candidateId:id});
 const {slug:_slug,...original}=base.capabilities[0];void _slug;
 const before={...original,...(beforeCopy?{presentationCopy:beforeCopy}:{})};
 const after={...original,...(afterCopy?{presentationCopy:afterCopy}:{})};
 const e=b.fieldEvidence[0].id;
 const candidate={...b,beforeRecord:{organization:{...saved.record,updated_at:saved.updated_at}},operations:[{operationId:'copy-child',operation:'update_child',entityType:'capability',parentId:org,targetId:cap,before,after,evidenceIds:[e],leafEvidence:publicLeaves(after,'after').map(fieldPath=>({fieldPath,evidenceIds:[e]})),reviewerExplanation:'Review the unchanged full technical narrative together with the explicitly changed presentation copy.'}]};
 return {...buildStagingCandidate(b),proposed_record:candidate,before_record:candidate.beforeRecord};
}
beforeAll(async()=>{db=await createAtlasTestDatabase();await db.exec(`insert into auth.users(id) values('${reviewer}') on conflict do nothing; create or replace function auth.uid() returns uuid language sql stable as $$select '${reviewer}'::uuid$$; create or replace function auth.jwt() returns jsonb language sql stable as $$select '{"email":"m.andrew.davies@gmail.com","app_metadata":{"role":"admin"}}'::jsonb$$;`);},120000);
afterAll(async()=>{await db?.close();});
describe('optional copy through ordinary private Review and Publish',()=>{
 it('gates unsupported deployments and source-free or derived-only copy',()=>{
  expect(organizationBundleV3Schema.safeParse(bundle).success).toBe(true);
  expect(organizationBundleV3Schema.safeParse({...bundle,fieldEvidence:base.fieldEvidence}).success).toBe(false);
  expect(organizationBundleV3Schema.safeParse({...bundle,fieldEvidence:bundle.fieldEvidence.map(e=>e.id.startsWith('copy-')?{...e,claimClass:'derived'}:e)}).success).toBe(false);
  expect(researchCandidateContractIssues([buildStagingCandidate(bundle)],{...researchReviewContract,candidatePresentationCopyPublication:undefined}).join(' ')).toContain('Presentation copy');
  expect(organizationBundleV3Schema.safeParse(base).success).toBe(true);
 });
 it('keeps drafts private and requires human acceptance before publishing all four fields and citations',async()=>{
  await stage(buildStagingCandidate(bundle));
  expect((await db.query('select id from public.organizations where slug=$1',[bundle.organization.slug])).rows).toHaveLength(0);
  await expect(publish(bundle.candidateId)).rejects.toThrow(/approved/i);
  await accept(bundle.candidateId);await db.exec('set role authenticated');await publish(bundle.candidateId);await db.exec('reset role');
  const result=(await db.query<{id:string,display_lead:string,role_descriptor:string}>('select id,display_lead,role_descriptor from public.organization_dossiers where slug=$1',[bundle.organization.slug])).rows[0];org=result.id;
  expect(result).toMatchObject({display_lead:copy.displayLead,role_descriptor:copy.roleDescriptor});
  const c=(await db.query<{id:string,display_lead:string,catalogue_teaser:string}>('select id,display_lead,catalogue_teaser from public.capabilities where organization_id=$1',[org])).rows[0];cap=c.id;expect(c).toMatchObject({display_lead:capCopy.displayLead,catalogue_teaser:capCopy.catalogueTeaser});
  expect((await db.query("select field_name from public.field_citations where entity_id=any($1::uuid[]) and field_name in ('display_lead','role_descriptor','catalogue_teaser')",[[org,cap]])).rows).toHaveLength(4);
 });
 it('preserves omitted copy in historical capability candidates and supports partial changes and explicit clearing',async()=>{
  for(const [id,before,after] of [['historical-copy',undefined,undefined],['partial-copy',capCopy,{displayLead:null}]] as const){
   const c=await childRefresh(id,before,after);await stage(c);await accept(id);await publish(id);
  }
  expect((await db.query('select display_lead,catalogue_teaser from public.capabilities where id=$1',[cap])).rows[0]).toEqual({display_lead:null,catalogue_teaser:capCopy.catalogueTeaser});
  expect((await current()).record.description).toBe(base.organization.description);
 });
 it('rejects stale copy baselines and source-free direct maintenance',async()=>{
  const c=await childRefresh('stale-copy',capCopy,{displayLead:'Another reviewed lead'});await stage(c);await accept('stale-copy');await expect(publish('stale-copy')).rejects.toThrow(/stale/i);
  const saved=await current();await expect(db.query('select public.update_published_dossier_presentation_copy($1,null,$2,$3,$4::jsonb,$5::uuid[],$6)',[org,reviewer,saved.updated_at,JSON.stringify({displayLead:'No supporting source'}),[],'Uncited modification attempt'])).rejects.toThrow(/evidence/i);
 });
 it('publishes organization refresh copy and an explicit clear without erasing omitted fields',async()=>{
  for(const [id,after] of [['organization-copy','Reviewed replacement retaining its source scope.'],['organization-copy-clear',null]] as const){
   const saved=await current();const b=buildMinimalOrganizationRefreshV2Candidate({organizationId:org,baselineUpdatedAt:saved.updated_at,candidateId:id});
   const candidate={...b,beforeRecord:{organization:{...saved.record,updated_at:saved.updated_at}},operations:[{operationId:'organization-copy',operation:'set_field',field:'display_lead',before:saved.record.display_lead,after,evidenceIds:[b.fieldEvidence[0].id],leafEvidence:[{fieldPath:'after',evidenceIds:[b.fieldEvidence[0].id]}],reviewerExplanation:'Reviewed factual introduction against the retained complete narrative.'}]};
   await stage({...buildStagingCandidate(b),proposed_record:candidate,before_record:candidate.beforeRecord});await accept(id);await publish(id);
   expect((await current()).record.display_lead).toBe(after);
   expect((await current()).record.role_descriptor).toBe(copy.roleDescriptor);
   expect((await current()).record.description).toBe(base.organization.description);
  }
 });
 it('maintains reviewed copy with existing entity evidence, audit and stale protection',async()=>{
  const saved=await current();const e=(await db.query<{id:string}>("select evidence_snippet_id id from public.field_citations where entity_id=$1 and field_name='description' limit 1",[org])).rows[0].id;
  const args=[org,reviewer,saved.updated_at,JSON.stringify({displayLead:'Reviewed maintenance; the full narrative remains intact.'}),[e],'Compared against the complete narrative and its existing source.'];
  await db.exec('set role authenticated');await db.query('select public.update_published_dossier_presentation_copy($1,null,$2,$3,$4::jsonb,$5::uuid[],$6)',args);await db.exec('reset role');
  expect((await current()).record.role_descriptor).toBe(copy.roleDescriptor);
  expect((await db.query<{metadata:{before:unknown,after:unknown,evidence_ids:unknown}}>("select metadata from public.audit_events where entity_id=$1 and event_type='presentation_copy_updated'",[org])).rows[0].metadata).toMatchObject({before:{displayLead:null},after:{displayLead:'Reviewed maintenance; the full narrative remains intact.'},evidence_ids:[e]});
  await expect(db.query('select public.update_published_dossier_presentation_copy($1,null,$2,$3,$4::jsonb,$5::uuid[],$6)',args)).rejects.toThrow(/Stale/);
 });
 it('rejects wrong-entity evidence, wrong capability ownership and an ordinary member',async()=>{
  const saved=await current();
  const wrongEvidence=(await db.query<{id:string}>("select evidence_snippet_id id from public.field_citations where entity_type='capability' and entity_id=$1 limit 1",[cap])).rows[0].id;
  await expect(db.query('select public.update_published_dossier_presentation_copy($1,null,$2,$3,$4::jsonb,$5::uuid[],$6)',[org,reviewer,saved.updated_at,JSON.stringify({roleDescriptor:'Wrong source attempt'}),[wrongEvidence],'Wrong entity evidence must fail.'])).rejects.toThrow(/belong/);
  await expect(db.query('select public.update_published_dossier_presentation_copy($1,$2,$3,$4,$5::jsonb,$6::uuid[],$7)',[org,reviewer,reviewer,saved.updated_at,JSON.stringify({displayLead:null}),[],'Wrong capability must fail.'])).rejects.toThrow(/Wrong capability/);
  await db.exec(`create or replace function auth.jwt() returns jsonb language sql stable as $$select '{"email":"member@example.test","app_metadata":{}}'::jsonb$$;set role authenticated;`);
  try{await expect(db.query('select public.update_published_dossier_presentation_copy($1,null,$2,$3,$4::jsonb,$5::uuid[],$6)',[org,reviewer,saved.updated_at,'{}',[],'Member attempt'])).rejects.toThrow(/Administrator/);}finally{await db.exec(`reset role;create or replace function auth.jwt() returns jsonb language sql stable as $$select '{"email":"m.andrew.davies@gmail.com","app_metadata":{"role":"admin"}}'::jsonb$$;`);}
 });
 it('denies anonymous writes while exposing only published copy',async()=>{
  await db.exec('set role anon');try{
   expect((await db.query('select display_lead from public.organizations where id=$1',[org])).rows).toHaveLength(1);
   await expect(db.query('select public.update_published_dossier_presentation_copy($1,null,$2,now(),$3::jsonb,$4::uuid[],$5)',[org,reviewer,'{}',[],'Anonymous attempt'])).rejects.toThrow(/permission denied/);
   await expect(db.query('select id from public.candidate_changes')).rejects.toThrow(/permission denied/);
  } finally{await db.exec('reset role');}
 });
});
