"use client";
import { useState } from "react";
import { presentationCopyGuidance, type OrganizationPresentationCopy, type CapabilityPresentationCopy } from "@/lib/atlas/dossier-presentation-copy";
export function ReviewedPresentationFields({copy, kind}: {copy: OrganizationPresentationCopy & CapabilityPresentationCopy; kind:"organization"|"capability"}) {
 const [value,setValue]=useState(copy);
 const fields=kind==="organization" ? ["displayLead","roleDescriptor"] as const : ["displayLead","catalogueTeaser"] as const;
 return <div className="grid gap-4">{fields.map(field=><label key={field} className="grid gap-2 text-sm"><strong>{field==="displayLead"?"Reviewed header introduction":field==="roleDescriptor"?"Organization role descriptor":"Reviewed catalogue teaser"}</strong><textarea name={field} rows={field==="roleDescriptor"?2:4} value={value[field]??""} onChange={event=>setValue({...value,[field]:event.target.value})} className="form-control h-auto py-3"/><span className="text-xs text-[var(--admin-muted)]">{presentationCopyGuidance(value).find(item=>item.field===field)?.message ?? "Optional factual presentation copy. Keep material qualifications. A blank field explicitly clears the published value."}</span></label>)}</div>;
}
