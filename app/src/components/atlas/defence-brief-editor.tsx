"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon, Plus, Save, Trash2 } from "lucide-react";
import { PendingButton } from "@/components/ui/pending-button";
import { saveDefenceBrief } from "@/lib/actions/briefs-admin";
import { seededDefenceBriefImages } from "@/lib/atlas/brief-images";

type Section = { heading: string; paragraphs: string[]; points: string[] };
type SourceLink = { sourceId: string; citationNote: string; displayOrder: number };
type RecordLink = { recordType: "organization" | "capability" | "demand_requirement"; recordId: string; relationshipLabel: string; displayOrder: number };
export type BriefDraft = {
  id: string; slug: string; title: string; thesis: string; bottomLine: string; standfirst: string;
  keyTakeaways: string[]; sections: Section[]; implications: string; limitations: string; recommendedAction: string;
  format: "Explainer" | "Guide" | "Analysis"; topic: string; audience: string; heroImagePath: string; heroImageAlt: string;
  seoTitle: string; metaDescription: string; authorName: string; publicationStatus: "draft" | "published" | "archived";
  sourceLinks: SourceLink[]; recordLinks: RecordLink[];
};
export type BriefSourceOption = { id: string; title: string; publisher: string };
export type BriefRecordOption = { id: string; type: RecordLink["recordType"]; name: string };
export type BriefImageOption = { value: string; label: string };

const field = "rounded-xl border border-[var(--atlas-border)] bg-white px-3 py-2.5 text-sm text-[var(--atlas-ink)] outline-none focus:border-[var(--atlas-primary)]";
const area = `${field} min-h-24 leading-6`;
const blank: BriefDraft = {
  id: "", slug: "new-defence-brief", title: "", thesis: "", bottomLine: "", standfirst: "", keyTakeaways: [],
  sections: [{ heading: "", paragraphs: [""], points: [] }], implications: "", limitations: "", recommendedAction: "",
  format: "Explainer", topic: "Canadian defence", audience: "Canadian defence business-development and ecosystem leaders",
  heroImagePath: seededDefenceBriefImages[0].value, heroImageAlt: "", seoTitle: "", metaDescription: "", authorName: "Andrew Davies",
  publicationStatus: "draft", sourceLinks: [], recordLinks: []
};
const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "new-defence-brief";

