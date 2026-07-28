import { getAtlasCoverageSummary } from "@/lib/atlas/repository";

export async function AtlasHomeCoverage({ inverted = false }: { inverted?: boolean }) {
  const summary = await getAtlasCoverageSummary();

  if (inverted) {
    return (
      <span className="flex items-center gap-4 text-white">
        <strong className="text-[30px] font-extrabold leading-none tracking-[-0.04em]">
          {summary.organizations.toLocaleString("en-CA")}
        </strong>
        <span className="text-xs font-medium leading-4 text-white/75">
          published organizations<br />across Canada
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">
      <span className="size-1.5 rounded-full bg-[var(--atlas-evidence)]" aria-hidden="true" />
      {summary.organizations.toLocaleString("en-CA")} published organizations across Canada
    </span>
  );
}
