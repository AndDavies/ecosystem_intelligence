"use client";

import Link from "next/link";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { TurnstileField } from "@/components/security/turnstile-field";
import {
  currentReleaseAttribution,
  currentPilotCohort,
  currentPilotSearchId,
  currentPilotSessionId,
  trackBetaEvent,
  trackNorthSignalCtaClick
} from "@/lib/product-insights/client";
import {
  defenceSignalAlertsConsentText,
  defenceSignalAlertsConsentVersion,
  northSignalConsentText,
  northSignalConsentVersion,
  type NorthSignalSignupSource
} from "@/lib/product-insights/validation";
import { northSignalOffer } from "@/lib/north-signal/offer";
import { brandCopy } from "@/lib/brand-copy";
import { cn } from "@/lib/utils";

export const northSignalSubscribedKey = "ecosystem-intelligence-updates-subscribed";
const signalAlertsClientCandidate = process.env.NEXT_PUBLIC_DEFENCE_SIGNAL_ALERTS_ENABLED === "true";

type NorthSignalVariant = "inline" | "dialog" | "sheet";

function deviceClass() {
  if (typeof window === "undefined") return "unknown";
  if (window.innerWidth < 640) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
}

function contentType(pathname: string) {
  if (pathname === "/") return "landing";
  if (pathname === "/map") return "atlas";
  if (pathname === "/north-signal") return "north_signal_landing";
  if (pathname === "/signals") return "signals_archive";
  if (pathname.startsWith("/signals/")) return "signals_edition";
  if (pathname.startsWith("/briefs/")) return "defence_brief";
  if (pathname.startsWith("/organizations/")) return "organization_profile";
  if (pathname.startsWith("/missions/")) return "mission_area";
  if (pathname.startsWith("/demand/")) return "public_need";
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
  previewHref,
  showPreviewLink = true,
  onPreview,
  onSuccess
}: {
  placement: NorthSignalSignupSource;
  trigger: string;
  variant: NorthSignalVariant;
  tone?: "light" | "dark";
  previewHref?: string;
  showPreviewLink?: boolean;
  onPreview?: () => void;
  onSuccess?: () => void;
}) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaAttempt, setCaptchaAttempt] = useState(0);
  const [savedSignalAlerts, setSavedSignalAlerts] = useState(false);
  const [signalAlertsAvailable, setSignalAlertsAvailable] = useState(false);
  const started = useRef(false);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const emailId = useId();

  useEffect(() => {
    if (!signalAlertsClientCandidate) return;
    const controller = new AbortController();
    void fetch("/api/beta-signup", {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal
    })
      .then(async (response) => response.ok ? response.json() as Promise<{ signalAlerts?: boolean }> : null)
      .then((capabilities) => setSignalAlertsAvailable(capabilities?.signalAlerts === true))
      .catch(() => setSignalAlertsAvailable(false));
    return () => controller.abort();
  }, []);

  const trackPreview = () => {
    if (!previewHref) return;
    const pathname = window.location.pathname;
    trackBetaEvent("newsletter_sample_open", {
      sample_path: previewHref,
      ...eventMetadata({ placement, trigger, variant, pathname }),
    });
    onPreview?.();
  };

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
    const releaseAttribution = currentReleaseAttribution();
    const signalAlerts = signalAlertsAvailable && form.get("signalAlerts") === "on";
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
          signalAlerts,
          alertsConsentText: signalAlerts ? defenceSignalAlertsConsentText : undefined,
          alertsConsentVersion: signalAlerts ? defenceSignalAlertsConsentVersion : undefined,
          source: placement,
          cohort: currentPilotCohort(),
          deviceClass: metadata.device_class,
          contentType: metadata.content_type,
          utmSource: releaseAttribution?.source,
          utmMedium: releaseAttribution?.medium,
          utmCampaign: releaseAttribution?.campaign,
          utmContent: releaseAttribution?.content,
          sessionId: currentPilotSessionId(),
          searchId: currentPilotSearchId(),
          successEventId: window.crypto.randomUUID(),
          occurredAt: new Date().toISOString(),
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
      setSavedSignalAlerts(signalAlerts);
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
      <div className="border-l-4 border-[var(--atlas-evidence)] bg-[var(--atlas-evidence-soft)] p-4 text-sm leading-6 text-[var(--atlas-evidence)]" role="status">
        <div className="flex items-start gap-3">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p><strong className="block text-[var(--atlas-ink)]">You are subscribed to North Signal.</strong>Your weekly briefing will arrive by email.{savedSignalAlerts ? " New Defence Signal alerts are also enabled." : ""}</p>
        </div>
        {previewHref ? <Link href={previewHref} onClick={trackPreview} className="mt-3 inline-flex min-h-11 items-center text-xs font-extrabold text-[var(--atlas-primary)] underline decoration-2 underline-offset-4">{northSignalOffer.previewLabel}</Link> : null}
      </div>
    );
  }

  return (
    <form onSubmit={submit} data-clarity-mask="true" className="space-y-3">
      {error ? <div role="alert" className="border border-[var(--atlas-danger)] bg-[var(--atlas-danger-soft)] px-3 py-2 text-xs text-[var(--atlas-danger)]">{error}</div> : null}
      <label className={cn("block text-xs font-bold", tone === "dark" ? "text-white" : "text-[var(--atlas-ink)]")} htmlFor={emailId}>Email address</label>
      <div className={cn("grid gap-2", variant === "inline" && "atlas-newsletter-form-fields") }>
        <input
          id={emailId}
          name="email"
          data-north-signal-email
          type="email"
          required
          autoComplete="email"
          placeholder="you@organization.ca"
          onFocus={markStarted}
          onChange={markStarted}
          className="h-11 min-w-0 rounded-[12px] border border-[var(--atlas-border-strong)] bg-white px-3 text-sm text-[var(--atlas-ink)] outline-none focus:border-[var(--atlas-ink)] focus:ring-4 focus:ring-[var(--atlas-signal-soft)]"
        />
        <button
          type="submit"
          disabled={state === "loading" || Boolean(turnstileSiteKey && !captchaToken)}
          aria-busy={state === "loading" || undefined}
          className="atlas-signal-button h-11 gap-2 px-4 text-sm disabled:opacity-60"
        >
          {state === "loading" ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
          {northSignalOffer.cta}
        </button>
      </div>
      {signalAlertsAvailable ? <label className={cn("flex min-h-11 items-start gap-3 py-2.5 text-sm leading-6", tone === "dark" && "text-white")}>
        <input name="signalAlerts" type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[var(--atlas-ink)]" />
        <span><strong className="block">Also email me when a new Defence Signal is published.</strong><span className={cn("block", tone === "dark" ? "text-white/65" : "text-[var(--atlas-muted)]")}>Optional. Alerts send only when a validated edition is published.</span></span>
      </label> : null}
      <label className="absolute left-[-9999px]" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      {turnstileSiteKey ? <TurnstileField key={captchaAttempt} siteKey={turnstileSiteKey} onTokenChange={setCaptchaToken} purpose="subscription" /> : null}
      {previewHref ? <>
        <p className={cn("text-xs font-semibold", tone === "dark" ? "text-white/70" : "text-[var(--atlas-muted)]")}>{northSignalOffer.riskReversal}</p>
        {showPreviewLink ? <Link href={previewHref} onClick={trackPreview} className={cn("inline-flex min-h-11 items-center text-xs font-extrabold underline decoration-2 underline-offset-4", tone === "dark" ? "text-[var(--atlas-signal)]" : "text-[var(--atlas-primary)]")}>{northSignalOffer.previewLabel}</Link> : null}
      </> : null}
      <p className={cn("text-xs leading-5", tone === "dark" ? "text-white/65" : "text-[var(--atlas-muted)]")}>
        {northSignalConsentText} <Link href="/privacy" className={cn("font-semibold underline", tone === "dark" ? "text-white" : "text-[var(--atlas-primary)]")}>Privacy details.</Link>
      </p>
    </form>
  );
}

