import { beforeEach, describe, expect, it, vi } from "vitest";
const state=vi.hoisted(()=>({tables:{} as Record<string,Record<string,unknown>[]>,calls:[] as Array<{table:string;from:number;to:number;ids:Record<string,unknown[]>}>}));
vi.mock("server-only",()=>({}));
vi.mock("@/lib/supabase/env",()=>({hasSupabaseAdminEnv:()=>false}));
vi.mock("@/lib/supabase/public",()=>({createPublicClient:()=>({from:(table:string)=>{
  const filters: Array<(row:Record<string,unknown>)=>boolean>=[];const ids:Record<string,unknown[]>={};
  const builder={select:()=>builder,eq:(column:string,value:unknown)=>{filters.push(row=>row[column]===value);return builder;},
    in:(column:string,values:unknown[])=>{ids[column]=values;filters.push(row=>values.includes(row[column]));return builder;},order:()=>builder,
    range:async(from:number,to:number)=>{state.calls.push({table,from,to,ids});return {data:(state.tables[table]??[]).filter(row=>filters.every(filter=>filter(row))).slice(from,to+1),error:null};},
    then:(resolve:(result:unknown)=>unknown)=>Promise.resolve({data:(state.tables[table]??[]).filter(row=>filters.every(filter=>filter(row))).slice(0,1000),error:null}).then(resolve)};
  return builder;
}})}));
import { loadAtlasSnapshotFromSupabase, loadAtlasMissionLinksForCapabilitiesFromSupabase, loadAtlasDemandIndexFromSupabase } from "@/lib/atlas/supabase-repository";
const published={publication_status:"published"};
beforeEach(()=>{
  state.calls=[];state.tables={
    organizations:Array.from({length:1205},(_,i)=>({id:`org-${i}`,slug:`org-${i}`,name:`Organization ${i}`,entity_kind:"company",organization_categories:[],...published})),
    capabilities:[{id:"cap-0",organization_id:"org-0",slug:"cap-0",name:"Sensor",...published}],
    technical_domains:Array.from({length:1233},(_,i)=>({id:`domain-${i}`,slug:`domain-${i}`,name:`Domain ${i}`,...published})),
    capability_domains:Array.from({length:1233},(_,i)=>({capability_id:"cap-0",technical_domain_id:`domain-${i}`,...published})),
    field_citations:Array.from({length:1101},(_,i)=>({id:`citation-${i}`,entity_id:"cap-0",entity_type:"capability",field_name:"summary",evidence_snippet_id:`evidence-${i}`})),
    evidence_snippets:Array.from({length:1101},(_,i)=>({id:`evidence-${i}`,source_id:"source-0",excerpt:"Supported",visibility:"public",public_approved:true})),
    sources:[{id:"source-0",title:"Source",canonical_url:"https://example.ca/evidence",visibility:"public",public_approved:true}]
  };
});
describe("complete rich atlas reads",()=>{
  it("retains organizations, domain links and dense citations past a Data API page",async()=>{
    const snapshot=await loadAtlasSnapshotFromSupabase();
    expect(snapshot.organizations).toHaveLength(1205);
    const capability=snapshot.organizations.find(o=>o.id==="org-0")!.capabilities[0];
    expect(capability.technicalDomains).toHaveLength(1233);expect(capability.citations).toHaveLength(1101);
    for(const table of ["organizations","technical_domains","capability_domains","field_citations"]){expect(state.calls.some(call=>call.table===table&&call.from===1000)).toBe(true);}
  });
  it("inherits the organization scope for every capability child read and excludes unrelated evidence",async()=>{
    state.tables.capability_domains.push({capability_id:"unrelated",technical_domain_id:"domain-1",...published});
    const snapshot=await loadAtlasSnapshotFromSupabase({organizationIds:["org-0"]});
    expect(snapshot.organizations.map(o=>o.id)).toEqual(["org-0"]);
    for(const table of ["capability_domains","capability_mission_matches","capability_demand_matches","capability_clusters"]){
      expect(state.calls.filter(call=>call.table===table).every(call=>JSON.stringify(call.ids.capability_id)==='["cap-0"]')).toBe(true);
    }
    const empty=await loadAtlasSnapshotFromSupabase({organizationIds:[]});expect(empty.organizations).toEqual([]);
  });
  it("counts all approved demand matches while excluding unreviewed and unverified material",async()=>{
    state.tables.demand_sources=[{id:"need-source",source_id:"source-0",source_evidence_snippet_id:"evidence-0",source_verified_at:"2026-09-05",source_verified_by:"reviewer",...published}];
    state.tables.demand_requirements=[{id:"need-1",demand_source_id:"need-source",slug:"need-1",title:"Verified need",...published},{id:"unverified",demand_source_id:"missing",...published}];
    state.tables.capability_demand_matches=Array.from({length:1205},(_,i)=>({id:`match-${i}`,demand_requirement_id:"need-1",review_status:"approved",...published}));
    state.tables.capability_demand_matches.push({id:"unreviewed",demand_requirement_id:"need-1",review_status:"pending",...published});
    const index=await loadAtlasDemandIndexFromSupabase();
    expect(index.demands).toHaveLength(1);expect(index.demands[0].matchCount).toBe(1205);expect(index.matchCount).toBe(1205);
  });
  it("splits large selected scopes and Mission lookups into URL-safe batches without a pilot ceiling",async()=>{
    const ids=state.tables.organizations.map(row=>String(row.id));
    expect((await loadAtlasSnapshotFromSupabase({organizationIds:ids})).organizations).toHaveLength(1205);
    expect(state.calls.filter(call=>call.table==="organizations").every(call=>(call.ids.id?.length??0)<=100)).toBe(true);
    state.tables.capabilities=Array.from({length:1205},(_,i)=>({id:`cap-${i}`,organization_id:"org-0",slug:`cap-${i}`,name:`Sensor ${i}`,...published}));
    state.tables.capability_mission_matches=state.tables.capabilities.map(row=>({id:`match-${row.id}`,capability_id:row.id,mission_area_id:"mission-1",review_status:"approved",...published}));
    state.tables.mission_areas=[{id:"mission-1",slug:"mission",name:"Mission",...published}];
    const links=await loadAtlasMissionLinksForCapabilitiesFromSupabase(state.tables.capabilities.map(row=>String(row.id)));
    expect(links[0].capabilityCount).toBe(1205);expect(links[0].connectingCapabilities).toHaveLength(3);
  });
});
