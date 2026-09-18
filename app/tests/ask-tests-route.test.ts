import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only",()=>({}));
const state=vi.hoisted(()=>({user:null as unknown,run:vi.fn(),catalogue:vi.fn()}));
vi.mock("@/lib/atlas/auth",()=>({getAtlasUser:async()=>state.user}));
vi.mock("@/lib/atlas/assistant",()=>({runAtlasAssistant:state.run}));
vi.mock("@/lib/atlas/assistant-catalogue",()=>({getAssistantCatalogue:state.catalogue,hydrateAssistantOrganizations:vi.fn()}));
import { POST } from "@/app/api/admin/ask-tests/route";
import { ATLAS_ADMIN_OWNER_ID, ATLAS_ADMIN_OWNER_EMAIL } from "@/lib/atlas/admin-owner";
import { atlasTestSnapshot } from "./fixtures/atlas-snapshot";
const request=(body:object={caseIndex:0,mode:"lexical"},origin="https://truenorthmap.ca")=>new Request("https://truenorthmap.ca/api/admin/ask-tests",{method:"POST",headers:{origin,"content-type":"application/json"},body:JSON.stringify(body)});
beforeEach(()=>{
  state.user={id:ATLAS_ADMIN_OWNER_ID,email:ATLAS_ADMIN_OWNER_EMAIL,role:"admin"};
  vi.stubEnv("ASK_JEV_MODE","owner-pilot");vi.stubEnv("TYPESAFE_API_KEY","fixture");
  state.run.mockReset().mockResolvedValue({answer:null,metrics:{latencyMs:2},organizations:[]});
  state.catalogue.mockReset().mockResolvedValue({snapshot:atlasTestSnapshot,revision:"fixture",latencyMs:1});
});
it("denies anonymous/non-owner and cross-origin requests before data or paid work",async()=>{
  state.user=null;expect((await POST(request())).status).toBe(403);
  state.user={id:"other",email:ATLAS_ADMIN_OWNER_EMAIL,role:"admin"};expect((await POST(request())).status).toBe(403);
  state.user={id:ATLAS_ADMIN_OWNER_ID,email:ATLAS_ADMIN_OWNER_EMAIL,role:"admin"};expect((await POST(request({},"https://evil.example"))).status).toBe(403);
  expect(state.run).not.toHaveBeenCalled();expect(state.catalogue).not.toHaveBeenCalled();
});
it("passes a fixed question and lexical override only through the authenticated test route",async()=>{
  expect((await POST(request())).status).toBe(200);
  expect(state.run).toHaveBeenCalledWith(expect.objectContaining({isOwner:true,selectionDisabled:true,priorTurns:[]}));
});
it("rejects invented replay receipts and unknown override fields before paid work",async()=>{
  expect((await POST(request({caseIndex:0,mode:"answer-replay",receipt:"fake.fake"}))).status).toBe(409);
  expect((await POST(request({caseIndex:0,mode:"lexical",query:"injected"}))).status).toBe(400);
  expect(state.run).not.toHaveBeenCalled();
});
