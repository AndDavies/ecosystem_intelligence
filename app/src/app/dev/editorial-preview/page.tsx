import { EditorialFailureExamples } from "@/components/atlas/editorial-failure-examples";
import { SnapshotReview } from "@/components/atlas/snapshot-review";
import { notFound } from "next/navigation";
import Link from "@/components/atlas/navigation-link";
import { ExecutiveOrganizationDossier } from "@/components/atlas/executive-organization-dossier";
import { editorialSpecimens, savedComparison, analyticalSpecimen } from "@/lib/atlas/editorial-specimens";
export const dynamic = "force-dynamic";
export const metadata = {title:"Local editorial candidate",robots:{index:false,follow:false}};
export default async function EditorialPreview({searchParams}:{searchParams:Promise<{specimen?:string}>}) {
  if(process.env.NODE_ENV !== "development") notFound();
  const query = await searchParams;
  const key = query.specimen && query.specimen in editorialSpecimens ? query.specimen as keyof typeof editorialSpecimens : "enhanced";
  return <>
    <aside className="mx-auto max-w-7xl p-6" aria-label="Local preview controls">
      <p className="font-bold">Local editorial candidate · not published or reader-validated</p>
      <nav className="my-4 flex flex-wrap gap-5" aria-label="Specimens">{Object.keys(editorialSpecimens).map(name=><Link className="underline" key={name} href={`?specimen=${name}`}>{name}</Link>)}</nav>
      <p className="text-sm">{key === "saved" ? "Controlled writing-only comparison · retained September 6 evidence, no added facts." : key === "enhanced" ? "Rich specimen · restored September 6 dossier plus separately supported reporting clarification. Saved review dates are historical, not fresh validation." : "Sparse source-backed specimen · intentionally limited coverage, not a complete dossier."}</p>
      {key === "saved" && <details className="mt-4"><summary className="cursor-pointer">Compare saved wording and evidence</summary><p className="my-3">Before: {savedComparison.before}</p><p className="text-sm">Saved packet: {savedComparison.packet}</p>{savedComparison.evidence.map(source=><p className="my-2" key={source.url}><a className="atlas-prose-link" href={source.url}>{source.note}</a></p>)}</details>}
      <p className="mt-3 text-sm">No external imagery is loaded. Missing logos use the existing initials fallback. <Link href="/dev/dossier-preview" className="underline">Separate synthetic layout fixture</Link></p>
    </aside>
    <details className="mx-auto max-w-7xl px-6 py-3"><summary className="cursor-pointer text-sm">Comparison, private Review and synthetic checks</summary>
    <details className="py-4"><summary>Analytical story and separate email specimen</summary><article className="max-w-3xl py-5"><h2 className="text-2xl font-bold">{analyticalSpecimen.title}</h2>{analyticalSpecimen.paragraphs.map(text=><p className="mt-4 leading-7" key={text}>{text}</p>)}<a href={analyticalSpecimen.sourceUrl} className="atlas-prose-link">Original results</a><h3 className="mt-5 font-bold">Email entry point (same evidence)</h3><p className="mt-3">{analyticalSpecimen.email}</p></article></details>
    <details className="mx-auto max-w-7xl px-6 py-4"><summary>Private Review presentation (local specimen)</summary><SnapshotReview observations={editorialSpecimens[key].editorialProfile.snapshotObservations ?? []} /></details>
    <EditorialFailureExamples />
    </details>
    <ExecutiveOrganizationDossier organization={editorialSpecimens[key]} mapReturnTo="/map" profilePath="/dev/editorial-preview" relatedIntelligence={{briefs:[],signals:[],organizations:[]}} trackEngagement={false}/>
  </>;
}
