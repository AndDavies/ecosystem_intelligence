import { PublicPageShell } from "@/components/atlas/public-page-shell";

export default function MissionsLoading() {
  return (
    <PublicPageShell eyebrow="Mission Areas and Use Cases" title="Start with the mission." description="Loading reviewed Canadian mission and use-case connections…">
      <div aria-live="polite" aria-busy="true" className="animate-pulse">
        <p className="sr-only">Loading Mission Areas and reviewed technology</p>
        <div className="h-24 border-y border-[var(--atlas-border)] bg-white" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-28 rounded-2xl border border-[var(--atlas-border)] bg-white" />)}</div>
        <div className="mt-12 grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-64 rounded-2xl border border-[var(--atlas-border)] bg-white" />)}</div>
      </div>
    </PublicPageShell>
  );
}
