"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="atlas-page flex min-h-screen items-center bg-[var(--atlas-canvas)] px-5 py-16 text-[var(--atlas-ink)]">
      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-[var(--atlas-border)] bg-white p-7 shadow-[var(--atlas-shadow-soft)] sm:p-10">
        <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--atlas-danger-soft)] text-[var(--atlas-danger)]">
          <AlertTriangle aria-hidden="true" className="size-5" />
        </span>
        <p className="atlas-eyebrow mt-6">Something interrupted this page</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em]">The page could not finish loading.</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--atlas-muted)]">
          Your published data has not been changed. Try the page again, or return to the ecosystem map.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="atlas-primary-button h-11 gap-2 px-4 text-sm">
            <RotateCcw aria-hidden="true" className="size-4" />
            Try again
          </button>
          <Link href="/" className="atlas-secondary-button h-11 px-4 text-sm no-underline hover:no-underline">
            Return to the ecosystem map
          </Link>
        </div>
      </section>
    </main>
  );
}
