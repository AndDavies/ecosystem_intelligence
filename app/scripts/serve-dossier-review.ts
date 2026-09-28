/** Disposable, loopback-only review database. Never imported by the application.
 * Actual migration chain and RLS, exposed via the bounded PostgREST read subset used by dossier loaders.
 * All writes occur during local seed setup; HTTP writes are rejected. Publication is exercised in integration tests.
 */
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {createAtlasTestDatabase} from '../tests/helpers/atlas-database';
import {profileFixture, type FixtureKey} from '../src/app/dev/profile-design/fixtures';
import type {AtlasOrganization} from '../src/types/atlas';
async function main(){
const db=await createAtlasTestDatabase();
await db.exec("truncate public.organizations cascade");
async function insert(table:string,row:Record<string,unknown>){
 const keys=Object.keys(row);const vals=Object.values(row).map(v=>v&&typeof v==='object'&&!Array.isArray(v)?JSON.stringify(v):v);
 await db.query(`insert into public.${table} (${keys.map(k=>`"${k}"`).join(',')}) values (${keys.map((_,i)=>`$${i+1}`).join(',')})`,vals);
}
async function cite(entityType:string,id:string,citations:AtlasOrganization['citations']){
 for(const c of citations){const existing=(await db.query<{id:string}>('select id from public.sources where canonical_url=$1',[c.sourceUrl])).rows[0];const sid=existing?.id??randomUUID(),eid=randomUUID();if(!existing)await insert('sources',{id:sid,title:c.sourceTitle,canonical_url:c.sourceUrl,publisher:c.publisher,source_type:'official_organization_profile',visibility:'public',public_approved:true,published_at:c.publishedAt});await insert('evidence_snippets',{id:eid,source_id:sid,excerpt:c.excerpt,source_locator:JSON.stringify(c.sourceLocator),visibility:'public',public_approved:true});await insert('field_citations',{entity_type:entityType,entity_id:id,field_name:c.fieldName,evidence_snippet_id:eid});}
}
await db.exec('begin');
const routes:string[]=[];
for(const key of ['kraken','airbus','subsea','long','sparse','centre','connections','no-copy','partial-copy','multi-no-teaser','many','zero'] as const){
 const org=profileFixture((key==='many'?'long':key==='zero'?'sparse':['no-copy','partial-copy','multi-no-teaser','many'].includes(key)?'kraken':key) as FixtureKey);
 const synthetic=!['kraken','airbus','subsea'].includes(key);
 if(synthetic){org.slug=`synthetic-${key}`;if(!["long","centre"].includes(key))org.name=`Synthetic ${key} review record`;org.logo=null;for(const c of org.capabilities)c.slug=`${org.slug}-${c.slug}`;}
 if(key==='no-copy'||key==='multi-no-teaser'){org.presentationCopy=undefined;org.capabilities.forEach(c=>c.presentationCopy=undefined);}
 if(key==='no-copy'){org.editorialProfile.version=null;org.description+='\n\nA second paragraph verifies preserved blank-line structure in the unrefreshed loader path.';}
 if(key==='partial-copy'){org.presentationCopy={roleDescriptor:'Synthetic partial presentation example'};org.capabilities.forEach(c=>c.presentationCopy={catalogueTeaser:c.presentationCopy?.catalogueTeaser});}
 if(key==='multi-no-teaser')org.editorialProfile.executiveRelevanceSummary=Array(2).fill(org.editorialProfile.executiveRelevanceSummary).join('\n\n');
 if(key==='centre'||key==='zero')org.capabilities=[];
 if(key==='many')org.capabilities=Array.from({length:12},(_,i)=>({...structuredClone(org.capabilities[i%8]),id:randomUUID(),slug:`synthetic-many-capability-${i+1}`,name:`Synthetic offering ${i+1}`,presentationCopy:undefined}));
 if(org.primaryLocation && org.primaryLocation.latitude===null){const points={kraken:[47.5615,-52.7126],airbus:[45.6501,-74.0837],subsea:[48.6505788,-123.398324]};const point=points[key as keyof typeof points]??points.kraken;org.primaryLocation.latitude=point[0];org.primaryLocation.longitude=point[1];}
 if(!org.primaryLocation) org.primaryLocation={id:randomUUID(),name:"Synthetic regional location",city:null,provinceTerritory:"Nova Scotia",countryCode:"CA",latitude:44.6488,longitude:-63.5752,geographicConfidence:"regional",regionSlug:"atlantic-canada"};
 if(key==='connections')org.citations.push({...org.citations[0],sourceUrl:'https://example.org/synthetic-long-source-title',sourceTitle:'Synthetic long source title: public integration, configuration-specific operating qualifications, programme participation and supporting infrastructure across several phases of development and acceptance; this fixture is not evidence of a real organization or a real deployment.'});
 const id=randomUUID();org.id=id;
 await insert('organizations',{id,slug:org.slug,name:org.name,legal_name:org.legalName,description:org.description,website_url:org.websiteUrl,entity_kind:org.entityKind,organization_categories:org.categories.length?org.categories:[org.entityKind==='company'?'commercial_company':org.entityKind],source_confidence:org.sourceConfidence,freshness_status:org.freshnessStatus,publication_status:'draft',published_at:'2026-09-28T00:00:00Z',last_reviewed_at:org.lastReviewedAt,founded_year:org.foundedYear,employee_range:org.employeeRange,company_stage:org.companyStage,ownership:org.ownership,commercial_status:org.commercialStatus,disclosed_financing_summary:org.disclosedFinancingSummary,profile_data:org.profileData,editorial_profile_version:org.editorialProfile.version,current_activity:org.editorialProfile.currentActivity,current_activity_as_of:org.editorialProfile.currentActivityAsOf,operating_context:org.editorialProfile.operatingContext,canadian_footprint:org.editorialProfile.canadianFootprint,executive_relevance_summary:org.editorialProfile.executiveRelevanceSummary,reviewed_questions:JSON.stringify(org.editorialProfile.reviewedQuestions),snapshot_observations:JSON.stringify(synthetic?[]:org.editorialProfile.snapshotObservations??[]),display_lead:org.presentationCopy?.displayLead??null,role_descriptor:org.presentationCopy?.roleDescriptor??null});
 if(org.primaryLocation){const l=org.primaryLocation,lid=randomUUID();await insert('locations',{id:lid,name:l.name,city:l.city,province_territory:l.provinceTerritory,country_code:l.countryCode,latitude:l.latitude,longitude:l.longitude,geographic_confidence:l.geographicConfidence});await insert('organization_locations',{organization_id:id,location_id:lid,location_role:synthetic?'regional_role':'headquarters',is_primary:true,publication_status:'published'});}
 await cite('organization',id,org.citations);
 // Official logo storage path only. The isolated server redirects asset requests to this approved public asset.
 if(org.logo)await insert('media_assets',{organization_id:id,asset_type:'logo',storage_path:new URL(org.logo.publicUrl).pathname.split('/atlas-public-media/')[1],source_url:org.logo.sourceUrl,source_visibility:'public',attribution_text:org.logo.attributionText,approval_status:'approved',publication_status:'published'});
 for(const c of org.capabilities){const cid=randomUUID();await insert('capabilities',{id:cid,organization_id:id,slug:c.slug,name:c.name,summary:c.summary,capability_type:c.capabilityType,core_features:c.coreFeatures,defence_applications:c.defenceApplications,technical_tags:c.technicalTags,novelty:c.novelty,technology_readiness_level:c.technologyReadinessLevel,maturity:c.maturity,commercial_availability:c.commercialAvailability,source_confidence:c.sourceConfidence,last_reviewed_at:c.lastReviewedAt,publication_status:'published',published_at:'2026-09-28T00:00:00Z',display_lead:c.presentationCopy?.displayLead??null,catalogue_teaser:c.presentationCopy?.catalogueTeaser??null});await cite('capability',cid,c.citations);
 for(const domain of c.technicalDomains){let result=await db.query<{id:string}>('select id from public.technical_domains where slug=$1',[domain.slug]);if(!result.rows.length){await insert('technical_domains',{id:randomUUID(),slug:domain.slug,name:domain.name,summary:domain.summary,publication_status:'published'});result=await db.query('select id from public.technical_domains where slug=$1',[domain.slug]);}await insert('capability_domains',{capability_id:cid,technical_domain_id:result.rows[0].id,publication_status:'published',is_primary:true});}
 for(const m of c.missionMatches){const mid=randomUUID();let result=await db.query<{id:string}>('select id from public.mission_areas where slug=$1',[m.missionArea.slug]);if(!result.rows.length){await insert('mission_areas',{id:randomUUID(),slug:m.missionArea.slug,name:m.missionArea.name,summary:m.missionArea.summary,publication_status:'published'});result=await db.query('select id from public.mission_areas where slug=$1',[m.missionArea.slug]);}await insert('capability_mission_matches',{id:mid,capability_id:cid,mission_area_id:result.rows[0].id,alignment_summary:m.alignmentSummary,match_type:m.matchType,confidence:m.confidence,review_status:'approved',publication_status:'published'});await cite('capability_mission_match',mid,m.citations);}
 if(key==='connections')for(const m of c.demandMatches){const mid=randomUUID(),did=randomUUID(),sid=randomUUID();const sourceId=(await db.query<{id:string}>('select id from public.sources where canonical_url=$1',[m.citations[0].sourceUrl])).rows[0].id;await insert('demand_sources',{id:sid,source_id:sourceId,slug:`synthetic-demand-source-${sid}`,title:m.demandTitle,publisher:'Synthetic public issuer',summary:m.alignmentSummary,publication_status:'published'});await insert('demand_requirements',{id:did,demand_source_id:sid,slug:`synthetic-need-${did}`,title:m.demandTitle,problem_statement:m.alignmentSummary,desired_end_state:'Synthetic resilient operator picture',public_caveat:'Synthetic test data; no real buyer interest.',publication_status:'published'});await insert('capability_demand_matches',{id:mid,capability_id:cid,demand_requirement_id:did,match_type:m.matchType,alignment_summary:m.alignmentSummary,rationale:'Synthetic relationship coverage fixture.',confidence:m.confidence,review_status:'approved',publication_status:'published'});await cite('capability_demand_match',mid,m.citations);}
 routes.push(`/capabilities/${c.slug}`);
 }
 if(key==='connections'){
  for(const p of org.programs){const pid=randomUUID(),link=randomUUID();await insert('programs',{id:pid,slug:`synthetic-${p.programSlug}`,name:p.programName,program_type:p.programType,summary:p.programSummary,operator_name:p.programOperatorName,website_url:p.programUrl,publication_status:'published'});await insert('program_participations',{id:link,organization_id:id,program_id:pid,participation_type:p.participationType,cohort_label:p.cohortLabel,public_summary:p.publicSummary,lifecycle_stage:p.lifecycleStage,announced_on:p.announcedOn,started_on:p.startedOn,ended_on:p.endedOn,external_identifiers:JSON.stringify(p.externalIdentifiers),publication_status:'published'});await cite('program_participation',link,p.citations);await cite('program',pid,p.programCitations??[]);}
  for(const f of org.fundingEvents){const fid=randomUUID();await insert('funding_events',{id:fid,organization_id:id,event_type:f.eventType,announced_on:f.announcedOn,amount_value:f.amountValue,amount_currency:f.amountCurrency,disclosed_summary:f.disclosedSummary,publication_status:'published'});await cite('funding_event',fid,f.citations);}
  for(const r of org.relationships){const rid=randomUUID();await insert('organization_relationships',{id:rid,organization_id:id,related_organization_name:r.relatedOrganizationName,relationship_type:r.relationshipType,public_summary:r.publicSummary,publication_status:'published'});await cite('organization_relationship',rid,r.citations);}
 }
 await db.query("update public.organizations set publication_status='published' where id=$1",[id]);
 routes.push(`/organizations/${org.slug}`);
}
await db.exec('commit');
await db.exec('set role anon');
// No fixture bypass: every relation goes through actual PostgreSQL RLS and the real view.
let queue=Promise.resolve();
const server=createServer((req,res)=>{queue=queue.then(async()=>{
 try{
 const url=new URL(req.url??'/', 'http://127.0.0.1:54329');
 if(url.pathname.startsWith('/storage/v1/object/public/atlas-public-media/')){res.writeHead(302,{Location:`https://facoactpdckkhciamflk.supabase.co${url.pathname}`});res.end();return;}
 if(url.pathname==='/rest/v1/rpc/dossier_presentation_copy_ready'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify((await db.query<{ready:boolean}>('select public.dossier_presentation_copy_ready() ready')).rows[0].ready));return;}
 if(!['GET','HEAD'].includes(req.method??''))throw new Error('Local review API is read-only');
 const table=url.pathname.match(/^\/rest\/v1\/([a-z_]+)$/)?.[1];if(!table)throw new Error('Unknown route');
 const columns=url.searchParams.get('select')??'*';if(columns!=='*'&&!/^[a-z_, ]+$/.test(columns))throw new Error(`Unsupported projection ${columns}`);
 const conditions:string[]=[],params:unknown[]=[];
 for(const [key,v] of url.searchParams){if(['select','order','offset','limit'].includes(key))continue;if(!/^[a-z_]+$/.test(key))throw new Error('Unsupported filter');
 const op=v.slice(0,v.indexOf('.')),value=v.slice(v.indexOf('.')+1);if(op==='in'){const vals=value.slice(1,-1).split(',').map(s=>s.replace(/^"|"$/g,''));conditions.push(`"${key}"::text=any($${params.push(vals)}::text[])`);}else if(['eq','neq','gt','gte','lt','lte'].includes(op)){const operator={eq:'=',neq:'<>',gt:'>',gte:'>=',lt:'<',lte:'<='}[op];conditions.push(`"${key}"::text ${operator} $${params.push(value)}`);}else if(op==='is'&&['null','true','false'].includes(value))conditions.push(`"${key}" is ${value}`);else throw new Error(`Unsupported filter ${op}`);}
 const where=conditions.length?` where ${conditions.join(' and ')}`:'';
 const order=(url.searchParams.get('order')??'').split(',').filter(Boolean).map(part=>{const [column,direction]=part.split('.');if(!/^[a-z_]+$/.test(column))throw new Error('Invalid order');return `"${column}" ${direction==='desc'?'desc':'asc'}`;}).join(',');
 const offset=Number(url.searchParams.get('offset')??0),limit=Number(url.searchParams.get('limit')??1000);if(!Number.isInteger(offset)||!Number.isInteger(limit)||offset<0||limit<0)throw new Error('Invalid range');
 const count=(await db.query<{n:number}>(`select count(*)::integer n from public.${table}${where}`,params)).rows[0].n;
 const {rows}=await db.query(`select ${columns} from public.${table}${where}${order?` order by ${order}`:''} limit ${Math.min(limit,1000)} offset ${offset}`,params);
 const single=(req.headers.accept??'').includes('vnd.pgrst.object');
 res.writeHead(single&&rows.length!==1?406:200,{'Content-Type':'application/json','Content-Range':`${offset}-${offset+rows.length-1}/${count}`});res.end(req.method==='HEAD'?'':JSON.stringify(single?(rows[0]??{code:'PGRST116',details:'0 rows'}):rows));
 }catch(error){console.error(req.url,error instanceof Error?error.message:error);res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({message:String(error)}));}
 }).catch(console.error);});
server.listen(54329,'127.0.0.1',()=>console.log(JSON.stringify({isolated:true,port:54329,routes},null,2)));
process.on('SIGINT',()=>{server.close();void db.close().then(()=>process.exit(0));});

}
void main().catch(error=>{console.error(error);process.exitCode=1;});
