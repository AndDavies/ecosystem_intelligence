import { PublicAtlasHeader } from "@/components/atlas/public-atlas-header";

export function RouteLoading({
  label,
  layout = "directory"
}: {
  label: string;
  layout?: "atlas" | "directory" | "review";
}) {
  return (
    <main className="atlas-page min-h-screen bg-[var(--atlas-canvas)] text-[var(--atlas-ink)]">
      <PublicAtlasHeader />
      <section className="atlas-frame py-8 sm:py-12" aria-busy="true" aria-live="polite">
        <p className="sr-only">{label}</p>
        <div aria-hidden="true" className="animate-pulse">
          {layout === "atlas" ? <AtlasSkeleton /> : <PageSkeleton review={layout === "review"} />}
        </div>
      </section>
    </main>
  );
}

function AtlasSkeleton() {
  return (
    <>
      <div className="h-4 w-28 rounded bg-[var(--atlas-border)]" />
      <div className="mt-5 h-12 w-full max-w-3xl rounded bg-[var(--atlas-border)] sm:h-16" />
      <div className="mt-4 h-5 w-full max-w-2xl rounded bg-[var(--atlas-surface-muted)]" />
      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <div className="atlas-tonal-surface atlas-tonal-paper h-[430px]" />
        <div className="atlas-tonal-surface atlas-tonal-paper space-y-3 p-4">
          {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-16 rounded-xl bg-[var(--atlas-surface-muted)]" />)}
        </div>
      </div>
    </>
  );
}

function PageSkeleton({ review }: { review: boolean }) {
  return (
    <>
      <div className="h-4 w-36 rounded bg-[var(--atlas-border)]" />
      <div className="mt-7 h-12 w-full max-w-2xl rounded bg-[var(--atlas-border)]" />
      <div className="mt-4 h-5 w-full max-w-3xl rounded bg-[var(--atlas-surface-muted)]" />
      {review ? <div className="mt-8 h-11 w-full rounded-xl bg-[var(--atlas-surface-muted)]" /> : null}
      <div className={`mt-8 grid gap-4 ${review ? "grid-cols-1" : "md:grid-cols-2 xl:grid-cols-3"}`}>
        {Array.from({ length: review ? 3 : 6 }, (_, index) => (
          <div key={index} className={`${review ? "h-52" : "h-64"} atlas-tonal-surface atlas-tonal-paper p-5`}>
            <div className="h-4 w-1/3 rounded bg-[var(--atlas-border)]" />
            <div className="mt-5 h-6 w-2/3 rounded bg-[var(--atlas-surface-muted)]" />
            <div className="mt-4 h-4 w-full rounded bg-[var(--atlas-surface-muted)]" />
            <div className="mt-2 h-4 w-4/5 rounded bg-[var(--atlas-surface-muted)]" />
          </div>
        ))}
      </div>
    </>
  );
}
