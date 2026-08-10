"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { usePathname } from "next/navigation";
import { Bell, CheckCircle2, LoaderCircle, MessageSquareText, Send, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/atlas/brand-logo";
import {
  NorthSignalSampleLink,
  NorthSignalArtwork,
  NorthSignalSignupForm,
  northSignalSubscribedKey
} from "@/components/atlas/north-signal-signup";
import { TurnstileField } from "@/components/security/turnstile-field";
import {
  currentPilotCohort,
  currentPilotSearchId,
  currentPilotSessionId,
  trackBetaEvent
} from "@/lib/product-insights/client";
import type { NorthSignalSignupSource } from "@/lib/product-insights/validation";

const dismissedKey = "ecosystem-intelligence-updates-dismissed-at";
const dismissForMs = 30 * 24 * 60 * 60 * 1000;

function pathIsPublicBeta(pathname: string) {
  return pathname === "/" || ["/regions", "/organizations", "/missions", "/capabilities", "/demand", "/signals", "/north-signal", "/briefs", "/about", "/how-it-works", "/methodology", "/privacy", "/terms", "/contact"].some((prefix) => pathname.startsWith(prefix));
}

function newsletterContentType(pathname: string) {
  if (pathname === "/") return "landing";
  if (pathname === "/north-signal") return "north_signal_landing";
  if (pathname === "/signals") return "signals_archive";
  if (pathname.startsWith("/signals/")) return "signals_edition";
  if (pathname.startsWith("/briefs/")) return "defence_brief";
  if (pathname.startsWith("/organizations/")) return "organization_profile";
  if (pathname.startsWith("/missions/")) return "mission_area";
  if (pathname.startsWith("/demand/")) return "public_need";
  return "public_page";
}

function newsletterEventMetadata(placement: NorthSignalSignupSource, trigger: string, variant: "banner" | "dialog", pathname: string) {
  return {
    placement,
    trigger: trigger.slice(0, 80),
    variant,
    device_class: typeof window === "undefined" ? "unknown" : window.innerWidth < 640 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
    content_type: newsletterContentType(pathname),
    landing_path: pathname.slice(0, 255)
  };
}

export function PublicBetaExperience() {
  const pathname = usePathname();
  const [updatesOpen, setUpdatesOpen] = useState(false);
  const [mobileBannerOpen, setMobileBannerOpen] = useState(false);
  const [updatesContext, setUpdatesContext] = useState<{ placement: NorthSignalSignupSource; trigger: string }>({ placement: "newsletter_modal_desktop", trigger: "explicit" });
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackState, setFeedbackState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackCaptchaToken, setFeedbackCaptchaToken] = useState("");
  const [feedbackCaptchaAttempt, setFeedbackCaptchaAttempt] = useState(0);
  const [landingFeedbackVisible, setLandingFeedbackVisible] = useState(pathname !== "/");
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const automaticPromptSuppressed = useRef(false);
  const automaticPromptShown = useRef(false);
  const updatesOpenedExplicitly = useRef(false);
  const updatesOpenerRef = useRef<HTMLElement | null>(null);
  const updatesOpenRef = useRef(false);
  const feedbackOpenRef = useRef(false);
  const feedbackGoalRef = useRef<HTMLTextAreaElement | null>(null);
  const updatesDialogRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!pathIsPublicBeta(pathname)) return;
    currentPilotCohort();

    const openUpdates = (event: Event) => {
      const detail = (event as CustomEvent<{ placement?: NorthSignalSignupSource; trigger?: string }>).detail;
      const placement = detail?.placement ?? "newsletter_header";
      const trigger = detail?.trigger ?? "explicit";
      updatesOpenedExplicitly.current = true;
      updatesOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setUpdatesContext({ placement, trigger });
      setFeedbackOpen(false);
      setMobileBannerOpen(false);
      setUpdatesOpen(true);
      trackBetaEvent("newsletter_impression", newsletterEventMetadata(placement, trigger, "dialog", pathname));
      trackBetaEvent("newsletter_open", newsletterEventMetadata(placement, trigger, "dialog", pathname));
    };
    const openFeedback = () => {
      setUpdatesOpen(false);
      setFeedbackOpen(true);
    };
    window.addEventListener("pilot:open-updates", openUpdates);
    window.addEventListener("pilot:open-feedback", openFeedback);

    let alreadySubscribed = false;
    let recentlyDismissed = false;
    try {
      alreadySubscribed = window.localStorage.getItem(northSignalSubscribedKey) === "true";
      const dismissedAt = Number(window.localStorage.getItem(dismissedKey) ?? 0);
      recentlyDismissed = dismissedAt > 0 && Date.now() - dismissedAt < dismissForMs;
    } catch {
      // Storage is optional; the prompt remains dismissible for the session.
    }
    automaticPromptSuppressed.current = alreadySubscribed || recentlyDismissed;

    const qualifyAutomaticPrompt = (trigger: string) => {
      if (automaticPromptSuppressed.current || automaticPromptShown.current || updatesOpenRef.current || feedbackOpenRef.current) return;
      automaticPromptShown.current = true;
      updatesOpenedExplicitly.current = false;
      if (window.matchMedia("(max-width: 639px)").matches) {
        setUpdatesContext({ placement: "newsletter_banner_mobile", trigger });
        setMobileBannerOpen(true);
        trackBetaEvent("newsletter_impression", newsletterEventMetadata("newsletter_banner_mobile", trigger, "banner", pathname));
        return;
      }
      setUpdatesContext({ placement: "newsletter_modal_desktop", trigger });
      setUpdatesOpen(true);
      trackBetaEvent("newsletter_impression", newsletterEventMetadata("newsletter_modal_desktop", trigger, "dialog", pathname));
    };
    const onMeaningfulInteraction = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a, button") : null;
      if (!target) return;
      const anchor = target instanceof HTMLAnchorElement ? target : target.closest("a");
      if (anchor?.href.includes("/api/export")) trackBetaEvent("export", { type: "download" });
      else if (anchor?.target === "_blank" && anchor.href.startsWith("http")) trackBetaEvent("evidence_open", { destination_host: new URL(anchor.href).hostname });
    };
    const onMeaningfulEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ eventName?: string }>).detail;
      if (detail?.eventName === "evidence_open") qualifyAutomaticPrompt("evidence_opened");
      if (detail?.eventName === "atlas_search") qualifyAutomaticPrompt("ask_result_viewed");
    };
    const onQualifiedJourney = (event: Event) => {
      const detail = (event as CustomEvent<{ trigger?: string }>).detail;
      qualifyAutomaticPrompt(detail?.trigger ?? "meaningful_engagement");
    };
    const onScroll = () => {
      if (!/^\/signals\/[^/]+$/.test(pathname)) return;
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      if (window.scrollY / scrollable < 0.6) return;
      qualifyAutomaticPrompt("signal_60_percent");
    };
    document.addEventListener("click", onMeaningfulInteraction, true);
    window.addEventListener("tnm:meaningful-event", onMeaningfulEvent);
    window.addEventListener("tnm:newsletter-qualify", onQualifiedJourney);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      document.removeEventListener("click", onMeaningfulInteraction, true);
      window.removeEventListener("tnm:meaningful-event", onMeaningfulEvent);
      window.removeEventListener("tnm:newsletter-qualify", onQualifiedJourney);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pilot:open-updates", openUpdates);
      window.removeEventListener("pilot:open-feedback", openFeedback);
    };
  }, [pathname]);

  useEffect(() => {
    updatesOpenRef.current = updatesOpen;
  }, [updatesOpen]);

  useEffect(() => {
    feedbackOpenRef.current = feedbackOpen;
  }, [feedbackOpen]);

  useEffect(() => {
    if (pathname !== "/") {
      setLandingFeedbackVisible(true);
      return;
    }
    const updateVisibility = () => setLandingFeedbackVisible(window.scrollY > Math.max(420, window.innerHeight * 0.75));
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, [pathname]);

  useEffect(() => {
    if (!pathname.startsWith("/organizations/")) return;
    const key = `pilot-dossier-view:${pathname}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "true");
    } catch {
      // Duplicate protection is best-effort only.
    }
    trackBetaEvent("dossier_open", { slug: pathname.split("/").pop() ?? "unknown" });
    try {
      const stored = JSON.parse(window.sessionStorage.getItem("tnm:north-signal-profile-views") ?? "[]") as unknown;
      const profileViews = Array.isArray(stored) ? stored.filter((value): value is string => typeof value === "string") : [];
      const updated = Array.from(new Set([...profileViews, pathname])).slice(-10);
      window.sessionStorage.setItem("tnm:north-signal-profile-views", JSON.stringify(updated));
      if (updated.length >= 2) window.dispatchEvent(new CustomEvent("tnm:newsletter-qualify", { detail: { trigger: "second_profile" } }));
    } catch {
      // High-intent prompting is best-effort when session storage is unavailable.
    }
  }, [pathname]);

  if (!pathIsPublicBeta(pathname)) return null;

  function dismissUpdates(placement = updatesContext.placement, trigger = updatesContext.trigger) {
    automaticPromptSuppressed.current = true;
    setUpdatesOpen(false);
    setMobileBannerOpen(false);
    let subscribed = false;
    try {
      subscribed = window.localStorage.getItem(northSignalSubscribedKey) === "true";
      window.localStorage.setItem(dismissedKey, String(Date.now()));
    } catch {
      // Dismissal still applies to the current render.
    }
    if (!subscribed) trackBetaEvent("newsletter_dismiss", newsletterEventMetadata(placement, trigger, placement === "newsletter_banner_mobile" ? "banner" : "dialog", pathname));
  }

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setFeedbackState("loading");
    setFeedbackError("");
    const response = await fetch("/api/beta-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        goal: String(form.get("goal") ?? ""),
        worked: String(form.get("worked") ?? ""),
        missing: String(form.get("missing") ?? ""),
        contactEmail: String(form.get("contactEmail") ?? ""),
        contextPath: window.location.pathname,
        cohort: currentPilotCohort(),
        sessionId: currentPilotSessionId(),
        searchId: currentPilotSearchId(),
        captchaToken: feedbackCaptchaToken,
        website: String(form.get("website") ?? "")
      })
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setFeedbackCaptchaToken("");
      setFeedbackCaptchaAttempt((attempt) => attempt + 1);
      setFeedbackError(body?.error ?? "Your feedback could not be saved.");
      setFeedbackState("error");
      return;
    }
    setFeedbackState("success");
    formElement.reset();
  }

  return (
    <div data-beta-ui>
      <button
        type="button"
        onClick={() => {
          setUpdatesOpen(false);
          setFeedbackOpen(true);
        }}
        aria-label="Open feedback form"
        className={pathname === "/"
          ? `fixed bottom-5 right-5 z-[80] hidden min-h-11 items-center gap-2 rounded-[12px] border border-[var(--atlas-border-strong)] bg-white px-4 text-sm font-bold text-[var(--atlas-ink)] shadow-[var(--atlas-shadow-float)] transition duration-200 hover:border-[var(--atlas-evidence)] hover:text-[var(--atlas-evidence)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(18,97,71,0.18)] sm:inline-flex ${landingFeedbackVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`
          : "fixed right-0 top-[58%] z-[80] hidden w-10 -translate-y-1/2 flex-col items-center gap-2 rounded-l-2xl border border-r-0 border-[var(--atlas-primary)] bg-[var(--atlas-primary)] px-2 py-3 text-xs font-semibold text-white shadow-[var(--atlas-shadow-float)] transition hover:bg-[var(--atlas-primary-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(31,90,67,0.22)] sm:inline-flex"}
      >
        <MessageSquareText aria-hidden="true" className="size-4" />
        <span className={pathname === "/" ? "" : "[writing-mode:vertical-rl] rotate-180"}>Feedback</span>
      </button>

      {mobileBannerOpen ? (
        <aside className="fixed inset-x-3 bottom-3 z-[1200] border border-[var(--atlas-border-strong)] border-l-4 border-l-[var(--atlas-signal)] bg-white p-3 shadow-[var(--atlas-shadow-float)] sm:hidden" aria-label="North Signal weekly briefing">
          <div className="flex items-start gap-3">
            <Bell aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--atlas-ink)]" />
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => {
                setMobileBannerOpen(false);
                updatesOpenedExplicitly.current = true;
                updatesOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
                setUpdatesOpen(true);
                trackBetaEvent("newsletter_open", newsletterEventMetadata("newsletter_banner_mobile", updatesContext.trigger, "banner", pathname));
              }}
            >
              <strong className="block text-sm text-[var(--atlas-ink)]">See the week behind the signals.</strong>
              <span className="mt-0.5 block text-[11px] leading-5 text-[var(--atlas-muted)]">Get the weekly North Signal decision brief.</span>
            </button>
            <button type="button" onClick={() => dismissUpdates("newsletter_banner_mobile", updatesContext.trigger)} className="flex size-8 shrink-0 items-center justify-center text-[var(--atlas-muted)]" aria-label="Dismiss North Signal invitation"><X aria-hidden="true" className="size-4" /></button>
          </div>
        </aside>
      ) : null}

      <Dialog.Root
        open={updatesOpen}
        modal
        onOpenChange={(open) => {
          if (open) setUpdatesOpen(true);
          else dismissUpdates();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay data-beta-ui className="fixed inset-0 z-[1249] bg-[var(--atlas-ink)]/55 backdrop-blur-[3px]" />
          <Dialog.Content
            ref={updatesDialogRef}
            data-beta-ui
            tabIndex={-1}
            aria-modal="true"
            aria-describedby="pilot-updates-description"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              if (updatesOpenedExplicitly.current) {
                updatesDialogRef.current?.querySelector<HTMLInputElement>("[data-north-signal-email]")?.focus();
              } else {
                updatesDialogRef.current?.focus();
              }
            }}
            onCloseAutoFocus={(event) => {
              const restoreTarget = updatesOpenerRef.current?.isConnected
                ? updatesOpenerRef.current
                : updatesOpenedExplicitly.current
                  ? document.querySelector<HTMLElement>("[data-north-signal-mobile-return-focus]")
                  : null;
              if (restoreTarget) {
                event.preventDefault();
                restoreTarget.focus();
              }
              updatesOpenerRef.current = null;
            }}
            className="fixed inset-x-0 bottom-0 z-[1250] max-h-[88vh] overflow-y-auto border border-[var(--atlas-border)] border-t-[3px] border-t-[var(--atlas-signal)] bg-white shadow-[var(--atlas-shadow-float)] outline-none sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-[760px] sm:-translate-x-1/2 sm:-translate-y-1/2"
          >
            <div className="grid sm:grid-cols-[300px_minmax(0,1fr)]">
              <NorthSignalArtwork className="aspect-[16/9] min-h-32 sm:aspect-auto sm:min-h-[480px]" />
              <div className="p-5 sm:p-7">
                <div className="flex items-start gap-3">
                  <span className="hidden shrink-0 sm:block"><BrandLogo compact /></span>
                  <div className="min-w-0 flex-1">
                    <p className="atlas-eyebrow">North Signal · Weekly</p>
                    <Dialog.Title id="pilot-updates-title" className="mt-1 text-2xl font-extrabold tracking-[-0.035em] text-[var(--atlas-ink)]">See the week behind the signals.</Dialog.Title>
                  </div>
                  <Dialog.Close asChild><button type="button" className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[var(--atlas-muted)] hover:bg-[var(--atlas-surface-muted)]" aria-label="Dismiss North Signal signup"><X aria-hidden="true" className="size-4" /></button></Dialog.Close>
                </div>
                <Dialog.Description id="pilot-updates-description" className="mt-3 text-sm leading-6 text-[var(--atlas-muted)]">A five-minute briefing for people making decisions across Canadian defence. See what changed, how it connects to Canadian capability and public needs, and where to investigate next.</Dialog.Description>
                <ul className="mt-4 grid gap-1.5 text-xs leading-5 text-[var(--atlas-ink-soft)]">
                  <li>The one thing to know.</li>
                  <li>Three source-linked Signals behind it.</li>
                  <li>New capability, Mission Area and Public Need connections.</li>
                </ul>
                <p className="mt-3 text-xs font-semibold text-[var(--atlas-muted)]">Weekly. Evidence-led. Original sources included. Unsubscribe anytime.</p>
                <div className="mt-5">
                  <NorthSignalSignupForm placement={updatesContext.placement} trigger={updatesContext.trigger} variant={updatesContext.placement === "newsletter_banner_mobile" ? "sheet" : "dialog"} onSuccess={() => { automaticPromptSuppressed.current = true; setMobileBannerOpen(false); }} />
                </div>
                <NorthSignalSampleLink className="mt-4" placement={updatesContext.placement} trigger={updatesContext.trigger} />
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <Dialog.Portal>
          <Dialog.Overlay data-beta-ui className="fixed inset-0 z-[1300] bg-[var(--atlas-ink)]/55 backdrop-blur-[2px]" />
          <Dialog.Content
            data-beta-ui
            aria-modal="true"
            aria-describedby="pilot-feedback-description"
            onOpenAutoFocus={(event) => {
              if (feedbackGoalRef.current) {
                event.preventDefault();
                feedbackGoalRef.current.focus();
              }
            }}
            className="fixed bottom-0 left-1/2 z-[1301] max-h-[92vh] w-full -translate-x-1/2 overflow-y-auto rounded-t-2xl border border-[var(--atlas-border)] bg-white p-5 shadow-[var(--atlas-shadow-float)] outline-none sm:bottom-auto sm:top-1/2 sm:max-w-xl sm:-translate-y-1/2 sm:rounded-2xl sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]"><MessageSquareText aria-hidden="true" className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="atlas-eyebrow">Public-beta feedback</p>
                <Dialog.Title id="pilot-feedback-title" className="mt-1 text-xl font-bold tracking-[-0.025em] text-[var(--atlas-ink)]">Tell us what would make this useful.</Dialog.Title>
                <Dialog.Description id="pilot-feedback-description" className="mt-2 text-sm leading-6 text-[var(--atlas-muted)]">Tell us what helped, what was missing, or what would make the map more useful in real work.</Dialog.Description>
              </div>
              <Dialog.Close asChild><button type="button" className="flex size-8 items-center justify-center rounded-lg text-[var(--atlas-muted)] hover:bg-[var(--atlas-surface-muted)]" aria-label="Close feedback form"><X aria-hidden="true" className="size-4" /></button></Dialog.Close>
            </div>

            {feedbackState === "success" ? (
              <div className="mt-6 rounded-xl border border-[var(--atlas-primary-border)] bg-[var(--atlas-primary-soft)] p-5 text-center text-sm leading-6 text-[var(--atlas-primary)]">
                <CheckCircle2 aria-hidden="true" className="mx-auto mb-3 size-7" />
                Thank you. Your feedback is queued for the product review.
                <Dialog.Close asChild><button type="button" className="mt-4 block w-full text-xs font-semibold text-[var(--atlas-primary)] underline">Return to the map</button></Dialog.Close>
              </div>
            ) : (
              <form onSubmit={submitFeedback} data-clarity-mask="true" className="mt-5 space-y-4">
                {feedbackError ? <div role="alert" className="rounded-xl border border-[var(--atlas-danger)] bg-[var(--atlas-danger-soft)] px-3 py-2 text-sm text-[var(--atlas-danger)]">{feedbackError}</div> : null}
                <label className="grid gap-1.5 text-xs font-semibold text-[var(--atlas-ink-soft)]">What were you trying to accomplish?<textarea ref={feedbackGoalRef} name="goal" required minLength={3} maxLength={1200} rows={3} placeholder="For example: find three Atlantic companies relevant to an underwater ISR opportunity." className="rounded-xl border border-[var(--atlas-border-strong)] px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-[var(--atlas-primary)] focus:ring-4 focus:ring-[rgba(31,90,67,0.1)]" /></label>
                <label className="grid gap-1.5 text-xs font-semibold text-[var(--atlas-ink-soft)]">What worked well?<textarea name="worked" maxLength={2000} rows={3} placeholder="Which pages, evidence, filters, or exports helped?" className="rounded-xl border border-[var(--atlas-border-strong)] px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-[var(--atlas-primary)] focus:ring-4 focus:ring-[rgba(31,90,67,0.1)]" /></label>
                <label className="grid gap-1.5 text-xs font-semibold text-[var(--atlas-ink-soft)]">What did not work, or what was missing?<textarea name="missing" required minLength={3} maxLength={3000} rows={4} placeholder="Missing organizations, information, workflows, comparisons, or day-to-day needs are all useful." className="rounded-xl border border-[var(--atlas-border-strong)] px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-[var(--atlas-primary)] focus:ring-4 focus:ring-[rgba(31,90,67,0.1)]" /></label>
                <label className="grid gap-1.5 text-xs font-semibold text-[var(--atlas-ink-soft)]">Email for follow-up <span className="font-normal text-[var(--atlas-muted)]">(optional)</span><input name="contactEmail" type="email" maxLength={320} autoComplete="email" placeholder="you@organization.ca" className="h-11 rounded-xl border border-[var(--atlas-border-strong)] px-3 text-sm font-normal outline-none focus:border-[var(--atlas-primary)] focus:ring-4 focus:ring-[rgba(31,90,67,0.1)]" /></label>
                <label className="absolute left-[-9999px]" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
                {turnstileSiteKey ? <TurnstileField key={feedbackCaptchaAttempt} siteKey={turnstileSiteKey} onTokenChange={setFeedbackCaptchaToken} purpose="feedback" /> : null}
                <div className="flex flex-col-reverse gap-2 border-t border-[var(--atlas-border)] pt-4 sm:flex-row sm:justify-end">
                  <Dialog.Close asChild><button type="button" className="atlas-secondary-button h-10 px-4 text-sm">Cancel</button></Dialog.Close>
                  <button type="submit" disabled={feedbackState === "loading" || Boolean(turnstileSiteKey && !feedbackCaptchaToken)} aria-busy={feedbackState === "loading" || undefined} className="atlas-primary-button h-10 gap-2 px-4 text-sm disabled:opacity-60">
                    {feedbackState === "loading" ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Send aria-hidden="true" className="size-4" />}
                    Send feedback
                  </button>
                </div>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
