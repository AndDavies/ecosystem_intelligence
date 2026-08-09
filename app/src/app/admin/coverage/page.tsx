import Link from "next/link";
import { AdminNav } from "@/components/atlas/admin-nav";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { deriveNarrativeStatus, narrativeStatusOrder, type NarrativeStatus } from "@/lib/atlas/narrative-coverage";
import { getAtlasSnapshot } from "@/lib/atlas/repository";
import { createClient } from "@/lib/supabase/server";

type NarrativeOrganization = {
  id: string;
  name: string;
  slug: string;
  editorial_profile_version: string | null;
};

export default async function AdminCoveragePage() {
  await requireAtlasStaff("editor");
  const [snapshot, supabase] = await Promise.all([getAtlasSnapshot(), createClient()]);
  const narrativeResult = await supabase
    .from("organizations")
    .select("id, name, slug, editorial_profile_version")
    .eq("publication_status", "published");
  let narrativeOrganizations: NarrativeOrganization[] = [];
  if (narrativeResult.error && /editorial_profile_version/.test(narrativeResult.error.message ?? "")) {
    const legacyResult = await supabase.from("organizations").select("id, name, slug").eq("publication_status", "published");
    if (legacyResult.error) throw new Error("Unable to load live organization narrative coverage.");
    narrativeOrganizations = (legacyResult.data ?? []).map((organization) => ({
      id: String(organization.id),
      name: String(organization.name),
      slug: String(organization.slug),
      editorial_profile_version: null
    }));
  } else if (narrativeResult.error) {
    throw new Error("Unable to load live organization narrative coverage.");
  } else {
    narrativeOrganizations = (narrativeResult.data ?? []).map((organization) => ({
      id: String(organization.id),
      name: String(organization.name),
      slug: String(organization.slug),
      editorial_profile_version: organization.editorial_profile_version
    }));
  }
  const pendingCandidateResult = await supabase
    .from("candidate_changes")
    .select("target_entity_id, candidate_kind, status")
    .in("candidate_kind", ["organization_bundle", "organization_refresh_bundle"])
    .in("status", ["pending", "approved"]);
  if (pendingCandidateResult.error) throw new Error("Unable to load the live dossier review queue.");
  const publishedV1Ids = new Set(narrativeOrganizations
    .filter((organization) => organization.editorial_profile_version === "organization_editorial_profile_v1")
    .map((organization) => organization.id));
  const pendingIds = new Set((pendingCandidateResult.data ?? [])
    .map((candidate) => candidate.target_entity_id)
    .filter((id): id is string => Boolean(id)));
  const narrativeRows = narrativeOrganizations.map((organization) => ({
    organization,
    status: deriveNarrativeStatus({
      publishedV1: publishedV1Ids.has(organization.id),
      pendingReview: pendingIds.has(organization.id)
    })
  })).sort((left, right) => narrativeStatusOrder[left.status] - narrativeStatusOrder[right.status]
    || left.organization.name.localeCompare(right.organization.name));
  const narrativeCounts = narrativeRows.reduce<Record<NarrativeStatus, number>>((counts, row) => {
    counts[row.status] += 1;
    return counts;
  }, { published_v1: 0, pending_review: 0, research_required: 0 });
  const domainCounts = snapshot.technicalDomains.map((domain) => ({ label: domain.name, count: snapshot.organizations.filter((organization) => organization.capabilities.some((capability) => capability.technicalDomains.some((item) => item.id === domain.id))).length }));
  const missionCounts = snapshot.missionAreas.map((mission) => ({ label: mission.name, count: snapshot.organizations.filter((organization) => organization.capabilities.some((capability) => capability.missionMatches.some((match) => match.missionArea.id === mission.id))).length }));
  const demandCounts = snapshot.demandRequirements.map((demand) => ({ label: demand.title, count: demand.matches.length }));
  return (
    <PublicPageShell variant="admin" eyebrow="Editorial operations" title="Coverage and freshness" description="Use explicit thin coverage to select the next high-value research gap." backHref="/admin" backLabel="Atlas operations">
      <AdminNav />
      <PublicCard title="Executive dossier narrative" eyebrow="Live organizations and review queue" className="mb-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <NarrativeCount label="Published v1" count={narrativeCounts.published_v1} tone="success" />
          <NarrativeCount label="Pending review" count={narrativeCounts.pending_review} tone="warning" />
          <NarrativeCount label="Research required" count={narrativeCounts.research_required} tone="neutral" />
        </div>
        <details className="mt-4 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--admin-ink)]">Review organization dispositions</summary>
          <div className="mt-4 divide-y divide-[var(--admin-border-subtle)]">
            {narrativeRows.map(({ organization, status }) => {
              const action = narrativeAction(organization, status);
              return (
              <div key={organization.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div><strong className="text-xs text-[var(--admin-ink)]">{organization.name}</strong><span className="ml-2 text-[10px] uppercase tracking-[0.08em] text-[var(--admin-muted)]">{status.replaceAll("_", " ")}</span></div>
                <Link href={action.href} className="text-xs font-semibold text-[var(--admin-action)]">{action.label}</Link>
              </div>
              );
            })}
          </div>
        </details>
        <p className="mt-3 text-xs leading-5 text-[var(--admin-muted)]">This view is derived from published organizations and candidate changes. It does not create a second enrichment queue.</p>
      </PublicCard>
      <div className="grid gap-5 xl:grid-cols-2">
        <CoveragePanel title="Regional coverage" items={snapshot.regions.map((region) => ({ label: region.name, count: region.organizationCount }))} />
        <CoveragePanel title="Technical domains" items={domainCounts} />
        <CoveragePanel title="Mission areas" items={missionCounts} />
        <CoveragePanel title="Public demand matches" items={demandCounts} />
      </div>
      <PublicCard title="Next-gap rule" eyebrow="Weekly autonomous loop" className="mt-5">
        <p className="text-sm leading-6 text-[#475467]">Select the highest-value gap across region × organization type × capability × demand requirement. Agents may draft candidates and evidence, but failures or weak sources become review notes and no run publishes autonomously.</p>
      </PublicCard>
    </PublicPageShell>
  );
}

function narrativeAction(organization: NarrativeOrganization, status: NarrativeStatus) {
  if (status === "pending_review") return { href: "/admin/review", label: "Open review queue" };
  if (status === "research_required") return { href: `/organizations/${organization.slug}`, label: "Inspect live profile" };
  return { href: `/admin/organizations/${organization.id}/edit`, label: "Open maintenance" };
}

function NarrativeCount({ label, count, tone }: { label: string; count: number; tone: "success" | "warning" | "neutral" }) {
  const toneClass = tone === "success"
    ? "border-[var(--admin-success-border)] bg-[var(--admin-success-soft)] text-[var(--admin-success)]"
    : tone === "warning"
      ? "border-[var(--admin-warning-border)] bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]"
      : "border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-[var(--admin-ink-soft)]";
  return <div className={`rounded-md border p-4 ${toneClass}`}><span className="block text-[10px] font-bold uppercase tracking-[0.08em]">{label}</span><strong className="mt-1 block text-2xl">{count}</strong></div>;
}

function CoveragePanel({ title, items }: { title: string; items: Array<{ label: string; count: number }> }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return <PublicCard title={title} eyebrow="Published record count"><div className="space-y-3">{items.map((item) => <div key={item.label}><div className="flex items-center justify-between gap-3 text-xs"><span className="font-medium text-[#344054]">{item.label}</span><span className={item.count === 0 ? "font-bold text-[#b42318]" : "font-bold text-[#0756d9]"}>{item.count}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#eaecf0]"><div className={item.count === 0 ? "h-full bg-[#fda29b]" : "h-full bg-[#0756d9]"} style={{ width: `${item.count === 0 ? 3 : Math.max(8, (item.count / max) * 100)}%` }} /></div></div>)}</div></PublicCard>;
}
