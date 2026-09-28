"use client";
import { useState } from "react";
import type { AtlasOrganization } from "@/types/atlas";
import { presentationCopyGuidance, type DossierPresentationDraft } from "@/lib/atlas/dossier-presentation-copy";
import { DossierParagraphs } from "@/components/atlas/dossier-reading";

export function LocalCopyEditor({ organization, specimen }: { organization: AtlasOrganization; specimen: string }) {
  const [draft, setDraft] = useState<DossierPresentationDraft>({ organization: organization.presentationCopy ?? {}, capabilities: Object.fromEntries(organization.capabilities.map(capability => [capability.id, capability.presentationCopy ?? {}])) });
  const [reviewed, setReviewed] = useState(false);
  const fieldClass = "mt-2 block w-full rounded border border-[var(--atlas-border-strong)] bg-white p-3 text-sm leading-6";
  const updateOrganization = (field: "displayLead" | "roleDescriptor", value: string) => { setDraft({ ...draft, organization: { ...draft.organization, [field]: value } }); setReviewed(false); };
  const updateCapability = (id: string, field: "displayLead" | "catalogueTeaser", value: string) => { setDraft({ ...draft, capabilities: { ...draft.capabilities, [id]: { ...draft.capabilities[id], [field]: value } } }); setReviewed(false); };
  return <details className="my-4 border-y border-[var(--atlas-border)] py-3"><summary className="cursor-pointer font-semibold">Local editor and reviewer workflow</summary>
    <p className="my-4 text-sm">This edits optional presentation copy in this preview URL only. It never writes a database, candidate, published record or research instruction. Full narrative and TNM assessment remain separate and read-only.</p>
    <form action="/dev/profile-design" method="get" className="max-w-4xl space-y-6">
      <input type="hidden" name="specimen" value={specimen} /><input type="hidden" name="copy" value={JSON.stringify(draft)} /><input type="hidden" name="reviewed" value={reviewed ? "1" : "0"} />
      <fieldset className="space-y-4"><legend className="font-bold">{organization.name}: reviewed presentation copy</legend>
        <label className="block text-sm">Display lead · normally 35–65 words<textarea className={fieldClass} rows={3} value={draft.organization.displayLead ?? ""} onChange={event => updateOrganization("displayLead", event.target.value)} /></label>
        <label className="block text-sm">Role descriptor · normally 3–10 words<input className={fieldClass} value={draft.organization.roleDescriptor ?? ""} onChange={event => updateOrganization("roleDescriptor", event.target.value)} /></label>
        {presentationCopyGuidance(draft.organization).map(issue => <p role="status" key={issue.field} className="text-sm">Review guidance · {issue.field}: {issue.message}</p>)}
        <details><summary className="cursor-pointer text-sm">Full source-supported organization narrative (unchanged)</summary><DossierParagraphs text={organization.description} className="my-3 text-sm leading-7" /></details>
        {organization.editorialProfile.executiveRelevanceSummary ? <details><summary className="cursor-pointer text-sm">TNM assessment (interpretation, unchanged)</summary><DossierParagraphs text={organization.editorialProfile.executiveRelevanceSummary} className="my-3 text-sm leading-7" /></details> : null}
      </fieldset>
      {organization.capabilities.map(capability => <fieldset key={capability.id} className="space-y-4 border-t border-[var(--atlas-border)] pt-4"><legend className="font-bold">{capability.name}: reviewed presentation copy</legend>
        <label className="block text-sm">Display lead · normally 35–65 words<textarea rows={3} className={fieldClass} value={draft.capabilities[capability.id]?.displayLead ?? ""} onChange={event => updateCapability(capability.id, "displayLead", event.target.value)} /></label>
        <label className="block text-sm">Catalogue teaser · normally 25–55 words<textarea rows={3} className={fieldClass} value={draft.capabilities[capability.id]?.catalogueTeaser ?? ""} onChange={event => updateCapability(capability.id, "catalogueTeaser", event.target.value)} /></label>
        {presentationCopyGuidance(draft.capabilities[capability.id] ?? {}).map(issue => <p role="status" key={issue.field} className="text-sm">Review guidance · {issue.field}: {issue.message}</p>)}
        <details><summary className="cursor-pointer text-sm">Full technical narrative and qualifications (unchanged)</summary><DossierParagraphs text={capability.summary} className="my-3 text-sm leading-7" /><DossierParagraphs text={capability.maturity} className="my-3 text-sm leading-7" /><DossierParagraphs text={capability.commercialAvailability} className="my-3 text-sm leading-7" /></details>
      </fieldset>)}
      <div className="rounded bg-[var(--atlas-blue-soft)] p-5"><h3 className="font-bold">Local reviewer check</h3><p className="mt-2 text-sm">Check identity, attribution, variant, period and material qualifications against the full narrative and its sources. Suggested lengths are review prompts, never rejection limits. Clearing a field omits that compact element.</p>
        <label className="my-4 flex items-start gap-3 text-sm"><input type="checkbox" checked={reviewed} onChange={event => setReviewed(event.target.checked)} />I have reviewed this local presentation copy against the full narrative. This does not approve publication.</label>
        <button className="atlas-primary-button min-h-11 px-4 text-sm disabled:opacity-50" disabled={!reviewed}>Apply reviewed copy to local preview</button>
      </div>
    </form>
  </details>;
}
