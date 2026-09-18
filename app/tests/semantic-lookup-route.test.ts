import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only",()=>({}));
const state=vi.hoisted(()=>({user:null as unknown,select:vi.fn(),matching:vi.fn(),catalogue:vi.fn(),rpc:vi.fn()}));
vi.mock("@/lib/atlas/auth",()=>({getAtlasUser:async()=>state.user}));
vi.mock("@/lib/atlas/assistant-catalogue",()=>({getAssistantCatalogue:state.catalogue}));
vi.mock("@/lib/atlas/assistant-selection-cache",()=>({selectCachedWithJev:state.select}));
vi.mock("@/lib/atlas/repository",()=>({matchingAtlasOrganizations:state.matching}));
vi.mock("@/lib/supabase/admin",()=>({createAdminClient:()=>({rpc:state.rpc})}));
vi.mock("@/lib/supabase/env",()=>({hasSupabaseAdminEnv:()=>true}));
import { GET,POST } from "@/app/api/atlas/semantic/route";
import { ATLAS_ADMIN_OWNER_ID,ATLAS_ADMIN_OWNER_EMAIL } from "@/lib/atlas/admin-owner";
import { atlasTestSnapshot } from "./fixtures/atlas-snapshot";
const request=()=>new Request("https://truenorthmap.ca/api/atlas/semantic",{method:"POST",headers:{origin:"https://truenorthmap.ca","content-type":"application/json"},body:JSON.stringify({query:"remote maintenance",filters:"region=atlantic&type=accelerator"})});
beforeEach(()=>{
  vi.stubEnv("ASK_JEV_MODE","owner-pilot");vi.stubEnv("TYPESAFE_API_KEY","fixture");
  state.user={id:ATLAS_ADMIN_OWNER_ID,email:ATLAS_ADMIN_OWNER_EMAIL,role:"admin"};
  state.select.mockReset().mockResolvedValue({organizations:[],judgments:[],metrics:{fallbackReason:null}});
  state.matching.mockReset().mockReturnValue([atlasTestSnapshot.organizations[0]]);
  state.catalogue.mockReset().mockResolvedValue({snapshot:atlasTestSnapshot,revision:"fixture",latencyMs:1});
  state.rpc.mockReset().mockResolvedValue({data:[{allowed:false}],error:null});
});
it("eligibility is read-only and pilot is owner-only",async()=>{
  expect(await (await GET()).json()).toEqual({available:true});expect(state.select).not.toHaveBeenCalled();
  state.user=null;expect(await (await GET()).json()).toEqual({available:false});expect((await POST(request())).status).toBe(403);
  expect(state.catalogue).not.toHaveBeenCalled();
});
it("retains explicit filters and sends only eligible records without the answering model",async()=>{
  const response=await POST(request());expect(response.status).toBe(200);
  expect(state.matching).toHaveBeenCalledWith(atlasTestSnapshot,expect.objectContaining({region:"atlantic",query:undefined}));
  const input=state.select.mock.calls[0][0];expect(input.snapshot.organizations).toHaveLength(1);expect(input.relevanceOnly).toBe(true);
  expect(state.rpc).not.toHaveBeenCalled();
});
it("fails closed on public rate reservation before catalogue/provider work",async()=>{
  vi.stubEnv("ASK_JEV_MODE","enabled");state.user=null;
  expect((await POST(request())).status).toBe(429);expect(state.catalogue).not.toHaveBeenCalled();expect(state.select).not.toHaveBeenCalled();
});
