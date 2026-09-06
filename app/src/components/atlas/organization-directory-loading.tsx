export function OrganizationDirectoryLoading() {
  return <div className="mt-6" aria-live="polite" aria-busy="true">
    <p className="text-sm font-semibold text-[var(--atlas-muted)]">Loading published organizations…</p>
    <div aria-hidden="true" className="mt-4 animate-pulse">
      <div className="h-14 max-w-3xl rounded-[4px] bg-white" />
      <div className="my-5 h-8 max-w-xl bg-[var(--atlas-surface-muted)]" />
      <div className="atlas-directory-grid"><div className="h-80 border-t border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)]" /><div className="grid gap-6 sm:grid-cols-2">{[0, 1].map((key) => <div key={key} className="h-64 border-t border-[var(--atlas-border)] bg-white" />)}</div></div>
    </div>
  </div>;
}
