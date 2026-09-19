import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assistantAnswerReferences, buildAssistantCatalog, finalizeAssistantAnswer, classifyAssistantFailure } from "@/lib/atlas/assistant";
import { atlasTestSnapshot } from "./fixtures/atlas-snapshot";
function fixture() {
  const snapshot = structuredClone(atlasTestSnapshot);
  const orgs = snapshot.organizations.slice(0,2);
  orgs[1].capabilities = [{...structuredClone(orgs[0].capabilities[0]), id:"second-capability", organizationId:orgs[1].id}];
  orgs.forEach((o,i) => { o.citations = [{id:`citation-${i}`,fieldName:"description",sourceTitle:"Source",sourceUrl:"https://example.com",publisher:"Publisher",sourceType:"company_website",excerpt:"Concrete support",publishedAt:null}]; });
  const refs = assistantAnswerReferences(buildAssistantCatalog(snapshot,orgs),orgs);
  const raw = { outcome:"closest_supported" as const, interpretedNeed:"Testing access",summary:"A supported place to begin, subject to availability.",matches:[{organizationId:"o1",capabilityId:null,fitLevel:"plausible" as const,supportPoints:[{text:"Concrete support",citationIds:[refs.catalogue.organizations[0].citations[0].id]}],limitations:["Availability unverified"],hasMaterialGap:true}],gaps:["Availability is unverified."],followUpSuggestions:[] };
  return {snapshot,orgs,refs,raw};
}
it("maps bounded references exactly to admitted IDs and preserves the leading answer",()=>{
 const {snapshot,orgs,refs,raw}=fixture(); const decoded=refs.decode(raw);
 expect(decoded.matches[0].organizationId).toBe(orgs[0].id);
 expect(decoded.matches[0].supportPoints[0].citationIds).toEqual(["citation-0"]);
 const result=finalizeAssistantAnswer(snapshot,decoded,orgs);
 expect(result.matches[0].organizationId).toBe(orgs[0].id);
 expect(result.summary).toBe(raw.summary);
 expect(JSON.stringify(refs.catalogue)).not.toContain(orgs[0].id);
});
it("rejects a mistyped UUID or unknown short reference instead of silently dropping a match",()=>{
 const {refs,raw}=fixture();
 for(const id of ["5f376a4e-3e39-4633-9b6c-c88acaf8b418","o99"]) {
  raw.matches[0].organizationId=id;
  expect(refs.schema.safeParse(raw).success).toBe(false);
  expect(()=>refs.decode(raw)).toThrow("Invalid structured output references");
 }
 expect(classifyAssistantFailure(new Error("Invalid structured output references")).failureClass).toBe("invalid_output");
});
it("rejects valid references owned by a different organization and duplicate result identities",()=>{
 const {refs,raw}=fixture();
 const crossCitation=structuredClone(raw);crossCitation.matches[0].supportPoints[0].citationIds=[refs.catalogue.organizations[1].citations[0].id];
 expect(()=>refs.decode(crossCitation)).toThrow("citation ownership");
 const crossCapability={...raw,matches:[{...raw.matches[0],capabilityId:refs.catalogue.organizations[1].capabilities[0].id}]};
 expect(()=>refs.decode(crossCapability)).toThrow("ownership");
 expect(()=>refs.decode({...raw,matches:[raw.matches[0],raw.matches[0]]})).toThrow("ownership");
});
