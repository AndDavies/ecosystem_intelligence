"use client";

import { useState } from "react";
import { Plus, Save } from "lucide-react";
import { PendingButton } from "@/components/ui/pending-button";
import { upsertPublishedDemandSignal } from "@/lib/actions/atlas-demand-signals";

export type DemandRequirementDraft = {
  id: string;
  slug: string;
  title: string;
  problemStatement: string;
  desiredEndState: string;
  publicCaveat: string;
  displayOrder: number;
};

export type DemandSignalDraft = {
  id: string;
  issuerId: string;
  slug: string;
  title: string;
  publisher: string;
  canonicalUrl: string;
  publishedOn: string;
  summary: string;
  sourceKind: string;
  commitmentLevel: string;
  sourceLocator: string;
  sourceExcerpt: string;
  sourceVerified: boolean;
  requirements: DemandRequirementDraft[];
};

export type DemandIssuerOption = {
  id: string;
  name: string;
  jurisdiction: string;
};

const fieldClass = "rounded-md border border-[var(--admin-border)] bg-white px-3 py-2 text-sm text-[var(--admin-ink)] outline-none focus:border-[var(--admin-action)]";
const areaClass = `${fieldClass} min-h-24 leading-6`;
const caveat = "Public-source alignment only. This is not procurement eligibility, endorsement, customer interest, or a classified requirement.";

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "new-demand-requirement";
}

