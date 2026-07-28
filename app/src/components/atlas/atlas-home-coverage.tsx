import { getAtlasCoverageSummary } from "@/lib/atlas/repository";

export async function AtlasHomeCoverage() {
  const summary = await getAtlasCoverageSummary();

  return (
    <span className="flex items-center gap-4 border-l-4 border-[var(--atlas-signal)] pl-4 text-[var(--atlas-ink)]">
      <strong className="text-[30px] font-extrabold leading-none tracking-[-0.04em]">
        {summary.organizations.toLocaleString("en-CA")}
      </strong>
      <span className="text-xs font-medium leading-4 text-[var(--atlas-muted)]">
        published organizations<br />across Canada
      </span>
    </span>
  );
}
