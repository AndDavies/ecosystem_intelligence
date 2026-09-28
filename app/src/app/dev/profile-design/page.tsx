import { notFound } from "next/navigation";
import Link from "@/components/atlas/navigation-link";
import { ExecutiveOrganizationDossier } from "@/components/atlas/executive-organization-dossier";
import { CapabilityDossier } from "@/components/atlas/capability-dossier";
import { reviewedPresentationDraft } from "@/lib/atlas/dossier-presentation-copy";
import { LocalCopyEditor } from "./copy-editor";

export const dynamic = "force-dynamic";
export const metadata = {title:"Option A · local design fixtures",robots:{index:false,follow:false}};
export default async function ProfileDesignPreview({searchParams}:{searchParams:Promise<{specimen?:string;cap?:string;clean?:string;copy?:string;reviewed?:string}>}) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { fixtureKeys, profileFixture, fixtureRelated } = await import("./fixtures");
  const query = await searchParams;
  const key = fixtureKeys.find(key => key === query.specimen) ?? "kraken";
  const organization = profileFixture(key);
  let error: string | null = null;
  if (query.copy) {
    try {
      const draft = reviewedPresentationDraft(JSON.parse(query.copy), organization.capabilities.map(capability => capability.id), query.reviewed === "1");
      organization.presentationCopy = draft.organization;
      organization.capabilities.forEach(capability => { capability.presentationCopy = draft.capabilities[capability.id] ?? {}; });
    } catch { error = "The local copy draft was not applied: check its shape, entity mapping and reviewer acknowledgement."; }
  }
  const capability = organization.capabilities.find(capability => capability.slug === query.cap);
  const retainedCopy = query.copy && !error ? `&copy=${encodeURIComponent(query.copy)}&reviewed=1` : "";
  const previewHref = `/dev/profile-design?specimen=${key}${retainedCopy}`;
  return <>
    {query.clean !== "1" ? <aside className="mx-auto max-w-7xl px-5 py-6" aria-label="Local Option A preview controls">
      <p className="font-bold">Option A · local design specimen, not production content</p>
      <p className="mt-2 text-sm">{["kraken","airbus","subsea"].includes(key) ? "Approved reference-bundle writing and optional short-copy proposals. Published assets where available. Reference links are retained; the bundle does not supply claim-level excerpts, normalized specifications or Airbus subgroup provenance." : "Synthetic layout and failure-state fixture; not a real organization or evidence."}</p>
      <nav aria-label="Design specimens" className="my-3 flex flex-wrap gap-4">{fixtureKeys.map(specimen => <Link key={specimen} className="atlas-prose-link" href={`/dev/profile-design?specimen=${specimen}`}>{specimen}</Link>)}</nav>
      <nav aria-label="Companion specimens" className="my-3 flex flex-wrap gap-4"><Link href={previewHref} className="atlas-prose-link">Organization</Link>{organization.capabilities.map(capability => <Link key={capability.id} href={`${previewHref}&cap=${capability.slug}`} className="atlas-prose-link">{capability.name}</Link>)}</nav>
      <p className="text-sm">Actions retain their real application destinations. Inspect destinations without sending submissions or saving synthetic records. <Link className="atlas-prose-link" href={`${previewHref}${capability ? `&cap=${capability.slug}` : ""}&clean=1`}>Hide review controls</Link></p>
      {error ? <p role="alert" className="mt-4 text-[var(--atlas-danger)]">{error}</p> : null}
      <LocalCopyEditor organization={organization} specimen={key} />
    </aside> : null}
    {capability ? <CapabilityDossier organization={organization} capability={capability} mapReturnTo="/map" relatedContent={<></>} /> : <ExecutiveOrganizationDossier organization={organization} mapReturnTo="/map" profilePath={`/organizations/${organization.slug}`} relatedIntelligence={fixtureRelated} trackEngagement={false} />}
    {query.clean === "1" ? <p className="px-5 py-3 text-xs">Local Option A fixture · not published. <Link href={previewHref} className="atlas-prose-link">Return to review controls</Link></p> : null}
  </>;
}