export function DemandSignalEditor({ initial, issuers }: { initial?: DemandSignalDraft; issuers: DemandIssuerOption[] }) {
  const [signal, setSignal] = useState<DemandSignalDraft>(initial ?? {
    id: "", issuerId: "", slug: "new-demand-signal", title: "", publisher: "", canonicalUrl: "", publishedOn: "", summary: "",
    sourceKind: "official_problem_statement", commitmentLevel: "directional",
    sourceLocator: "", sourceExcerpt: "", sourceVerified: false,
    requirements: [{ id: "", slug: "new-demand-requirement", title: "", problemStatement: "", desiredEndState: "", publicCaveat: caveat, displayOrder: 1 }]
  });

  const update = (field: keyof DemandSignalDraft, value: string) => setSignal((current) => ({ ...current, [field]: value }));
  const updateRequirement = (index: number, field: keyof DemandRequirementDraft, value: string | number) => setSignal((current) => ({
    ...current,
    requirements: current.requirements.map((requirement, itemIndex) => itemIndex === index ? { ...requirement, [field]: value } : requirement)
  }));
  const payload = {
    ...signal,
    slug: signal.id ? signal.slug : slugify(signal.title),
    requirements: signal.requirements.map((requirement) => ({ ...requirement, slug: requirement.id ? requirement.slug : slugify(requirement.title) }))
  };

  return (
    <form action={upsertPublishedDemandSignal} className="grid gap-5">
      <input type="hidden" name="demandSourceId" value={signal.id} />
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Public title"><input className={fieldClass} value={signal.title} onChange={(event) => update("title", event.target.value)} required minLength={8} /></Field>
        <Field label="Issuing authority" help="Choose the organization that issued the public signal. Existing relationship records are updated safely when this changes."><select className={fieldClass} value={signal.issuerId} onChange={(event) => update("issuerId", event.target.value)} required><option value="">Choose an issuing authority</option>{issuers.map((issuer) => <option key={issuer.id} value={issuer.id}>{issuer.name}, {issuer.jurisdiction}</option>)}</select></Field>
        <Field label="Publisher"><input className={fieldClass} value={signal.publisher} onChange={(event) => update("publisher", event.target.value)} required /></Field>
        <Field label="Canonical public source"><input className={fieldClass} type="url" value={signal.canonicalUrl} onChange={(event) => update("canonicalUrl", event.target.value)} required /></Field>
        <Field label="Published date"><input className={fieldClass} type="date" value={signal.publishedOn} onChange={(event) => update("publishedOn", event.target.value)} /></Field>
        <Field label="Signal type" help="What the public source represents, not how important it feels."><select className={fieldClass} value={signal.sourceKind} onChange={(event) => update("sourceKind", event.target.value)}><option value="official_problem_statement">Official problem statement</option><option value="innovation_challenge">Innovation challenge</option><option value="strategic_policy">Strategic policy</option><option value="capability_plan">Capability plan</option><option value="funding_program">Funding program</option><option value="procurement_notice">Procurement notice</option><option value="award_or_contract">Award or contract</option></select></Field>
        <Field label="Commitment level" help="Directional signals describe a need; programmatic signals have a funded or structured pathway; procurement signals are active buying notices."><select className={fieldClass} value={signal.commitmentLevel} onChange={(event) => update("commitmentLevel", event.target.value)}><option value="directional">Directional</option><option value="programmatic">Programmatic</option><option value="procurement">Procurement</option></select></Field>
      </div>
      <Field label="Why this signal matters"><textarea className={areaClass} value={signal.summary} onChange={(event) => update("summary", event.target.value)} required minLength={40} /></Field>

      <section className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4">
        <h3 className="text-sm font-bold text-[var(--admin-ink)]">Verify the released public source</h3>
        <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">Identify the exact passage that states the defence need. This evidence appears on the public page and is required before publication.</p>
        <div className="mt-4 grid gap-4">
          <Field label="Where the need appears" help="Use a page, section, heading, paragraph, or document reference that another person can find."><input className={fieldClass} value={signal.sourceLocator} onChange={(event) => update("sourceLocator", event.target.value)} required minLength={3} placeholder="Page 12, Operational challenge" /></Field>
          <Field label="Relevant source passage" help="Quote only the concise passage needed to support the public problem and outcome."><textarea className={areaClass} value={signal.sourceExcerpt} onChange={(event) => update("sourceExcerpt", event.target.value)} required minLength={40} /></Field>
          <label className="flex items-start gap-3 rounded-md border border-[var(--admin-border)] bg-white p-3 text-xs leading-5 text-[var(--admin-ink-soft)]">
            <input type="checkbox" className="mt-1 size-4 accent-[var(--admin-action)]" checked={signal.sourceVerified} onChange={(event) => setSignal((current) => ({ ...current, sourceVerified: event.target.checked }))} required />
            <span><strong className="block text-[var(--admin-ink)]">I reviewed this released public source.</strong>The passage above supports the problem statement and outcome. It is not an inferred, private, or classified need.</span>
          </label>
        </div>
      </section>

      <div className="space-y-4">
        {signal.requirements.map((requirement, index) => (
          <section key={requirement.id || index} className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4">
            <h3 className="text-sm font-bold text-[var(--admin-ink)]">Public problem statement {index + 1}</h3>
            {requirement.id ? <p className="mt-1 text-[11px] text-[var(--admin-muted)]">Stable record: {requirement.slug}. Editing preserves every linked technology match.</p> : null}
            <div className="mt-4 grid gap-4">
              <Field label="Headline"><input className={fieldClass} value={requirement.title} onChange={(event) => updateRequirement(index, "title", event.target.value)} required minLength={8} /></Field>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="What needs to change"><textarea className={areaClass} value={requirement.problemStatement} onChange={(event) => updateRequirement(index, "problemStatement", event.target.value)} required minLength={40} /></Field>
                <Field label="What success looks like"><textarea className={areaClass} value={requirement.desiredEndState} onChange={(event) => updateRequirement(index, "desiredEndState", event.target.value)} required minLength={40} /></Field>
              </div>
              <Field label="Public caveat"><textarea className={fieldClass} rows={2} value={requirement.publicCaveat} onChange={(event) => updateRequirement(index, "publicCaveat", event.target.value)} required minLength={20} /></Field>
            </div>
          </section>
        ))}
      </div>
      <button type="button" onClick={() => setSignal((current) => ({ ...current, requirements: [...current.requirements, { id: "", slug: "new-demand-requirement", title: "", problemStatement: "", desiredEndState: "", publicCaveat: caveat, displayOrder: current.requirements.length + 1 }] }))} className="inline-flex w-fit items-center gap-2 rounded-md border border-[var(--admin-border-strong)] bg-white px-4 py-2 text-xs font-semibold text-[var(--admin-ink-soft)]"><Plus className="size-4" />Add another public problem statement</button>
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <Field label="Change rationale" help="Record the public evidence checked and why the wording is accurate."><textarea name="rationale" className={fieldClass} rows={2} required minLength={20} placeholder="Checked the official source and clarified the user-facing outcome without changing the underlying requirement." /></Field>
        <PendingButton type="submit" pendingLabel="Saving…" className="h-11 bg-[var(--admin-action)] px-5 text-sm font-semibold text-white"><Save className="mr-2 size-4" />{signal.id ? "Save demand signal" : "Publish new demand signal"}</PendingButton>
      </div>
    </form>
  );
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-xs font-semibold text-[var(--admin-ink-soft)]"><span>{label}</span>{children}{help ? <span className="text-[11px] font-normal leading-5 text-[var(--admin-muted)]">{help}</span> : null}</label>;
}
