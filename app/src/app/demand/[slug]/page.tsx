import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, ShieldAlert } from "lucide-react";
import { EvidenceList } from "@/components/atlas/evidence-list";
import { EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { getAtlasDemandBySlug } from "@/lib/atlas/repository";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const demand = await getAtlasDemandBySlug(slug);
  return demand ? { title: demand.title, description: demand.problemStatement } : { title: "Demand statement not found" };
}

export default async function DemandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demand = await getAtlasDemandBySlug(slug);
  if (!demand) notFound();

  return (
    <PublicPageShell
      eyebrow={`Public demand family ${String(demand.displayOrder).padStart(2, "0")}`}
      title={demand.title}
      description={demand.problemStatement}
      backHref="/demand"
      backLabel="All demand signals"
      actions={
        <a href={demand.source.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0756d9] px-4 text-xs font-semibold text-white no-underline hover:bg-[#0649b9] hover:no-underline">
          View authoritative source <ExternalLink className="size-4" />
        </a>
      }
    >
      <div className="flex items-start gap-3 rounded-lg border border-[#fedf89] bg-[#fffaeb] px-4 py-3 text-xs leading-5 text-[#7a2e0e]">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        <p>{demand.publicCaveat}</p>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <PublicCard title="Desired end state" eyebrow="Public problem framing">
            <p className="text-sm leading-6 text-[#475467]">{demand.desiredEndState}</p>
          </PublicCard>
          <PublicCard title="Reviewed capability landscape" eyebrow={`${demand.matches.length} published matches`}>
            {demand.matches.length ? (
              <div className="divide-y divide-[#eaecf0]">
                {demand.matches.map(({ organization, capability, match }) => (
                  <article key={match.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <Link href={`/organizations/${organization.slug}`} className="text-sm font-bold text-[#0756d9] no-underline hover:underline">{organization.name}</Link>
                        <Link href={`/capabilities/${capability.slug}`} className="mt-1 block text-xs font-semibold text-[#344054] no-underline hover:underline">{capability.name}</Link>
                      </div>
                      <span className="w-fit rounded bg-[#eaf2ff] px-2 py-1 text-[10px] font-semibold text-[#0756d9]">{match.confidence} confidence</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#475467]">{match.alignmentSummary}</p>
                  </article>
                ))}
              </div>
            ) : <EmptyCoverage title="No reviewed matches yet" detail="The public demand statement is preserved as a research target. Capabilities will not appear here until an analyst reviews the alignment and its evidence." />}
          </PublicCard>
          <PublicCard title="Known gaps and caveats" eyebrow="Coverage posture">
            <ul className="space-y-2 text-xs leading-5 text-[#475467]">
              <li className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-[#f79009]" />An empty match set indicates incomplete reviewed coverage, not a lack of relevant Canadian capability.</li>
              <li className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-[#f79009]" />Public statements do not establish procurement timing, budgets, eligibility, or endorsement.</li>
              <li className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-[#f79009]" />Every future match must remain individually reviewable and source-linked.</li>
            </ul>
          </PublicCard>
        </div>

        <aside className="space-y-5">
          <PublicCard title="Source record" eyebrow={demand.source.classificationLabel}>
            <dl className="grid gap-3 text-xs">
              <div><dt className="text-[#667085]">Publisher</dt><dd className="mt-1 font-semibold text-[#344054]">{demand.source.publisher}</dd></div>
              <div><dt className="text-[#667085]">Document</dt><dd className="mt-1 font-semibold text-[#344054]">{demand.source.title}</dd></div>
              <div><dt className="text-[#667085]">Published</dt><dd className="mt-1 font-semibold text-[#344054]">{demand.source.publishedOn ?? "Date not published"}</dd></div>
            </dl>
            <p className="mt-4 text-xs leading-5 text-[#667085]">{demand.source.summary}</p>
          </PublicCard>
          <PublicCard title="Evidence register" eyebrow="Authoritative citation">
            <EvidenceList citations={demand.citations} />
          </PublicCard>
        </aside>
      </div>
    </PublicPageShell>
  );
}
