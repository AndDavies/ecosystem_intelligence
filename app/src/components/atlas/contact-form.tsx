"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { TurnstileField } from "@/components/security/turnstile-field";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaAttempt, setCaptchaAttempt] = useState(0);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setState("loading");
    setError("");
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...Object.fromEntries(form.entries()), captchaToken })
    });
    const body = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok) {
      setCaptchaToken("");
      setCaptchaAttempt((attempt) => attempt + 1);
      setError(body?.error ?? "Your message could not be sent.");
      setState("error");
      return;
    }
    formElement.reset();
    setState("success");
  }

  if (state === "success") return <div className="rounded-2xl border border-[var(--atlas-primary-border)] bg-[var(--atlas-primary-soft)] p-5 text-sm leading-6 text-[var(--atlas-primary)]"><CheckCircle2 className="mb-2 size-5" />Your message has been received. Andrew will review it privately.</div>;

  return (
    <form onSubmit={submit} data-clarity-mask="true" className="grid gap-4">
      {error ? <div role="alert" className="rounded-xl border border-[var(--atlas-danger)] bg-[var(--atlas-danger-soft)] px-3 py-2 text-sm text-[var(--atlas-danger)]">{error}</div> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name"><input name="senderName" required minLength={2} maxLength={120} autoComplete="name" className="form-control" /></Field>
        <Field label="Email"><input name="senderEmail" type="email" required maxLength={320} autoComplete="email" className="form-control" /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Organization (optional)"><input name="organizationName" maxLength={180} autoComplete="organization" className="form-control" /></Field>
        <Field label="Topic"><select name="category" className="form-control" defaultValue="general"><option value="general">General</option><option value="partnership">Partnership</option><option value="media">Media</option><option value="privacy">Privacy</option></select></Field>
      </div>
      <Field label="Message"><textarea name="message" required minLength={20} maxLength={4000} rows={7} className="form-control h-auto py-3" placeholder="How can True North Map help?" /></Field>
      <label className="absolute left-[-9999px]" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      {turnstileSiteKey ? <TurnstileField key={captchaAttempt} siteKey={turnstileSiteKey} onTokenChange={setCaptchaToken} purpose="message" /> : null}
      <button type="submit" disabled={state === "loading" || Boolean(turnstileSiteKey && !captchaToken)} className="atlas-primary-button h-11 gap-2 px-5 text-sm disabled:opacity-60 sm:w-fit">{state === "loading" ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}Send message</button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-xs font-semibold text-[var(--atlas-ink-soft)]">{label}{children}</label>;
}
