"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CheckCircle2, LoaderCircle, MessageSquareText, Send, Waves, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { currentPilotCohort, trackPilotEvent } from "@/lib/pilot/client";

const consentText = "I agree to receive occasional Ecosystem Intelligence design-partner updates. I can unsubscribe at any time.";
const consentVersion = "preview-2026-07";
const dismissedKey = "ecosystem-intelligence-updates-dismissed-at";
const subscribedKey = "ecosystem-intelligence-updates-subscribed";
const dismissForMs = 14 * 24 * 60 * 60 * 1000;

function pathIsPublicPreview(pathname: string) {
  return pathname === "/" || ["/regions", "/organizations", "/capabilities", "/demand", "/privacy"].some((prefix) => pathname.startsWith(prefix));
}

export function PilotExperience() {
  const pathname = usePathname();
  const [updatesOpen, setUpdatesOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [signupState, setSignupState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedbackState, setFeedbackState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [signupError, setSignupError] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const interactionCount = useRef(0);
  const automaticPromptSuppressed = useRef(false);
  const feedbackGoalRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!pathIsPublicPreview(pathname)) return;
    currentPilotCohort();

    const openUpdates = () => setUpdatesOpen(true);
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
          if (!automaticPromptSuppressed.current) setUpdatesOpen(true);
        }, 45_000);
    const onMeaningfulInteraction = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a, button") : null;
      if (!target) return;
      const anchor = target instanceof HTMLAnchorElement ? target : target.closest("a");
      if (anchor?.href.includes("/api/export")) trackPilotEvent("export", { type: "download" });
      else if (anchor?.target === "_blank" && anchor.href.startsWith("http")) trackPilotEvent("evidence_open", { destination_host: new URL(anchor.href).hostname });
      if (automaticPromptSuppressed.current || target.closest("[data-pilot-ui]")) return;
      interactionCount.current += 1;
      if (interactionCount.current >= 2) setUpdatesOpen(true);
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
    trackPilotEvent("dossier_open", { slug: pathname.split("/").pop() ?? "unknown" });
  }, [pathname]);

  useEffect(() => {
    if (!feedbackOpen) return;
    feedbackGoalRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFeedbackOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [feedbackOpen]);

  if (!pathIsPublicPreview(pathname)) return null;

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
    const response = await fetch("/api/pilot-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        email: String(form.get("email") ?? ""),
        consent: form.get("consent") === "on",
        consentText,
        consentVersion,
        source: "pilot_prompt",
        cohort: currentPilotCohort(),
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
    const response = await fetch("/api/pilot-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        goal: String(form.get("goal") ?? ""),
        worked: String(form.get("worked") ?? ""),
        missing: String(form.get("missing") ?? ""),
        contactEmail: String(form.get("contactEmail") ?? ""),
        contextPath: window.location.pathname,
        cohort: currentPilotCohort(),
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
    <div data-pilot-ui>
      <button
        type="button"
        onClick={() => {
          setUpdatesOpen(false);
          setFeedbackOpen(true);
        }}
        className="fixed bottom-4 left-4 z-[1200] inline-flex h-11 items-center gap-2 rounded-full border border-white/20 bg-[#05052b] px-4 text-xs font-semibold text-white shadow-[0_12px_32px_rgba(5,5,43,0.28)] transition hover:-translate-y-0.5 hover:bg-[#101047] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#43c5d8]/35"
      >
        <MessageSquareText className="size-4 text-[#62d9e8]" />
        Give feedback
      </button>

      {updatesOpen ? (
        <aside
          role="dialog"
          aria-modal="false"
          aria-labelledby="pilot-updates-title"
          className="fixed inset-x-3 bottom-3 z-[1250] max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-xl border border-[#b8dfe5] bg-white p-5 shadow-[0_24px_70px_rgba(5,5,43,0.26)] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[390px]"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e7f8fa] text-[#007f98]"><Bell className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#007f98]">Design partner preview</p>
              <h2 id="pilot-updates-title" className="mt-1 text-lg font-bold tracking-[-0.02em] text-[#05052b]">Help shape the next release.</h2>
            </div>
            <button type="button" onClick={dismissUpdates} className="flex size-8 items-center justify-center rounded-md text-[#667085] hover:bg-[#f2f4f7]" aria-label="Dismiss update signup"><X className="size-4" /></button>
          </div>

          {signupState === "success" ? (
            <div className="mt-5 rounded-lg border border-[#9ee2c0] bg-[#edfcf4] p-4 text-sm leading-6 text-[#05603a]">
              <CheckCircle2 className="mb-2 size-5" />
              You are on the update list. Thank you for helping shape the preview.
            </div>
          ) : (
            <>
              <p className="mt-3 text-sm leading-6 text-[#475467]">Get occasional pilot updates when verified coverage and new workflows are ready to test.</p>
              <form onSubmit={submitSignup} className="mt-4 space-y-3">
                {signupError ? <div role="alert" className="rounded-md border border-[#fda29b] bg-[#fff6f5] px-3 py-2 text-xs text-[#b42318]">{signupError}</div> : null}
                <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">
                  Email address
                  <input name="email" type="email" required autoComplete="email" placeholder="you@organization.ca" className="h-11 rounded-md border border-[#b8c8ce] px-3 text-sm font-normal outline-none focus:border-[#008fa8] focus:ring-4 focus:ring-[#43c5d8]/20" />
                </label>
                <label className="flex items-start gap-2.5 text-[11px] leading-5 text-[#475467]">
                  <input name="consent" type="checkbox" required className="mt-1 size-4 accent-[#007f98]" />
                  <span>{consentText} <Link href="/privacy" className="font-semibold text-[#007f98] underline">Privacy details</Link></span>
                </label>
                <label className="absolute left-[-9999px]" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
                <button type="submit" disabled={signupState === "loading"} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#007f98] px-4 text-sm font-semibold text-white hover:bg-[#00677d] disabled:opacity-60">
                  {signupState === "loading" ? <LoaderCircle className="size-4 animate-spin" /> : <Waves className="size-4" />}
                  Get pilot updates
                </button>
              </form>
            </>
          )}
        </aside>
      ) : null}

      {feedbackOpen ? (
        <div className="fixed inset-0 z-[1300] flex items-end justify-center bg-[#05052b]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFeedbackOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="pilot-feedback-title" className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-[#b8dfe5] bg-white p-5 shadow-[0_28px_80px_rgba(5,5,43,0.3)] sm:max-w-xl sm:rounded-xl sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e7f8fa] text-[#007f98]"><MessageSquareText className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#007f98]">COVE design-partner feedback</p>
                <h2 id="pilot-feedback-title" className="mt-1 text-xl font-bold tracking-[-0.025em] text-[#05052b]">Tell us what would make this useful.</h2>
                <p className="mt-2 text-sm leading-6 text-[#667085]">The most valuable feedback is what did not work, what is missing, and what you need in day-to-day BD work.</p>
              </div>
              <button type="button" onClick={() => setFeedbackOpen(false)} className="flex size-8 items-center justify-center rounded-md text-[#667085] hover:bg-[#f2f4f7]" aria-label="Close feedback form"><X className="size-4" /></button>
            </div>

            {feedbackState === "success" ? (
              <div className="mt-6 rounded-lg border border-[#9ee2c0] bg-[#edfcf4] p-5 text-center text-sm leading-6 text-[#05603a]">
                <CheckCircle2 className="mx-auto mb-3 size-7" />
                Thank you. Your feedback is queued for the product review.
                <button type="button" onClick={() => setFeedbackOpen(false)} className="mt-4 block w-full text-xs font-semibold text-[#05603a] underline">Return to the atlas</button>
              </div>
            ) : (
              <form onSubmit={submitFeedback} className="mt-5 space-y-4">
                {feedbackError ? <div role="alert" className="rounded-md border border-[#fda29b] bg-[#fff6f5] px-3 py-2 text-sm text-[#b42318]">{feedbackError}</div> : null}
                <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">What were you trying to accomplish?<textarea ref={feedbackGoalRef} name="goal" required minLength={3} maxLength={1200} rows={3} placeholder="For example: find three Atlantic companies relevant to an underwater ISR opportunity." className="rounded-md border border-[#b8c8ce] px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-[#008fa8] focus:ring-4 focus:ring-[#43c5d8]/20" /></label>
                <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">What worked well?<textarea name="worked" maxLength={2000} rows={3} placeholder="Which pages, evidence, filters, or exports helped?" className="rounded-md border border-[#b8c8ce] px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-[#008fa8] focus:ring-4 focus:ring-[#43c5d8]/20" /></label>
                <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">What did not work, or what was missing?<textarea name="missing" required minLength={3} maxLength={3000} rows={4} placeholder="Missing organizations, information, workflows, comparisons, or day-to-day needs are all useful." className="rounded-md border border-[#b8c8ce] px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-[#008fa8] focus:ring-4 focus:ring-[#43c5d8]/20" /></label>
                <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">Email for follow-up <span className="font-normal text-[#667085]">(optional)</span><input name="contactEmail" type="email" maxLength={320} autoComplete="email" placeholder="you@organization.ca" className="h-11 rounded-md border border-[#b8c8ce] px-3 text-sm font-normal outline-none focus:border-[#008fa8] focus:ring-4 focus:ring-[#43c5d8]/20" /></label>
                <label className="absolute left-[-9999px]" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
                <div className="flex flex-col-reverse gap-2 border-t border-[#e4e7ec] pt-4 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setFeedbackOpen(false)} className="h-10 rounded-md border border-[#d0d5dd] bg-white px-4 text-sm font-semibold text-[#344054] hover:bg-[#f8fafc]">Cancel</button>
                  <button type="submit" disabled={feedbackState === "loading"} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#007f98] px-4 text-sm font-semibold text-white hover:bg-[#00677d] disabled:opacity-60">
                    {feedbackState === "loading" ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                    Send feedback
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
