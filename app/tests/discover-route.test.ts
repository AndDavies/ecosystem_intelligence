import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ rpc: vi.fn(), model: vi.fn(), insert: vi.fn(), user: null as {id:string}|null, openAi: true, database: true }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/atlas/auth", () => ({ getAtlasUser: async () => state.user }));
vi.mock("@/lib/atlas/assistant", async (original) => ({ ...await original<object>(), runAtlasAssistant: state.model }));
vi.mock("@/lib/atlas/repository", () => ({
  getAtlasSnapshot: async () => ({organizations:[]}),
  discoverAtlasSnapshot: () => ({organizationIds:[],capabilityIds:[],filters:{},interpretation:"no_match",summary:"No supported match"})
}));
vi.mock("@/lib/supabase/env", () => ({ hasOpenAiEnv: () => state.openAi, hasSupabaseAdminEnv: () => state.database }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc:state.rpc, from: () => ({
  select: () => ({ eq: () => ({ gte: async () => ({ count:0 }) }) }),
  insert: state.insert
}) }) }));
import { POST } from "@/app/api/discover/route";
const makeRequest = (body:object={query:"Find Canadian maritime sensors"}) => new Request("https://truenorthmap.ca/api/discover",{
  method:"POST", headers:{"content-type":"application/json","x-forwarded-for":"8.8.8.8"},body:JSON.stringify(body)
});
beforeEach(() => {
  state.openAi=true;state.database=true;state.user=null;
  state.rpc.mockReset().mockResolvedValue({data:[{allowed:true,used:3}],error:null});
  state.model.mockReset().mockResolvedValue({answer:null,fallbackReason:"unavailable",metrics:{model:"test",latencyMs:1}});
  state.insert.mockReset().mockReturnValue({select:()=>({single:async()=>({data:null,error:{message:"telemetry unavailable"}})})});
});
describe("Ask True North paid-call boundary", () => {
  it("reserves before invoking the model and permits the final allowed request", async () => {
    const response=await POST(makeRequest()); const body=await response.json();
    expect(response.status).toBe(200);expect(state.model).toHaveBeenCalledOnce();
    expect(state.rpc.mock.invocationCallOrder[0]).toBeLessThan(state.model.mock.invocationCallOrder[0]);
    expect(state.rpc).toHaveBeenCalledWith("reserve_assistant_request",{p_subject_hash:expect.stringMatching(/^[a-f0-9]{64}$/),p_limit:3});
    expect(body.quota).toEqual({signedIn:false,limit:3,used:3,remaining:0});expect(body.searchId).toBeNull();
  });
  it("returns the existing discovery fallback on a rejected reservation without a paid call", async () => {
    state.rpc.mockResolvedValue({data:[{allowed:false,used:3}],error:null});
    const body=await (await POST(makeRequest())).json();
    expect(body.fallbackReason).toBe("quota");expect(state.model).not.toHaveBeenCalled();expect(state.insert).not.toHaveBeenCalled();
  });
  it.each(["database_error","network_error","malformed_result","unconfigured"])("fails closed on %s", async (failure) => {
    if(failure==="database_error")state.rpc.mockResolvedValue({data:null,error:{message:"failed"}});
    if(failure==="network_error")state.rpc.mockRejectedValue(new Error("connection lost"));
    if(failure==="malformed_result")state.rpc.mockResolvedValue({data:[{allowed:true}],error:null});
    if(failure==="unconfigured")state.database=false;
    const response=await POST(makeRequest());
    expect(response.status).toBe(200);expect(state.model).not.toHaveBeenCalled();
  });
  it("does not reserve capacity when the model is unconfigured", async () => {
    state.openAi=false;await POST(makeRequest());expect(state.rpc).not.toHaveBeenCalled();expect(state.model).not.toHaveBeenCalled();
  });
  it("keeps the member allowance and a completed result when telemetry throws", async () => {
    state.user={id:"member-1"};state.insert.mockImplementation(()=>{throw new Error("write failed");});
    expect((await POST(makeRequest())).status).toBe(200);
    expect(state.rpc).toHaveBeenCalledWith("reserve_assistant_request",expect.objectContaining({p_limit:20}));
    expect(state.model).toHaveBeenCalledOnce();
  });
  it.each([{query:"sensors\u0000"},{query:"sensors",cohort:"\u0000"},{query:"sensors",contextPath:"/\u0000"},{query:"sensors",priorTurns:[{query:"x\u0000",organizationIds:[]}]}])("rejects database-incompatible input before reserving or calling the provider: %j",async (body)=>{
    expect((await POST(makeRequest(body))).status).toBe(400);expect(state.rpc).not.toHaveBeenCalled();expect(state.model).not.toHaveBeenCalled();
  });
});
