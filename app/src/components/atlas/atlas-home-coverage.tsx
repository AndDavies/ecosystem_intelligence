import { getAtlasCoverageSummary } from "@/lib/atlas/repository";

export async function AtlasHomeCoverage() {
  const summary = await getAtlasCoverageSummary();

  return (
    <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">
      <span className="size-1.5 rounded-full bg-[var(--atlas-evidence)]" aria-hidden="true" />
      {summary.organizations.toLocaleString("en-CA")} published organizations across Canada
    </span>
  );
}
