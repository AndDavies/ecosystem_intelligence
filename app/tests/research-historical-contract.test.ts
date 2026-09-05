import {readFile} from "node:fs/promises";
import path from "node:path";
import {describe,expect,it} from "vitest";
import {researchRunSchema,researchCollectionPlanV1Schema,researchProspectInventoryV1Schema,sourceLeadBatchV2Schema,researchClaimLedgerV1Schema,researchCandidateBatchV2Schema,researchRecordSpecificityIssues} from "@/lib/research/pipeline-schema";
async function history(runId:string){
  const read=async(folder:string)=>JSON.parse(await readFile(path.resolve("../research/ingestion",folder,`${runId}.json`),"utf8"));
  return {run:researchRunSchema.parse(await read("runs")),plan:researchCollectionPlanV1Schema.parse(await read("collection-plans-v1")),prospects:researchProspectInventoryV1Schema.parse(await read("prospect-inventories-v1")),leads:sourceLeadBatchV2Schema.parse(await read("source-leads-v2")),ledger:researchClaimLedgerV1Schema.parse(await read("claim-ledgers-v1")),batch:researchCandidateBatchV2Schema.parse(await read("candidate-batches-v2")),signals:null};
}
describe("historical Research contracts",()=>{
  it.each(["tnm-manual-20260812130446","tnm-manual-20260812140253"])("validates %s under its recorded 1.7.2 recovery rule and preserves the current stricter rule",async(runId)=>{
    const artifacts=await history(runId);expect(artifacts.run.agentVersion).toBe("tnm-research-pipeline/1.7.2");
    expect(researchRecordSpecificityIssues(artifacts)).toEqual([]);
    artifacts.run.agentVersion="tnm-research-pipeline/1.8.0";
    expect(researchRecordSpecificityIssues(artifacts).filter(issue=>issue.startsWith("Deferred lead"))).toHaveLength(artifacts.batch.deferred.length);
  });
  it("does not weaken the historical three-lane requirement to the portable two-lane shape",async()=>{
    const artifacts=await history("tnm-manual-20260812130446");const lead=artifacts.leads.leads.find(item=>item.disposition==="deferred"&&item.deferralClass==="recovery_exhausted")!;
    lead.recoveryAttempts=lead.recoveryAttempts!.slice(0,2);
    expect(researchRecordSpecificityIssues(artifacts)).toContain(`Deferred lead ${lead.id} searched 2 source lanes; discovery_batch requires at least 3.`);
  });
});
