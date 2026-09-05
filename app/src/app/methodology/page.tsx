import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { socialMetadata } from "@/lib/seo/social";

export const metadata = {
  title: "Methodology",
  description: "How True North Map reviews Canadian organizations, technology, evidence, freshness, and public-source assessments.",
  alternates: { canonical: "/methodology" },
  ...socialMetadata({ title: "How True North Map Reviews the Evidence", description: "See how Canadian organizations, technologies, defence needs, sources, and assessments move through human review.", path: "/methodology", eyebrow: "Evidence and human review" })
};

const steps = [
  ["1", "Find durable public sources", "Official organization, government, program, and primary product sources are preferred. Social posts are discovery leads, not evidence by themselves."],
  ["2", "Connect each claim to its source", "A private draft records the exact public page, relevant passage, date, and the profile details it supports."],
  ["3", "Review before anything appears", "A person checks, edits, rejects, or defers the draft. Research never becomes public on its own."],
  ["4", "Show uncertainty and gaps", "Unknown values remain absent. Public evidence, location accuracy, freshness, and our assessments are labelled so a polished profile never implies false certainty."],
  ["5", "Correct and refresh", "Organizations and users can claim, correct, or suggest profiles. Every contribution enters the same private review path, and stale sources remain visible as a maintenance need."]
];

export default function MethodologyPage() {
  return (
    <PublicPageShell eyebrow="Evidence and human review" title="Useful intelligence should be inspectable." description="True North Map separates what public sources say from our reviewed assessment and states the limits of the available evidence." backHref="/" backLabel="Home" actions={<Link href="/how-it-works" className="atlas-primary-button h-11 px-5 text-sm">See the visitor journey <ArrowRight className="size-4" /></Link>}>
      <div className="grid gap-4 lg:grid-cols-2">{steps.map(([number, title, detail]) => <PublicCard key={number} title={title} eyebrow={`Step ${number}`}><p className="text-sm leading-6 text-[var(--atlas-muted)]">{detail}</p></PublicCard>)}</div>
      <PublicCard title="How to read ‘Where this technology may help’" eyebrow="Important caveat" className="mt-5"><p className="text-sm leading-6 text-[var(--atlas-muted)]">A technology-to-demand connection means a person reviewed the technology, the released defence need, and the supporting sources, then judged the connection useful enough to show. It does not establish procurement eligibility, customer interest, government endorsement, classified demand, or a formal business opportunity. Users must conduct their own diligence.</p></PublicCard>
      <PublicCard title="How Ask True North helps you explore" eyebrow="AI with clear limits" className="mt-5"><p className="text-sm leading-6 text-[var(--atlas-muted)]">Ask True North searches only the published organizations, technologies, missions, Demand Signals, and citations already visible on the site. It cannot search private drafts or invent a company. It shows our assessment separately from the public evidence and makes missing information visible. Every new record still requires human review before the assistant can use it.</p></PublicCard>
      <PublicCard title="What a profile must earn before publication" eyebrow="Minimum standard" className="mt-5"><ul className="grid gap-2 text-sm leading-6 text-[var(--atlas-muted)] sm:grid-cols-2"><li>Official identity and website</li><li>Organization type and reviewed location</li><li>At least one durable public source</li><li>Freshness and public-evidence rating</li><li>One reviewed technology or offering for commercial organizations</li><li>Direct citations for substantive claims</li><li>No placeholders or invented metrics</li><li>Explicit human publication decision</li></ul></PublicCard>
      <section className="mt-8 rounded-[18px] bg-[var(--atlas-blue-soft)] p-6 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8" aria-labelledby="methodology-next-step">
        <div><p className="atlas-eyebrow">Inspect the method in practice</p><h2 id="methodology-next-step" className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-[var(--atlas-ink)]">Open a published profile and follow its sources.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--atlas-muted)]">See what an organization offers, where the assessment begins, and where the evidence stops.</p></div>
        <Link href="/organizations" className="atlas-secondary-button mt-5 h-11 shrink-0 px-5 text-sm sm:mt-0">Browse organizations <ArrowRight className="size-4" /></Link>
      </section>
    </PublicPageShell>
  );
}
