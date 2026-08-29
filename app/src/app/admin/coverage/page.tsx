import Link from "next/link";
import { AdminNav } from "@/components/atlas/admin-nav";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PaginationNav } from "@/components/ui/pagination-nav";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { deriveNarrativeStatus, narrativeStatusOrder, type NarrativeStatus } from "@/lib/atlas/narrative-coverage";
import { createClient } from "@/lib/supabase/server";

type NarrativeOrganization = {
  id: string;
  name: string;
  slug: string;
  editorial_profile_version: string | null;
};

type CoverageItem = { label: string; count: number };
type CoverageBreakdown = {
  regions: CoverageItem[];
  technicalDomains: CoverageItem[];
  missionAreas: CoverageItem[];
  publicNeeds: CoverageItem[];
};

export default async function AdminCoveragePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAtlasStaff("editor");
  const params = await searchParams;
  const supabase = await createClient();
  const [coverageResult, narrativeResult, pendingCandidateResult] = await Promise.all([
    supabase.rpc("get_admin_coverage_breakdown"),
    supabase
      .from("organizations")
      .select("id, name, slug, editorial_profile_version")
      .eq("publication_status", "published"),
    supabase
      .from("candidate_changes")
      .select("target_entity_id, candidate_kind, status")
      .in("candidate_kind", ["organization_bundle", "organization_refresh_bundle"])
      .in("status", ["pending", "approved"])
  ]);
  if (coverageResult.error) throw new Error("Unable to load the bounded coverage summary.");
  const coverage = parseCoverageBreakdown(coverageResult.data);
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
  const narrativePageSize = 50;
  const narrativeTotalPages = Math.max(1, Math.ceil(narrativeRows.length / narrativePageSize));
  const requestedNarrativePage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const narrativePage = Math.min(requestedNarrativePage, narrativeTotalPages);
  const narrativeStart = (narrativePage - 1) * narrativePageSize;
  const visibleNarrativeRows = narrativeRows.slice(narrativeStart, narrativeStart + narrativePageSize);
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
            {visibleNarrativeRows.map(({ organization, status }) => {
              const action = narrativeAction(organization, status);
              return (
              <div key={organization.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div><strong className="text-xs text-[var(--admin-ink)]">{organization.name}</strong><span className="ml-2 text-[10px] uppercase tracking-[0.08em] text-[var(--admin-muted)]">{status.replaceAll("_", " ")}</span></div>
                <Link href={action.href} className="text-xs font-semibold text-[var(--admin-action)]">{action.label}</Link>
              </div>
              );
            })}
          </div>
          <PaginationNav path="/admin/coverage" page={narrativePage} totalPages={narrativeTotalPages} start={narrativeStart + 1} end={Math.min(narrativeStart + visibleNarrativeRows.length, narrativeRows.length)} total={narrativeRows.length} itemLabel="organization dispositions" />
        </details>
        <p className="mt-3 text-xs leading-5 text-[var(--admin-muted)]">This view is derived from published organizations and candidate changes. It does not create a second enrichment queue.</p>
      </PublicCard>
      <div className="grid gap-5 xl:grid-cols-2">
        <CoveragePanel title="Regional coverage" items={coverage.regions} />
        <CoveragePanel title="Technical domains" items={coverage.technicalDomains} />
        <CoveragePanel title="Mission areas" items={coverage.missionAreas} />
        <CoveragePanel title="Public demand matches" items={coverage.publicNeeds} />
      </div>
      <PublicCard title="Next-gap rule" eyebrow="Weekly autonomous loop" className="mt-5">
        <p className="text-sm leading-6 text-[#475467]">Select the highest-value gap across region × organization type × capability × demand requirement. Agents may draft candidates and evidence, but failures or weak sources become review notes and no run publishes autonomously.</p>
      </PublicCard>
    </PublicPageShell>
  );
}

function parseCoverageBreakdown(value: unknown): CoverageBreakdown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("The bounded coverage summary returned an invalid payload.");
  }
  const record = value as Record<string, unknown>;
  const items = (key: keyof CoverageBreakdown) => {
    if (!Array.isArray(record[key])) throw new Error(`The bounded coverage summary is missing ${key}.`);
    return record[key].map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error(`The bounded coverage summary contains an invalid ${key} row.`);
      const row = item as Record<string, unknown>;
      if (typeof row.label !== "string" || typeof row.count !== "number" || !Number.isInteger(row.count) || row.count < 0) {
        throw new Error(`The bounded coverage summary contains an invalid ${key} count.`);
      }
      return { label: row.label, count: row.count };
    });
  };
  return {
    regions: items("regions"),
    technicalDomains: items("technicalDomains"),
    missionAreas: items("missionAreas"),
    publicNeeds: items("publicNeeds")
  };
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
