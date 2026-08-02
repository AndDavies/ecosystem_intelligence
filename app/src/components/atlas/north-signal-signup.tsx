"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, LoaderCircle, Mail } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { TurnstileField } from "@/components/security/turnstile-field";
import {
  currentPilotCohort,
  currentPilotSearchId,
  currentPilotSessionId,
  trackBetaEvent
} from "@/lib/product-insights/client";
import {
  northSignalConsentText,
  northSignalConsentVersion,
  type NorthSignalSignupSource
} from "@/lib/product-insights/validation";
import { cn } from "@/lib/utils";

export const northSignalSubscribedKey = "ecosystem-intelligence-updates-subscribed";

type NorthSignalVariant = "inline" | "dialog" | "sheet";

export function NorthSignalIssuePreview({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex h-full min-h-[410px] flex-col overflow-hidden bg-[var(--atlas-ink)] p-5 text-white", className)} aria-hidden="true">
      <div className="absolute inset-x-0 top-0 h-1 bg-[var(--atlas-signal)]" />
      <div className="flex items-center justify-between border-b border-white/20 pb-4">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.16em]">North Signal</span>
        <span className="border border-white/30 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em]">Weekly field note</span>
      </div>
      <div className="mt-7">
        <span className="inline bg-[var(--atlas-signal)] px-1.5 py-0.5 text-xl font-extrabold leading-tight tracking-[-0.035em] text-[var(--atlas-ink)]">See what changed.</span>
        <p className="mt-3 text-sm font-semibold leading-5 text-white">Understand why it matters. Follow the record into the map.</p>
      </div>
      <div className="mt-7 grid gap-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/80">
        <div className="border-l-2 border-[var(--atlas-signal)] bg-white/5 px-3 py-2.5">01 · The signal</div>
        <div className="border-l-2 border-white/35 bg-white/5 px-3 py-2.5">02 · New on the map</div>
        <div className="border-l-2 border-white/35 bg-white/5 px-3 py-2.5">03 · Public needs</div>
        <div className="border-l-2 border-white/35 bg-white/5 px-3 py-2.5">04 · Across the ecosystem</div>
      </div>
      <p className="mt-auto border-t border-white/20 pt-4 text-[10px] font-semibold leading-4 text-white/75">Reviewed sources. Clear Canadian relevance. One useful path back into the product.</p>
    </div>
  );
}

function deviceClass() {
  if (typeof window === "undefined") return "unknown";
  if (window.innerWidth < 640) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
}

function contentType(pathname: string) {
  if (pathname === "/") return "landing";
  if (pathname === "/map") return "atlas";
  if (pathname.startsWith("/briefs/")) return "defence_brief";
  if (pathname.startsWith("/organizations/")) return "organization_profile";
  return "public_page";
}

function eventMetadata({
  placement,
  trigger,
  variant,
  pathname
}: {
  placement: NorthSignalSignupSource;
  trigger: string;
  variant: NorthSignalVariant;
  pathname: string;
}) {
  return {
    placement,
    trigger: trigger.slice(0, 80),
    variant,
    device_class: deviceClass(),
    content_type: contentType(pathname),
    landing_path: pathname.slice(0, 255)
  };
}

