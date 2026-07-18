"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { trackPilotEvent } from "@/lib/pilot/client";

export function ConnectionForm({ organizationId, organizationName, defaultName }: { organizationId: string; organizationName: string; defaultName: string }) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setState("loading");
    setError("");
    const response = await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        organizationId,
        requesterName: String(form.get("requesterName") ?? ""),
        requesterOrganization: String(form.get("requesterOrganization") ?? ""),
        intent: String(form.get("intent") ?? ""),
        message: String(form.get("message") ?? "")
      })
    });
    const body = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok) {
      setError(body?.error ?? "Your request could not be saved.");
      setState("error");
      return;
    }
    trackPilotEvent("connection", { organization_id: organizationId });
    setState("success");
  }

  if (state === "success") return <div className="rounded-2xl border border-[var(--atlas-primary-border)] bg-[var(--atlas-primary-soft)] p-5 text-sm leading-6 text-[var(--atlas-primary)]"><CheckCircle2 className="mb-2 size-5" /><strong>Request received.</strong> Andrew will privately review the fit and, where appropriate, help coordinate a consent-based introduction. No introduction or endorsement is automatic.</div>;

  return (
    <form onSubmit={submit} className="grid gap-4">
      {error ? <div role="alert" className="rounded-xl border border-[var(--atlas-danger)] bg-[var(--atlas-danger-soft)] px-3 py-2 text-sm text-[var(--atlas-danger)]">{error}</div> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name"><input name="requesterName" required minLength={2} maxLength={120} defaultValue={defaultName} className="form-control" /></Field>
        <Field label="Your organization (optional)"><input name="requesterOrganization" maxLength={180} className="form-control" /></Field>
      </div>
      <Field label={`What kind of conversation are you seeking with ${organizationName}?`}>
        <select name="intent" defaultValue="partnership" className="form-control"><option value="partnership">Partnership</option><option value="supplier_customer">Supplier or customer discussion</option><option value="pilot_testing">Pilot or testing</option><option value="program_support">Program support</option><option value="investment">Investment</option><option value="other">Other</option></select>
      </Field>
      <Field label="What do you need, and what can you offer?"><textarea name="message" required minLength={20} maxLength={2000} rows={7} className="form-control h-auto py-3" placeholder="Share enough context to assess whether an introduction would be useful to both sides." /></Field>
      <p className="text-[11px] leading-5 text-[var(--atlas-muted)]">True North Map facilitates discovery and potential introductions. It does not endorse either party, share private contact details publicly, or replace due diligence. See the <Link href="/terms" className="underline">Terms</Link>.</p>
      <button type="submit" disabled={state === "loading"} className="atlas-primary-button h-11 gap-2 px-5 text-sm disabled:opacity-60 sm:w-fit">{state === "loading" ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}Request connection</button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-xs font-semibold text-[var(--atlas-ink-soft)]">{label}{children}</label>;
}
