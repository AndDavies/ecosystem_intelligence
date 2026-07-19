"use client";

import Link from "next/link";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { FormEvent, useState } from "react";

export function ContributionForm({
  submissionType,
  targetEntityType,
  targetEntityId,
  returnTo
}: {
  submissionType: "profile_claim" | "correction" | "new_organization";
  targetEntityType: string | null;
  targetEntityId: string | null;
  returnTo: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionType,
        targetEntityType,
        targetEntityId,
        payload: {
          subject: String(form.get("subject") ?? ""),
          details: String(form.get("details") ?? ""),
          evidenceUrl: String(form.get("evidenceUrl") ?? "") || null,
          submitterRole: String(form.get("submitterRole") ?? "") || null
        }
      })
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "The submission could not be staged for review.");
      setLoading(false);
      return;
    }
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[var(--atlas-primary-border)] bg-[var(--atlas-primary-soft)] p-6 text-center">
        <CheckCircle2 className="mx-auto size-8 text-[var(--atlas-primary)]" />
        <h2 className="mt-4 text-lg font-bold text-[var(--atlas-ink)]">Submitted for editorial review</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--atlas-muted)]">The public map was not changed. An editor can compare your evidence with the current profile and make a review decision.</p>
        <Link href={returnTo} className="atlas-primary-button mt-5 h-10 px-4 text-sm">Return to published record</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? <div className="rounded-xl border border-[var(--atlas-danger)] bg-[var(--atlas-danger-soft)] px-3 py-2 text-sm text-[var(--atlas-danger)]">{error}</div> : null}
      <label className="grid gap-1.5 text-xs font-semibold text-[var(--atlas-ink-soft)]">Short subject<input name="subject" required minLength={3} maxLength={150} placeholder="Correct headquarters location" className="form-control h-10" /></label>
      <label className="grid gap-1.5 text-xs font-semibold text-[var(--atlas-ink-soft)]">Details<textarea name="details" required minLength={10} maxLength={4000} rows={7} placeholder="Describe the claim or correction and identify the exact fields involved." className="form-control h-auto py-3" /></label>
      <label className="grid gap-1.5 text-xs font-semibold text-[var(--atlas-ink-soft)]">Public evidence URL<input name="evidenceUrl" type="url" placeholder="https://organization.ca/about" className="form-control h-10" /><span className="font-normal leading-5 text-[var(--atlas-muted)]">Public claims need a canonical source or an approved first-party submission.</span></label>
      <label className="grid gap-1.5 text-xs font-semibold text-[var(--atlas-ink-soft)]">Your relationship to the organization<input name="submitterRole" maxLength={150} placeholder="Employee, founder, ecosystem partner, researcher" className="form-control h-10" /></label>
      <div className="flex flex-col-reverse gap-2 border-t border-[var(--atlas-border)] pt-4 sm:flex-row sm:justify-end">
        <Link href={returnTo} className="atlas-secondary-button h-10 px-4 text-sm">Cancel</Link>
        <button type="submit" disabled={loading} className="atlas-primary-button h-10 gap-2 px-4 text-sm disabled:opacity-60">{loading ? <LoaderCircle className="size-4 animate-spin" /> : null}Submit for review</button>
      </div>
    </form>
  );
}