export function NorthSignalSignupForm({
  placement,
  trigger,
  variant,
  tone = "light",
  onSuccess
}: {
  placement: NorthSignalSignupSource;
  trigger: string;
  variant: NorthSignalVariant;
  tone?: "light" | "dark";
  onSuccess?: () => void;
}) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaAttempt, setCaptchaAttempt] = useState(0);
  const started = useRef(false);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    trackBetaEvent("newsletter_form_start", eventMetadata({
      placement,
      trigger,
      variant,
      pathname: window.location.pathname
    }));
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const pathname = window.location.pathname;
    const metadata = eventMetadata({ placement, trigger, variant, pathname });
    setState("loading");
    setError("");
    trackBetaEvent("newsletter_submit", metadata);

    try {
      const response = await fetch("/api/beta-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") ?? ""),
          consent: true,
          consentText: northSignalConsentText,
          consentVersion: northSignalConsentVersion,
          source: placement,
          cohort: currentPilotCohort(),
          sessionId: currentPilotSessionId(),
          searchId: currentPilotSearchId(),
          landingPath: pathname,
          captchaToken,
          website: String(form.get("website") ?? "")
        })
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setCaptchaToken("");
        setCaptchaAttempt((attempt) => attempt + 1);
        setError(body?.error ?? "Your subscription could not be saved.");
        setState("error");
        trackBetaEvent("newsletter_error", { ...metadata, error_class: response.status >= 500 ? "service_error" : "validation_error" });
        return;
      }

      try {
        window.localStorage.setItem(northSignalSubscribedKey, "true");
      } catch {
        // The server-side consent record remains authoritative.
      }
      setState("success");
      formElement.reset();
      onSuccess?.();
    } catch {
      setCaptchaToken("");
      setCaptchaAttempt((attempt) => attempt + 1);
      setError("Your subscription could not be saved. Check your connection and try again.");
      setState("error");
      trackBetaEvent("newsletter_error", { ...metadata, error_class: "network_error" });
    }
  }

  if (state === "success") {
    return (
      <div className="flex items-start gap-3 border-l-4 border-[var(--atlas-evidence)] bg-[var(--atlas-evidence-soft)] p-4 text-sm leading-6 text-[var(--atlas-evidence)]" role="status">
        <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p><strong className="block text-[var(--atlas-ink)]">You are subscribed to North Signal.</strong>Your first weekly briefing will arrive by email.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} data-clarity-mask="true" className="space-y-3">
      {error ? <div role="alert" className="border border-[var(--atlas-danger)] bg-[var(--atlas-danger-soft)] px-3 py-2 text-xs text-[var(--atlas-danger)]">{error}</div> : null}
      <div className={cn("grid gap-2", variant === "inline" && "sm:grid-cols-[minmax(0,1fr)_auto]") }>
        <label className="sr-only" htmlFor={`north-signal-email-${placement}-${variant}`}>Email address</label>
        <input
          id={`north-signal-email-${placement}-${variant}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@organization.ca"
          onFocus={markStarted}
          onChange={markStarted}
          className="h-11 min-w-0 rounded-[8px] border border-[var(--atlas-border-strong)] bg-white px-3 text-sm text-[var(--atlas-ink)] outline-none focus:border-[var(--atlas-ink)] focus:ring-4 focus:ring-[var(--atlas-signal-soft)]"
        />
        <button
          type="submit"
          disabled={state === "loading" || Boolean(turnstileSiteKey && !captchaToken)}
          aria-busy={state === "loading" || undefined}
          className="atlas-signal-button h-11 gap-2 px-4 text-sm disabled:opacity-60"
        >
          {state === "loading" ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Mail aria-hidden="true" className="size-4" />}
          Get North Signal
        </button>
      </div>
      <label className="absolute left-[-9999px]" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      {turnstileSiteKey ? <TurnstileField key={captchaAttempt} siteKey={turnstileSiteKey} onTokenChange={setCaptchaToken} purpose="subscription" /> : null}
      <p className={cn("text-[11px] leading-5", tone === "dark" ? "text-white/65" : "text-[var(--atlas-muted)]")}>
        {northSignalConsentText} <Link href="/privacy" className={cn("font-semibold underline", tone === "dark" ? "text-white" : "text-[var(--atlas-primary)]")}>Privacy details.</Link>
      </p>
    </form>
  );
}

export function NorthSignalInline({
  placement,
  trigger = "contextual_inline",
  revealOnEngagement = false,
  tone = "light",
  className
}: {
  placement: Extract<NorthSignalSignupSource, "newsletter_inline_home" | "newsletter_inline_map" | "newsletter_inline_brief" | "newsletter_inline_profile">;
  trigger?: string;
  revealOnEngagement?: boolean;
  tone?: "light" | "dark";
  className?: string;
}) {
  const [revealed, setRevealed] = useState(!revealOnEngagement);
  const containerRef = useRef<HTMLElement | null>(null);
  const impressionTracked = useRef(false);
  const metadata = useMemo(() => ({ placement, trigger, variant: "inline" as const }), [placement, trigger]);

  useEffect(() => {
    if (!revealOnEngagement) return;
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<{ eventName?: string }>).detail;
      if (["atlas_search", "filter_apply", "marker_select", "result_select"].includes(detail?.eventName ?? "")) setRevealed(true);
    };
    window.addEventListener("tnm:meaningful-event", listener);
    return () => window.removeEventListener("tnm:meaningful-event", listener);
  }, [revealOnEngagement]);

  useEffect(() => {
    if (!revealed || !containerRef.current || impressionTracked.current) return;
    const node = containerRef.current;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting) || impressionTracked.current) return;
      impressionTracked.current = true;
      trackBetaEvent("newsletter_impression", eventMetadata({ ...metadata, pathname: window.location.pathname }));
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [metadata, revealed]);

  if (!revealed) return null;

  return (
    <section ref={containerRef} aria-labelledby={`north-signal-title-${placement}`} className={cn("px-5 py-6 sm:px-7", tone === "light" && "border-y border-[var(--atlas-border)] bg-[var(--atlas-signal-soft)]", tone === "dark" && "text-white", className)}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] lg:items-center">
        <div>
          <p className={cn("atlas-eyebrow", tone === "dark" && "!text-[var(--atlas-signal)]")}>North Signal · Weekly briefing</p>
          <h2 id={`north-signal-title-${placement}`} className={cn("mt-2 text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl", tone === "dark" ? "text-white" : "text-[var(--atlas-ink)]")}>See what Canada is building next.</h2>
          <p className={cn("mt-3 max-w-xl text-base leading-7", tone === "dark" ? "text-white/80" : "text-[var(--atlas-ink-soft)]")}>One concise weekly briefing on newly mapped Canadian capabilities, released public needs and the connections worth watching.</p>
          <p className={cn("mt-3 text-xs font-semibold", tone === "dark" ? "text-white/65" : "text-[var(--atlas-muted)]")}>Weekly. Evidence-led. Unsubscribe anytime.</p>
        </div>
        <NorthSignalSignupForm placement={placement} trigger={trigger} variant="inline" tone={tone} />
      </div>
    </section>
  );
}

export function NorthSignalSampleLink({ className }: { className?: string }) {
  return <Link href="/briefs" className={cn("inline-flex items-center gap-1.5 text-xs font-bold text-[var(--atlas-primary)] underline", className)}>Read a sample <ArrowRight className="size-3.5" /></Link>;
}
