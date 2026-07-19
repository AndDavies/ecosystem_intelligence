import { AdminNav } from "@/components/atlas/admin-nav";
import { DemandSignalEditor, type DemandIssuerOption, type DemandSignalDraft } from "@/components/atlas/demand-signal-editor";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

export default async function AdminDemandSignalsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireAtlasStaff("admin");
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: sources }, { data: requirements }, { data: canonicalSources }, { data: issuers }, { data: sourceIssuers }] = await Promise.all([
    supabase.from("demand_sources").select("*").order("title"),
    supabase.from("demand_requirements").select("*").order("display_order"),
    supabase.from("sources").select("id, canonical_url"),
    supabase.from("demand_issuers").select("id, name, jurisdiction").eq("publication_status", "published").order("name"),
    supabase.from("demand_source_issuers").select("demand_source_id, demand_issuer_id, issuer_role").eq("issuer_role", "issuer")
  ]);
  const canonicalUrlById = new Map(((canonicalSources ?? []) as Row[]).map((source) => [String(source.id), String(source.canonical_url ?? "")]));
  const issuerIdBySourceId = new Map(((sourceIssuers ?? []) as Row[]).map((relationship) => [String(relationship.demand_source_id), String(relationship.demand_issuer_id)]));
  const issuerOptions: DemandIssuerOption[] = ((issuers ?? []) as Row[]).map((issuer) => ({ id: String(issuer.id), name: String(issuer.name), jurisdiction: String(issuer.jurisdiction) }));
  const drafts: DemandSignalDraft[] = ((sources ?? []) as Row[]).map((source) => ({
    id: String(source.id), issuerId: issuerIdBySourceId.get(String(source.id)) ?? "", slug: String(source.slug), title: String(source.title), publisher: String(source.publisher),
    canonicalUrl: canonicalUrlById.get(String(source.source_id)) ?? "", publishedOn: String(source.published_on ?? ""), summary: String(source.summary),
    sourceKind: String(source.source_kind), commitmentLevel: String(source.commitment_level),
    requirements: ((requirements ?? []) as Row[]).filter((requirement) => requirement.demand_source_id === source.id).map((requirement) => ({
      id: String(requirement.id), slug: String(requirement.slug), title: String(requirement.title), problemStatement: String(requirement.problem_statement),
      desiredEndState: String(requirement.desired_end_state), publicCaveat: String(requirement.public_caveat), displayOrder: Number(requirement.display_order)
    }))
  }));

  return (
    <PublicPageShell eyebrow="Private editorial workspace" title="Manage demand signals" description="Keep public problem statements accurate, useful, and connected to every reviewed technology match." backHref="/admin" backLabel="Admin home">
      <AdminNav />
      {params.success ? <div className="mb-5 rounded-md border border-[#a6f4c5] bg-[#f6fef9] px-3 py-2 text-sm text-[#067647]">Demand signal {params.success}. Public pages and linked technology profiles were refreshed.</div> : null}
      {params.error ? <div className="mb-5 rounded-md border border-[#fda29b] bg-[#fff6f5] px-3 py-2 text-sm text-[#b42318]">The demand signal was not saved. Check every required field and try again.</div> : null}
      <PublicCard title="Add a public demand signal" eyebrow="Manual publication">
        <p className="mb-5 text-sm leading-6 text-[#475467]">Use an official public source. A new signal publishes immediately after the administrator-only transaction succeeds and records the rationale in the audit log.</p>
        <DemandSignalEditor issuers={issuerOptions} />
      </PublicCard>
      <div className="mt-5 space-y-4">
        {drafts.map((draft) => <details key={draft.id} className="rounded-lg border border-[#d0d5dd] bg-white p-5"><summary className="cursor-pointer text-sm font-bold text-[#101828]">{draft.title} <span className="ml-2 text-xs font-normal text-[#667085]">{draft.requirements.length} public problem statement{draft.requirements.length === 1 ? "" : "s"}</span></summary><div className="mt-5"><DemandSignalEditor initial={draft} issuers={issuerOptions} /></div></details>)}
      </div>
    </PublicPageShell>
  );
}
