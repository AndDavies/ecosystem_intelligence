import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { buildAssistantCatalog } from "@/lib/atlas/assistant";
import { buildJevRecords } from "@/lib/atlas/assistant-jev";
import { retrieveAssistantPool } from "@/lib/atlas/assistant-retrieval";
import { atlasTestSnapshot } from "./fixtures/atlas-snapshot";
it("deduplicates passages while preserving field/identity bindings and qualifications", () => {
  const snapshot=structuredClone(atlasTestSnapshot); const org=snapshot.organizations[0];
  const citation=org.capabilities[0].citations[0];
  org.citations=[{...citation,id:"org-binding",fieldName:"description"}];
  org.capabilities[0].citations=[{...citation,id:"cap-binding",fieldName:"maturity"}];
  org.capabilities[0].maturity="Prototype only; deployment not established.";
  const result=buildAssistantCatalog(snapshot,[org]);
  expect(result.organizations[0].citations[0].passageId).toBe(result.organizations[0].capabilities[0].citations[0].passageId);
  expect(result.organizations[0].citations[0].id).toBe("org-binding");
  expect(result.organizations[0].capabilities[0].citations[0].id).toBe("cap-binding");
  expect(JSON.stringify(result)).toContain("Prototype only; deployment not established.");
  expect(result.publicNeeds.every(need=>org.capabilities.some(cap=>cap.demandMatches.some(m=>m.demandRequirementId===need.id)))).toBe(true);
});
it("canonicalizes record ordering and retrieves only supplied organizations",()=>{
  const a=structuredClone(atlasTestSnapshot); const b=structuredClone(a); b.organizations.reverse(); b.organizations.forEach(org=>org.capabilities.reverse());
  expect(buildJevRecords(a)).toEqual(buildJevRecords(b));
  const result=retrieveAssistantPool(a,a.organizations[0].name,[],2);
  expect(result.length).toBeLessThanOrEqual(2); expect(result[0].id).toBe(a.organizations[0].id);
  expect(result.every(org=>a.organizations.includes(org))).toBe(true);
});
