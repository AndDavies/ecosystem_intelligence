import Link from "next/link";
import { SearchX } from "lucide-react";
import { PublicAtlasHeader } from "@/components/atlas/public-atlas-header";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: false }
};

export default function NotFound() {
  return (
    <main className="atlas-page min-h-screen bg-[var(--atlas-canvas)] text-[var(--atlas-ink)]">
      <PublicAtlasHeader />
      <div className="atlas-frame flex min-h-[62vh] items-center justify-center py-12">
        <section className="w-full max-w-xl rounded-[18px] bg-white p-8 text-center shadow-[var(--atlas-shadow-soft)]">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]"><SearchX className="size-6" /></span>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--atlas-primary)]">Page not found</p>
          <h1 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[var(--atlas-ink)]">We could not find that page.</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--atlas-muted)]">Explore the map or search the published organizations.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/map" className="atlas-signal-button h-11 px-5 text-sm">Explore the map</Link>
            <Link href="/" className="atlas-secondary-button h-11 px-5 text-sm">Go to homepage</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
