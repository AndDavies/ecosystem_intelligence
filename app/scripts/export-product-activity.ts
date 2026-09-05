/** Separate product operator. This is deliberately not imported by WF04. */
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { validProductSummary } from "../src/lib/visibility/product-summary";

async function main() {
  const local = path.resolve("../research/visibility/local");
  for (const file of [path.resolve(".env.local"), path.join(local,".env")]) {
    try { process.loadEnvFile(file); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("The separate product exporter needs the approved local production service credential.");
  if (new URL(url).origin !== "https://facoactpdckkhciamflk.supabase.co") throw new Error("Product export is pinned to the approved production project.");
  const today = new Intl.DateTimeFormat("en-CA",{timeZone:"America/Halifax",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const end = new Date(`${today}T12:00:00Z`); end.setUTCDate(end.getUTCDate()-1);
  const start = new Date(end); start.setUTCDate(start.getUTCDate()-399);
  const response = await fetch(`${url}/rest/v1/rpc/get_product_activity_summary`,{method:"POST",headers:{apikey:key,authorization:`Bearer ${key}`,"content-type":"application/json"},body:JSON.stringify({start_day:start.toISOString().slice(0,10),end_day:end.toISOString().slice(0,10)}),signal:AbortSignal.timeout(30000)});
  if (!response.ok) throw new Error(`Product aggregate read failed (${response.status}).`);
  const summary: unknown = await response.json();
  if (!validProductSummary(summary)) throw new Error("Product summary failed its privacy/data contract.");
  const directory = path.join(local,"product-activity"); await mkdir(directory,{recursive:true});
  const file = path.join(directory,`${summary.collectedAt.replace(/[:.]/g,"-")}.json`);
  await writeFile(file,JSON.stringify(summary,null,2)+"\n",{mode:0o600});
  if (process.argv.includes("--skip-sync")) { console.log(JSON.stringify({ok:true,synced:false,rows:summary.rows.length,collectedAt:summary.collectedAt})); return; }
  const ingest = process.env.TNM_VISIBILITY_DASHBOARD_INGEST_URL, token = process.env.TNM_VISIBILITY_DASHBOARD_INGEST_TOKEN, bypass = process.env.TNM_VISIBILITY_DASHBOARD_SITES_BYPASS_TOKEN;
  if (!ingest || !token || !bypass) throw new Error("Protected product-summary destination is not configured.");
  const destination = new URL("/api/product-activity",ingest);
  const synced = await fetch(destination,{method:"POST",headers:{authorization:`Bearer ${token}`,"OAI-Sites-Authorization":`Bearer ${bypass}`,"content-type":"application/json"},body:JSON.stringify(summary),signal:AbortSignal.timeout(30000)});
  const receipt = await synced.json() as {ok?:boolean;collectedAt?:string};
  if (!synced.ok || !receipt.ok || receipt.collectedAt !== summary.collectedAt) throw new Error(`Product dashboard acknowledgement failed (${synced.status}); local aggregate retained for replay.`);
  await writeFile(path.join(directory,"last-acknowledgement.json"),JSON.stringify({collectedAt:summary.collectedAt,acknowledgedAt:new Date().toISOString(),rows:summary.rows.length})+"\n",{mode:0o600});
  console.log(JSON.stringify({ok:true,synced:true,rows:summary.rows.length,collectedAt:summary.collectedAt}));
}
main().catch(error=>{console.error(error instanceof Error?error.message:"Product export failed.");process.exitCode=1;});
