export function OrganizationDirectoryLoading() {
  return (
    <div className="mt-5" aria-live="polite" aria-busy="true">
      <p className="text-xs font-semibold text-[var(--atlas-muted)]">Loading published organizations…</p>
      <div aria-hidden="true" className="mt-3 animate-pulse">
        <div className="grid h-16 grid-cols-3 overflow-hidden rounded-[18px] bg-white">
          <div className="bg-[var(--atlas-blue-soft)]" />
          <div className="bg-[var(--atlas-evidence-soft)]" />
          <div className="bg-[var(--atlas-signal-soft)]" />
        </div>
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="h-7 w-48 rounded bg-[var(--atlas-border)]" />
          <div className="h-10 w-36 rounded-[12px] bg-[var(--atlas-primary-soft)]" />
        </div>
        <div className="mt-4 h-10 rounded-[14px] bg-white" />
        <div className="mt-3 h-10 rounded-[14px] bg-white" />
      </div>
    </div>
  );
}
