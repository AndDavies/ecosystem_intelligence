import { createClient } from "@/lib/supabase/server";
import { collectPagedRows } from "@/lib/supabase/pagination";
import { dossierPresentationCopyAvailable } from "@/lib/atlas/presentation-copy-support";
import { presentationCopyGuidance, type OrganizationPresentationCopy, type CapabilityPresentationCopy } from "@/lib/atlas/dossier-presentation-copy";

export function PresentationCopyReview({name,copy}:{name:string;copy?:OrganizationPresentationCopy|CapabilityPresentationCopy}) {
  const labels: Record<string,string>={displayLead:"Header introduction",roleDescriptor:"Organization role",catalogueTeaser:"Capability catalogue explanation"};
  return <section className="my-3 text-sm"><h4 className="font-semibold">{name}</h4><dl className="mt-2 grid gap-2">{Object.entries(copy??{}).map(([field,value])=><div key={field}><dt className="text-xs font-semibold text-[var(--admin-muted)]">{labels[field]??field}</dt><dd className="whitespace-pre-line">{value===null?"Explicitly clear this value":value}</dd></div>)}</dl>{presentationCopyGuidance(copy??{}).map(item=><p key={item.field} className="mt-2 text-xs text-[var(--admin-muted)]">{item.field}: {item.message}</p>)}{!Object.keys(copy??{}).length?<p className="text-xs text-[var(--admin-muted)]">No presentation-copy change proposed.</p>:null}</section>;
}

/** Private Review context only; never imported by public dossier projections. */
export async function CurrentPresentationReview({organizationId}:{organizationId:string}) {
  if(!await dossierPresentationCopyAvailable())return null;
  const client=await createClient();
  const [{data:org,error},capabilities]=await Promise.all([
    client.from("organizations").select("name,description,executive_relevance_summary,display_lead,role_descriptor").eq("id",organizationId).eq("publication_status","published").maybeSingle(),
    collectPagedRows((from,to)=>client.from("capabilities").select("id,name,summary,display_lead,catalogue_teaser").eq("organization_id",organizationId).eq("publication_status","published").order("id").range(from,to),"current presentation review")
  ]);
  if(error)throw new Error("Unable to load the current presentation-copy review context.");
  if(!org)return null;
  const records=[{name:org.name,narrative:org.description,copy:{displayLead:org.display_lead,roleDescriptor:org.role_descriptor}},...capabilities.map(c=>({name:c.name,narrative:c.summary,copy:{displayLead:c.display_lead,catalogueTeaser:c.catalogue_teaser}}))];
  return <details className="mt-4 border border-[var(--admin-border)] p-4" open={records.some(r=>Object.values(r.copy).some(Boolean))}>
    <summary className="cursor-pointer text-sm font-semibold">Published introductions and full narratives — compare with the changes below</summary>
    <p className="mt-2 text-xs">These are current published values, not proposed changes. Omitted copy stays unchanged. Check that it still agrees with the new narrative and evidence before accepting.</p>
    {records.map((r,index)=><section key={index} className="mt-4 border-t border-[var(--admin-border)] pt-3"><h4 className="font-semibold">{r.name}</h4><dl className="mt-2 text-sm">{Object.entries(r.copy).map(([field,value])=><div key={field} className="mb-2"><dt className="text-xs font-semibold">{field}</dt><dd className="whitespace-pre-line">{value??"No published value"}</dd></div>)}</dl><details><summary className="cursor-pointer text-xs underline">Full factual narrative</summary><p className="mt-2 whitespace-pre-line text-sm">{r.narrative}</p></details></section>)}
    {org.executive_relevance_summary?<details className="mt-4"><summary className="cursor-pointer text-xs underline">Current TNM assessment (interpretation)</summary><p className="mt-2 whitespace-pre-line text-sm">{org.executive_relevance_summary}</p></details>:null}
  </details>;
}