export function DefenceBriefEditor({ initial, sources, records, images }: { initial?: BriefDraft; sources: BriefSourceOption[]; records: BriefRecordOption[]; images: BriefImageOption[] }) {
  const [draft, setDraft] = useState(initial ?? blank);
  const availableImages = images.some((image) => image.value === draft.heroImagePath) || !draft.heroImagePath
    ? images
    : [{ value: draft.heroImagePath, label: "Current article image" }, ...images];
  const update = <K extends keyof BriefDraft>(key: K, value: BriefDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const payload = {
    ...draft,
    slug: draft.id ? draft.slug : slugify(draft.title),
    sections: draft.sections.map((section) => ({
      heading: section.heading.trim(), paragraphs: section.paragraphs.map((paragraph) => paragraph.trim()).filter(Boolean), points: section.points,
      // Keep the legacy shape during one deployment so the previous production build can still render safely.
      question: section.heading.trim(), answer: section.paragraphs.join("\n\n").trim()
    })),
    sourceLinks: undefined, recordLinks: undefined, id: undefined
  };
  return <form action={saveDefenceBrief} className="grid gap-5">
    <input type="hidden" name="pageId" value={draft.id} /><input type="hidden" name="payload" value={JSON.stringify(payload)} /><input type="hidden" name="sourceLinks" value={JSON.stringify(draft.sourceLinks)} /><input type="hidden" name="recordLinks" value={JSON.stringify(draft.recordLinks)} />
    <div className="grid gap-4 md:grid-cols-2"><Field label="Article headline" help="State the subject and consequence clearly. Avoid writing the headline as a question."><input className={field} value={draft.title} onChange={(e) => update("title", e.target.value)} minLength={8} required /></Field><Field label="Thesis" help="The central claim this article will support with public evidence."><input className={field} value={draft.thesis} onChange={(e) => update("thesis", e.target.value)} minLength={12} required /></Field></div>
    <Field label="Standfirst" help="A concise introduction shown under the headline and on article cards."><textarea className={area} value={draft.standfirst} onChange={(e) => update("standfirst", e.target.value)} minLength={40} required /></Field>
    <Field label="Bottom line" help="Lead with the conclusion. Give the reader the useful answer before the analysis."><textarea className={area} value={draft.bottomLine} onChange={(e) => update("bottomLine", e.target.value)} minLength={40} required /></Field>
    <Field label="Executive takeaways" help="One concrete takeaway per line. Keep the list short enough to scan."><textarea className={field} rows={5} value={draft.keyTakeaways.join("\n")} onChange={(e) => update("keyTakeaways", e.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} /></Field>
    <div className="space-y-4">{draft.sections.map((section, index) => <section key={index} className="rounded-2xl border border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] p-4"><div className="flex items-center justify-between"><h3 className="text-sm font-extrabold">Article section {index + 1}</h3>{draft.sections.length > 1 ? <button type="button" aria-label={`Remove section ${index + 1}`} onClick={() => update("sections", draft.sections.filter((_, i) => i !== index))} className="text-[var(--atlas-muted)]"><Trash2 className="size-4" /></button> : null}</div><div className="mt-3 grid gap-3"><input className={field} placeholder="Section heading" value={section.heading} onChange={(e) => update("sections", draft.sections.map((item, i) => i === index ? { ...item, heading: e.target.value } : item))} required /><textarea className={`${area} min-h-40`} placeholder="Narrative body. Separate paragraphs with a blank line." value={section.paragraphs.join("\n\n")} onChange={(e) => update("sections", draft.sections.map((item, i) => i === index ? { ...item, paragraphs: e.target.value.split(/\n\s*\n/).map((paragraph) => paragraph.trim()) } : item))} required /><textarea className={field} rows={3} placeholder="Optional supporting points, one per line" value={section.points.join("\n")} onChange={(e) => update("sections", draft.sections.map((item, i) => i === index ? { ...item, points: e.target.value.split("\n").map((point) => point.trim()).filter(Boolean) } : item))} /></div></section>)}</div>
    <button type="button" onClick={() => update("sections", [...draft.sections, { heading: "", paragraphs: [""], points: [] }])} className="atlas-secondary-button w-fit px-4 py-2 text-xs"><Plus className="mr-2 size-4" />Add article section</button>
    <div className="grid gap-4 lg:grid-cols-3"><Field label="Format"><select className={field} value={draft.format} onChange={(e) => update("format", e.target.value as BriefDraft["format"])}><option>Explainer</option><option>Guide</option><option>Analysis</option></select></Field><Field label="Topic"><input className={field} value={draft.topic} onChange={(e) => update("topic", e.target.value)} required /></Field><Field label="Primary reader"><input className={field} value={draft.audience} onChange={(e) => update("audience", e.target.value)} required /></Field></div>
    <Field label="What this means" help="Your evidence-bounded interpretation. The public page clearly distinguishes this analysis from sourced facts."><textarea className={area} value={draft.implications} onChange={(e) => update("implications", e.target.value)} /></Field>
    <Field label="Recommended next step" help="Give the reader one realistic action or decision to take next."><textarea className={area} value={draft.recommendedAction} onChange={(e) => update("recommendedAction", e.target.value)} /></Field>
    <Field label="Limits and caveats" help="State what the public evidence cannot establish."><textarea className={area} value={draft.limitations} onChange={(e) => update("limitations", e.target.value)} /></Field>
    <section className="rounded-2xl border border-[var(--atlas-border)] bg-white p-4"><div className="flex items-center gap-2"><ImageIcon className="size-4 text-[var(--atlas-primary)]" /><h3 className="text-sm font-extrabold">Main article image</h3></div><div className="mt-4 grid gap-5 lg:grid-cols-[220px_1fr]"><div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-[var(--atlas-surface-muted)]">{draft.heroImagePath ? <Image src={draft.heroImagePath} alt="" fill sizes="220px" className="object-cover" /> : null}</div><div className="grid gap-4"><Field label="Choose from the image library"><select className={field} value={draft.heroImagePath} onChange={(e) => update("heroImagePath", e.target.value)} required><option value="">Select an image…</option>{availableImages.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field><Field label="Upload a new image" help="JPEG, PNG, or WebP up to 10 MB. The uploaded image is stored in the public Defence Briefs image library and selected when you save."><input className={field} type="file" name="heroImageFile" accept="image/jpeg,image/png,image/webp" /></Field><Field label="Image description" help="Describe the visible subject and context for people who cannot see the image."><input className={field} value={draft.heroImageAlt} onChange={(e) => update("heroImageAlt", e.target.value)} minLength={12} required /></Field></div></div></section>
    <div className="grid gap-4 md:grid-cols-2"><Field label="Search title"><input className={field} value={draft.seoTitle} onChange={(e) => update("seoTitle", e.target.value)} required /></Field><Field label="Search description"><textarea className={field} rows={3} value={draft.metaDescription} onChange={(e) => update("metaDescription", e.target.value)} minLength={40} required /></Field></div>
    <Field label="Public sources" help="A published brief must link at least one approved public source."><select className={field} value="" onChange={(e) => { const source = sources.find((item) => item.id === e.target.value); if (source && !draft.sourceLinks.some((item) => item.sourceId === source.id)) update("sourceLinks", [...draft.sourceLinks, { sourceId: source.id, citationNote: `Public evidence from ${source.publisher}.`, displayOrder: draft.sourceLinks.length + 1 }]); }}><option value="">Add a source…</option>{sources.map((source) => <option key={source.id} value={source.id}>{source.publisher} · {source.title}</option>)}</select><div className="grid gap-2">{draft.sourceLinks.map((link, index) => { const source = sources.find((item) => item.id === link.sourceId); return <div key={link.sourceId} className="grid gap-2 rounded-xl border border-[var(--atlas-border)] p-3 md:grid-cols-[1fr_2fr_auto]"><span className="text-xs font-semibold">{source?.title ?? link.sourceId}</span><input className={field} value={link.citationNote} onChange={(e) => update("sourceLinks", draft.sourceLinks.map((item, i) => i === index ? { ...item, citationNote: e.target.value } : item))} /><button type="button" onClick={() => update("sourceLinks", draft.sourceLinks.filter((_, i) => i !== index))}><Trash2 className="size-4" /></button></div>; })}</div></Field>
    <Field label="Related records" help="Give readers a useful next step into a defence need, company, or technology."><select className={field} value="" onChange={(e) => { const record = records.find((item) => `${item.type}:${item.id}` === e.target.value); if (record && !draft.recordLinks.some((item) => item.recordType === record.type && item.recordId === record.id)) update("recordLinks", [...draft.recordLinks, { recordType: record.type, recordId: record.id, relationshipLabel: "Explore the related record", displayOrder: draft.recordLinks.length + 1 }]); }}><option value="">Add a related record…</option>{records.map((record) => <option key={`${record.type}:${record.id}`} value={`${record.type}:${record.id}`}>{record.type.replace("_", " ")} · {record.name}</option>)}</select><div className="grid gap-2">{draft.recordLinks.map((link, index) => { const record = records.find((item) => item.id === link.recordId && item.type === link.recordType); return <div key={`${link.recordType}:${link.recordId}`} className="grid gap-2 rounded-xl border border-[var(--atlas-border)] p-3 md:grid-cols-[1fr_2fr_auto]"><span className="text-xs font-semibold">{record?.name ?? link.recordId}</span><input className={field} value={link.relationshipLabel} onChange={(e) => update("recordLinks", draft.recordLinks.map((item, i) => i === index ? { ...item, relationshipLabel: e.target.value } : item))} /><button type="button" onClick={() => update("recordLinks", draft.recordLinks.filter((_, i) => i !== index))}><Trash2 className="size-4" /></button></div>; })}</div></Field>
    <div className="grid gap-4 md:grid-cols-2"><Field label="Author"><input className={field} value={draft.authorName} onChange={(e) => update("authorName", e.target.value)} /></Field><Field label="Status"><select className={field} value={draft.publicationStatus} onChange={(e) => update("publicationStatus", e.target.value as BriefDraft["publicationStatus"])}><option value="draft">Private draft</option><option value="published">Reviewed and public</option><option value="archived">Archived</option></select></Field></div>
    <PendingButton type="submit" pendingLabel="Saving brief…" className="atlas-primary-button w-fit px-5 py-3 text-sm"><Save className="mr-2 size-4" />{draft.publicationStatus === "published" ? "Publish brief" : "Save brief"}</PendingButton>
  </form>;
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-xs font-bold text-[var(--atlas-ink-soft)]"><span>{label}</span>{children}{help ? <span className="text-[11px] font-normal leading-5 text-[var(--atlas-muted)]">{help}</span> : null}</label>; }
