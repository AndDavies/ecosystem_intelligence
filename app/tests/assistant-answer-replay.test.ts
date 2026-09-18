import { beforeEach,afterEach, expect,it,vi } from "vitest";
vi.mock("server-only",()=>({}));
const state=vi.hoisted(()=>({parse:vi.fn()}));
vi.mock("openai",()=>({default:class { responses={parse:state.parse}; }}));
import {atlasTestSnapshot} from "./fixtures/atlas-snapshot";
beforeEach(()=>{vi.resetModules();vi.stubEnv("OPENAI_MODEL","test-model");vi.stubEnv("OPENAI_API_KEY","test-key");state.parse.mockReset().mockResolvedValue({model:"test-model",usage:{input_tokens:100,output_tokens:20},output_parsed:{outcome:"coverage_gap",interpretedNeed:"Need",summary:"Not established.",matches:[],gaps:[],followUpSuggestions:[]}});});
afterEach(()=>vi.unstubAllEnvs());
it("rejects a changed evidence packet before an answering-model call",async()=>{
 const {runAtlasAssistant}=await import("@/lib/atlas/assistant");
 await expect(runAtlasAssistant({snapshot:atlasTestSnapshot,query:"Need",priorTurns:[],safetyIdentifier:"fixture",fixedOrganizationIds:[atlasTestSnapshot.organizations[0].id],expectedCatalogueFingerprint:"0".repeat(64)})).rejects.toThrow("Replay evidence changed");
 expect(state.parse).not.toHaveBeenCalled();
});
it("replays the same bounded capabilities and returns the supplied public evidence records",async()=>{
 const {runAtlasAssistant,buildAssistantCatalog}=await import("@/lib/atlas/assistant");
 const {jevFingerprint}=await import("@/lib/atlas/assistant-jev");
 const org=atlasTestSnapshot.organizations[0];const supplied={...org,capabilities:org.capabilities.slice(0,1)};
 const result=await runAtlasAssistant({snapshot:atlasTestSnapshot,query:"Need",priorTurns:[],safetyIdentifier:"fixture",fixedOrganizationIds:[org.id],fixedCapabilityIds:supplied.capabilities.map(c=>c.id),expectedCatalogueFingerprint:jevFingerprint(buildAssistantCatalog(atlasTestSnapshot,[supplied]))});
 expect(state.parse).toHaveBeenCalledOnce();expect(result.organizations).toEqual([supplied]);
 expect(result.metrics.selection?.selectedCapabilityIds).toEqual(supplied.capabilities.map(c=>c.id));
});
