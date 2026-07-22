"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CheckCircle2, LoaderCircle, MessageSquareText, Send, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  currentPilotCohort,
  currentPilotSearchId,
  currentPilotSessionId,
  trackBetaEvent
} from "@/lib/product-insights/client";

const consentText = "I agree to receive occasional True North Map public-beta updates. I can unsubscribe at any time.";
const consentVersion = "public-beta-2026-07";
const dismissedKey = "ecosystem-intelligence-updates-dismissed-at";
const subscribedKey = "ecosystem-intelligence-updates-subscribed";
const dismissForMs = 30 * 24 * 60 * 60 * 1000;

function pathIsPublicBeta(pathname: string) {
  return pathname === "/" || ["/regions", "/organizations", "/capabilities", "/demand", "/about", "/methodology", "/privacy", "/terms", "/contact"].some((prefix) => pathname.startsWith(prefix));
}

export function PublicBetaExperience() {
  const pathname = usePathname();
  const [updatesOpen, setUpdatesOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [signupState, setSignupState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedbackState, setFeedbackState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [signupError, setSignupError] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const interactionCount = useRef(0);
  const automaticPromptSuppressed = useRef(false);
  const updatesOpenedExplicitly = useRef(false);
  const feedbackGoalRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    if (!pathIsPublicBeta(pathname)) return;
    currentPilotCohort();

    const openUpdates = () => {
      updatesOpenedExplicitly.current = true;
      setUpdatesOpen(true);
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
      alreadySubscribed = window.localStorage.getItem(subscribedKey) === "true";
      const dismissedAt = Number(window.localStorage.getItem(dismissedKey) ?? 0);
      recentlyDismissed = dismissedAt > 0 && Date.now() - dismissedAt < dismissForMs;
    } catch {
      // Storage is optional; the prompt remains dismissible for the session.
    }
    automaticPromptSuppressed.current = alreadySubscribed || recentlyDismissed;

    const timer = automaticPromptSuppressed.current
      ? null
      : window.setTimeout(() => {
          if (!automaticPromptSuppressed.current) {
            updatesOpenedExplicitly.current = false;
            setUpdatesOpen(true);
          }
        }, 45_000);
    const onMeaningfulInteraction = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a, button") : null;
      if (!target) return;
      const anchor = target instanceof HTMLAnchorElement ? target : target.closest("a");
      if (anchor?.href.includes("/api/export")) trackBetaEvent("export", { type: "download" });
      else if (anchor?.target === "_blank" && anchor.href.startsWith("http")) trackBetaEvent("evidence_open", { destination_host: new URL(anchor.href).hostname });
      if (automaticPromptSuppressed.current || target.closest("[data-beta-ui]")) return;
      interactionCount.current += 1;
      if (interactionCount.current >= 2) {
        updatesOpenedExplicitly.current = false;
        setUpdatesOpen(true);
      }
    };
    document.addEventListener("click", onMeaningfulInteraction, true);

    return () => {
      if (timer !== null) window.clearTimeout(timer);
      document.removeEventListener("click", onMeaningfulInteraction, true);
      window.removeEventListener("pilot:open-updates", openUpdates);
      window.removeEventListener("pilot:open-feedback", openFeedback);
    };
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
  }, [pathname]);

  if (!pathIsPublicBeta(pathname)) return null;

  function dismissUpdates() {
    automaticPromptSuppressed.current = true;
    setUpdatesOpen(false);
    try {
      window.localStorage.setItem(dismissedKey, String(Date.now()));
    } catch {
      // Dismissal still applies to the current render.
    }
  }

  async function submitSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSignupState("loading");
    setSignupError("");
    const response = await fetch("/api/beta-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        email: String(form.get("email") ?? ""),
        consent: form.get("consent") === "on",
        consentText,
        consentVersion,
        source: "public_beta_prompt",
        cohort: currentPilotCohort(),
        sessionId: currentPilotSessionId(),
        searchId: currentPilotSearchId(),
        landingPath: window.location.pathname,
        website: String(form.get("website") ?? "")
      })
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setSignupError(body?.error ?? "Your signup could not be saved.");
      setSignupState("error");
      return;
    }
    try {
      window.localStorage.setItem(subscribedKey, "true");
    } catch {
      // The server-side consent record is authoritative.
    }
    automaticPromptSuppressed.current = true;
    setSignupState("success");
    formElement.reset();
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
        website: String(form.get("website") ?? "")
      })
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
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
        className="fixed bottom-4 left-4 z-[1200] inline-flex h-11 items-center gap-2 rounded-full border border-[var(--atlas-primary)] bg-[var(--atlas-primary)] px-4 text-xs font-semibold text-white shadow-[var(--atlas-shadow-float)] transition hover:-translate-y-0.5 hover:bg-[var(--atlas-primary-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(31,90,67,0.22)]"
      >
        <MessageSquareText aria-hidden="true" className="size-4" />
        Give feedback
      </button>

      <Dialog.Root
        open={updatesOpen}
        modal={false}
        onOpenChange={(open) => {
          if (open) setUpdatesOpen(true);
          else dismissUpdates();
        }}
      >
        <Dialog.Portal>
          <Dialog.Content
            data-beta-ui
            aria-modal="false"
            aria-describedby="pilot-updates-description"
            onOpenAutoFocus={(event) => {
              if (!updatesOpenedExplicitly.current) event.preventDefault();
            }}
            className="fixed inset-x-3 bottom-3 z-[1250] max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-2xl border border-[var(--atlas-border)] bg-white p-5 shadow-[var(--atlas-shadow-float)] outline-none sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[390px]"
          >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]"><Bell aria-hidden="true" className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="atlas-eyebrow">Public Beta</p>
              <Dialog.Title id="pilot-updates-title" className="mt-1 text-lg font-bold tracking-[-0.02em] text-[var(--atlas-ink)]">Follow the map as it grows.</Dialog.Title>
            </div>
            <Dialog.Close asChild><button type="button" className="flex size-8 items-center justify-center rounded-lg text-[var(--atlas-muted)] hover:bg-[var(--atlas-surface-muted)]" aria-label="Dismiss update signup"><X aria-hidden="true" className="size-4" /></button></Dialog.Close>
          </div>
          <Dialog.Description id="pilot-updates-description" className={signupState === "success" ? "sr-only" : "mt-3 text-sm leading-6 text-[var(--atlas-muted)]"}>Get occasional updates when verified coverage, connections, and new workflows are ready.</Dialog.Description>

          {signupState === "success" ? (
            <div className="mt-5 rounded-xl border border-[var(--atlas-primary-border)] bg-[var(--atlas-primary-soft)] p-4 text-sm leading-6 text-[var(--atlas-primary)]">
              <CheckCircle2 aria-hidden="true" className="mb-2 size-5" />
              You are on the update list. We will only send occasional product and coverage updates.
            </div>
          ) : (
            <>
              <form onSubmit={submitSignup} className="mt-4 space-y-3">
                {signupError ? <div role="alert" className="rounded-xl border border-[var(--atlas-danger)] bg-[var(--atlas-danger-soft)] px-3 py-2 text-xs text-[var(--atlas-danger)]">{signupError}</div> : null}
                <label className="grid gap-1.5 text-xs font-semibold text-[var(--atlas-ink-soft)]">
                  Email address
                  <input name="email" type="email" required autoComplete="email" placeholder="you@organization.ca" className="h-11 rounded-xl border border-[var(--atlas-border-strong)] px-3 text-sm font-normal outline-none focus:border-[var(--atlas-primary)] focus:ring-4 focus:ring-[rgba(31,90,67,0.1)]" />
                </label>
                <label className="flex items-start gap-2.5 text-[11px] leading-5 text-[var(--atlas-muted)]">
                  <input name="consent" type="checkbox" required className="mt-1 size-4 accent-[var(--atlas-primary)]" />
                  <span>{consentText} <Link href="/privacy" className="font-semibold text-[var(--atlas-primary)] underline">Privacy details</Link></span>
                </label>
                <label className="absolute left-[-9999px]" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
                <button type="submit" disabled={signupState === "loading"} aria-busy={signupState === "loading" || undefined} className="atlas-primary-button h-11 w-full gap-2 px-4 text-sm disabled:opacity-60">
                  {signupState === "loading" ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Bell aria-hidden="true" className="size-4" />}
                  Get updates
                </button>
              </form>
            </>
          )}
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
                <Dialog.Close asChild><button type="button" className="mt-4 block w-full text-xs font-semibold text-[var(--atlas-primary)] underline">Return to the ecosystem map</button></Dialog.Close>
              </div>
            ) : (
              <form onSubmit={submitFeedback} className="mt-5 space-y-4">
                {feedbackError ? <div role="alert" className="rounded-xl border border-[var(--atlas-danger)] bg-[var(--atlas-danger-soft)] px-3 py-2 text-sm text-[var(--atlas-danger)]">{feedbackError}</div> : null}
                <label className="grid gap-1.5 text-xs font-semibold text-[var(--atlas-ink-soft)]">What were you trying to accomplish?<textarea ref={feedbackGoalRef} name="goal" required minLength={3} maxLength={1200} rows={3} placeholder="For example: find three Atlantic companies relevant to an underwater ISR opportunity." className="rounded-xl border border-[var(--atlas-border-strong)] px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-[var(--atlas-primary)] focus:ring-4 focus:ring-[rgba(31,90,67,0.1)]" /></label>
                <label className="grid gap-1.5 text-xs font-semibold text-[var(--atlas-ink-soft)]">What worked well?<textarea name="worked" maxLength={2000} rows={3} placeholder="Which pages, evidence, filters, or exports helped?" className="rounded-xl border border-[var(--atlas-border-strong)] px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-[var(--atlas-primary)] focus:ring-4 focus:ring-[rgba(31,90,67,0.1)]" /></label>
                <label className="grid gap-1.5 text-xs font-semibold text-[var(--atlas-ink-soft)]">What did not work, or what was missing?<textarea name="missing" required minLength={3} maxLength={3000} rows={4} placeholder="Missing organizations, information, workflows, comparisons, or day-to-day needs are all useful." className="rounded-xl border border-[var(--atlas-border-strong)] px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-[var(--atlas-primary)] focus:ring-4 focus:ring-[rgba(31,90,67,0.1)]" /></label>
                <label className="grid gap-1.5 text-xs font-semibold text-[var(--atlas-ink-soft)]">Email for follow-up <span className="font-normal text-[var(--atlas-muted)]">(optional)</span><input name="contactEmail" type="email" maxLength={320} autoComplete="email" placeholder="you@organization.ca" className="h-11 rounded-xl border border-[var(--atlas-border-strong)] px-3 text-sm font-normal outline-none focus:border-[var(--atlas-primary)] focus:ring-4 focus:ring-[rgba(31,90,67,0.1)]" /></label>
                <label className="absolute left-[-9999px]" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
                <div className="flex flex-col-reverse gap-2 border-t border-[var(--atlas-border)] pt-4 sm:flex-row sm:justify-end">
                  <Dialog.Close asChild><button type="button" className="atlas-secondary-button h-10 px-4 text-sm">Cancel</button></Dialog.Close>
                  <button type="submit" disabled={feedbackState === "loading"} aria-busy={feedbackState === "loading" || undefined} className="atlas-primary-button h-10 gap-2 px-4 text-sm disabled:opacity-60">
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
