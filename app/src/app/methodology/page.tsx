import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";

export const metadata = {
  title: "Methodology",
  description: "How Ecosystem Intelligence verifies Canadian organizations, capabilities, evidence, freshness, and public-source assessments."
};

const steps = [
  ["1", "Find durable public sources", "Official organization, government, program, and primary product sources are preferred. Social posts are discovery leads, not evidence by themselves."],
  ["2", "Stage field-level claims", "Research creates private candidates with canonical URLs, excerpts, confidence, duplicate checks, and the exact fields each source supports."],
  ["3", "Review before publication", "A human reviewer accepts, edits, rejects, or defers each candidate. Accepted research is still not public until a separate promotion decision."],
  ["4", "Show uncertainty and gaps", "Unknown values remain absent. Evidence strength, location accuracy, freshness, and analyst assessments are labelled so a polished profile never implies false certainty."],
  ["5", "Correct and refresh", "Organizations and users can claim, correct, or suggest profiles. Every contribution enters the same private review path, and stale sources remain visible as a maintenance need."]
];

export default function MethodologyPage() {
  return (
    <PublicPageShell eyebrow="Evidence and editorial governance" title="Useful intelligence should be inspectable." description="Ecosystem Intelligence separates verified public facts from analyst interpretation and keeps every public change reviewable.">
      <div className="grid gap-4 lg:grid-cols-2">{steps.map(([number, title, detail]) => <PublicCard key={number} title={title} eyebrow={`Step ${number}`}><p className="text-sm leading-6 text-[var(--atlas-muted)]">{detail}</p></PublicCard>)}</div>
      <PublicCard title="How to read public demand relevance" eyebrow="Important caveat" className="mt-5"><p className="text-sm leading-6 text-[var(--atlas-muted)]">A demand match means a reviewed public-source alignment between a published capability and a public requirement. It does not establish procurement eligibility, customer interest, government endorsement, classified demand, or a formal business opportunity. Users must conduct their own diligence.</p></PublicCard>
      <PublicCard title="Minimum publication standard" eyebrow="Record gate" className="mt-5"><ul className="grid gap-2 text-sm leading-6 text-[var(--atlas-muted)] sm:grid-cols-2"><li>Canonical identity and website</li><li>Organization type and reviewed location</li><li>At least one durable public source</li><li>Freshness and evidence confidence</li><li>One reviewed capability for commercial organizations</li><li>Field-level citations for substantive claims</li><li>No placeholders or invented metrics</li><li>Explicit human promotion decision</li></ul></PublicCard>
    </PublicPageShell>
  );
}
