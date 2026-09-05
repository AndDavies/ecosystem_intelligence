"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { trackBetaEvent } from "@/lib/product-insights/client";
import type { NorthSignalSignupSource } from "@/lib/product-insights/validation";
import { northSignalOffer, type NorthSignalIssueProof } from "@/lib/north-signal/offer";
import { cn } from "@/lib/utils";

export function NorthSignalThisWeekCard({
  proof,
  placement,
  trigger,
  contentType = "north_signal_landing",
  loading = false,
  onPreview,
  className
}: {
  proof: NorthSignalIssueProof | null;
  placement: NorthSignalSignupSource;
  trigger: string;
  contentType?: string;
  loading?: boolean;
  onPreview?: () => void;
  className?: string;
}) {
  const deviceClass = () => window.innerWidth < 640 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop";

  if (loading) {
    return (
      <div
        data-north-signal-proof-loading
        aria-busy="true"
        aria-label="Loading recent published reporting"
        className={cn("min-h-[138px] rounded-[18px] bg-[var(--atlas-blue-soft)] px-4 py-4 text-[var(--atlas-ink)] sm:px-5", className)}
      >
        <span aria-hidden="true" className="mb-3 block h-1 w-10 rounded-full bg-[var(--atlas-signal)]" />
        <span className="block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--atlas-muted)]">RECENT REPORTING</span>
        <span className="mt-3 block text-sm font-semibold text-[var(--atlas-muted)]">Loading the latest published reporting…</span>
      </div>
    );
  }

  if (!proof) {
    return (
      <Link
        href="/signals"
        data-north-signal-proof-fallback
        onClick={() => {
          onPreview?.();
          trackBetaEvent("newsletter_sample_open", {
            placement,
            trigger: trigger.slice(0, 80),
            device_class: deviceClass(),
            content_type: contentType,
            sample_path: "/signals",
            measurement_version: "discovery_v2"
          });
        }}
        className={cn(
          "inline-flex min-h-11 items-center rounded-[18px] bg-[var(--atlas-blue-soft)] px-4 text-sm font-extrabold text-[var(--atlas-primary)] underline decoration-2 underline-offset-4 transition-colors hover:bg-[var(--atlas-blue-soft-hover)]",
          className
        )}
      >
        {northSignalOffer.previewLabel}
      </Link>
    );
  }

  return (
    <Link
      href={proof.href}
      data-north-signal-proof-card
      onClick={() => {
        onPreview?.();
        trackBetaEvent("newsletter_sample_open", {
          placement,
          trigger: trigger.slice(0, 80),
          device_class: deviceClass(),
          content_type: contentType,
          sample_path: proof.href,
          measurement_version: "discovery_v2"
        });
      }}
      className={cn(
        "group block min-h-[138px] rounded-[18px] bg-[var(--atlas-blue-soft)] px-4 py-4 text-[var(--atlas-ink)] no-underline transition-colors hover:bg-[var(--atlas-blue-soft-hover)] hover:no-underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--atlas-signal-soft)] sm:px-5",
        className
      )}
    >
      <span aria-hidden="true" className="mb-3 block h-1 w-10 rounded-full bg-[var(--atlas-signal)]" />
      <span className="block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--atlas-muted)]">RECENT REPORTING</span>
      <strong className="mt-2 block font-[family-name:var(--font-barlow)] text-lg font-extrabold leading-6 tracking-[-0.025em] sm:text-xl sm:leading-7">{proof.headline}</strong>
      <span className="mt-3 block text-xs font-semibold text-[var(--atlas-ink-soft)]">{northSignalOffer.proofMeta}</span>
      <span className="mt-3 block text-xs font-extrabold text-[var(--atlas-primary)] underline decoration-2 underline-offset-4">{northSignalOffer.proofLinkLabel}</span>
    </Link>
  );
}

export function NorthSignalValueLines({ className, limit }: { className?: string; limit?: number }) {
  const lines = typeof limit === "number" ? northSignalOffer.valueLines.slice(0, limit) : northSignalOffer.valueLines;

  return (
    <div data-north-signal-value-lines className={cn("grid gap-1.5 text-sm leading-6 text-[var(--atlas-ink-soft)]", className)}>
      {lines.map((line) => <p key={line}>{line}</p>)}
    </div>
  );
}

export function NorthSignalPageSignupAction() {
  const focusSignup = () => {
    const signup = document.querySelector<HTMLElement>("[data-north-signal-page-signup]");
    const email = signup?.querySelector<HTMLInputElement>("[data-north-signal-email]");
    if (!signup || !email) return;
    signup.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center"
    });
    window.requestAnimationFrame(() => email.focus({ preventScroll: true }));
  };

  return (
    <button type="button" onClick={focusSignup} className="atlas-signal-button min-h-11 gap-2 px-5 text-sm">
      {northSignalOffer.cta}
      <ArrowRight className="size-4" aria-hidden="true" />
    </button>
  );
}