export function NorthSignalInline({
  placement,
  trigger = "contextual_inline",
  revealOnEngagement = false,
  tone = "dark",
  className
}: {
  placement: Extract<NorthSignalSignupSource, "newsletter_inline_home" | "newsletter_inline_map" | "newsletter_inline_brief" | "newsletter_inline_profile" | "newsletter_page" | "newsletter_inline_signals" | "newsletter_inline_mission" | "newsletter_inline_demand">;
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
    const impressionKey = `tnm:newsletter-impression:${placement}:${window.location.pathname}`;
    try {
      if (window.sessionStorage.getItem(impressionKey)) {
        impressionTracked.current = true;
        return;
      }
    } catch {
      // Session-level de-duplication is best effort when storage is unavailable.
    }
    let visibleTimer: number | null = null;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5);
      if (!visible) {
        if (visibleTimer !== null) window.clearTimeout(visibleTimer);
        visibleTimer = null;
        return;
      }
      if (visibleTimer !== null || impressionTracked.current) return;
      visibleTimer = window.setTimeout(() => {
        if (impressionTracked.current) return;
        impressionTracked.current = true;
        try { window.sessionStorage.setItem(impressionKey, "1"); } catch { /* optional storage */ }
        trackBetaEvent("newsletter_impression", eventMetadata({ ...metadata, pathname: window.location.pathname }));
        observer.disconnect();
      }, 1000);
    }, { threshold: [0, 0.5, 1] });
    observer.observe(node);
    return () => {
      if (visibleTimer !== null) window.clearTimeout(visibleTimer);
      observer.disconnect();
    };
  }, [metadata, placement, revealed]);

  if (!revealed) return null;

  return (
    <section ref={containerRef} data-tone={tone} aria-labelledby={`north-signal-title-${placement}`} className={cn("atlas-newsletter-section px-5 py-8 sm:px-8", tone === "light" && "border-y border-[var(--atlas-border)] bg-white", tone === "dark" && "bg-[var(--atlas-ink)] text-white", className)}>
      <div className="atlas-newsletter-composition grid gap-6 lg:items-center">
        <div>
          <p className={cn("atlas-eyebrow", tone === "dark" && "!text-[var(--atlas-signal)]")}>North Signal</p>
          <h2 id={`north-signal-title-${placement}`} className={cn("mt-2 font-extrabold tracking-[-0.035em]", placement === "newsletter_inline_profile" ? "text-2xl" : "text-3xl sm:text-4xl", tone === "dark" ? "text-white" : "text-[var(--atlas-ink)]")}>{brandCopy.northSignal}</h2>
          <p className={cn("mt-3 max-w-xl text-base leading-7", tone === "dark" ? "text-white/80" : "text-[var(--atlas-ink-soft)]")}>{brandCopy.northSignalSupport}</p>
          <p className={cn("mt-3 text-xs font-semibold", tone === "dark" ? "text-white/65" : "text-[var(--atlas-muted)]")}>{brandCopy.northSignalReassurance}</p>
          <Link
            href="/north-signal"
            onClick={() => trackNorthSignalCtaClick(placement, "/north-signal")}
            className={cn("mt-3 inline-flex min-h-11 items-center text-xs font-extrabold underline decoration-2 underline-offset-4", tone === "dark" ? "text-[var(--atlas-signal)]" : "text-[var(--atlas-primary)]")}
          >
            See what North Signal includes →
          </Link>
        </div>
        <NorthSignalSignupForm placement={placement} trigger={trigger} variant="inline" tone={tone} />
      </div>
    </section>
  );
}
