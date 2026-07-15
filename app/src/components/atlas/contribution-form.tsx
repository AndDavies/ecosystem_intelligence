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
      <div className="rounded-lg border border-[#abefc6] bg-[#ecfdf3] p-6 text-center">
        <CheckCircle2 className="mx-auto size-8 text-[#079455]" />
        <h2 className="mt-4 text-lg font-bold text-[#101828]">Submitted for editorial review</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#475467]">The public atlas was not changed. An editor can compare your evidence with the current record and record a review decision.</p>
        <Link href={returnTo} className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#0756d9] px-4 text-sm font-semibold text-white no-underline hover:bg-[#0649b9] hover:no-underline">Return to published record</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? <div className="rounded-md border border-[#fda29b] bg-[#fff6f5] px-3 py-2 text-sm text-[#b42318]">{error}</div> : null}
      <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">Short subject<input name="subject" required minLength={3} maxLength={150} placeholder="Correct headquarters location" className="h-10 rounded-md border border-[#d0d5dd] px-3 text-sm font-normal outline-none focus:border-[#0756d9] focus:ring-4 focus:ring-[#0756d9]/10" /></label>
      <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">Details<textarea name="details" required minLength={10} maxLength={4000} rows={7} placeholder="Describe the claim or correction and identify the exact fields involved." className="rounded-md border border-[#d0d5dd] px-3 py-2 text-sm font-normal outline-none focus:border-[#0756d9] focus:ring-4 focus:ring-[#0756d9]/10" /></label>
      <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">Public evidence URL<input name="evidenceUrl" type="url" placeholder="https://organization.ca/about" className="h-10 rounded-md border border-[#d0d5dd] px-3 text-sm font-normal outline-none focus:border-[#0756d9] focus:ring-4 focus:ring-[#0756d9]/10" /><span className="font-normal leading-5 text-[#667085]">Public claims need a canonical source or an approved first-party submission.</span></label>
      <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">Your relationship to the organization<input name="submitterRole" maxLength={150} placeholder="Employee, founder, ecosystem partner, researcher" className="h-10 rounded-md border border-[#d0d5dd] px-3 text-sm font-normal outline-none focus:border-[#0756d9] focus:ring-4 focus:ring-[#0756d9]/10" /></label>
      <div className="flex flex-col-reverse gap-2 border-t border-[#eaecf0] pt-4 sm:flex-row sm:justify-end">
        <Link href={returnTo} className="inline-flex h-10 items-center justify-center rounded-md border border-[#d0d5dd] bg-white px-4 text-sm font-semibold text-[#344054] no-underline hover:bg-[#f8fafc] hover:no-underline">Cancel</Link>
        <button type="submit" disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0756d9] px-4 text-sm font-semibold text-white hover:bg-[#0649b9] disabled:opacity-60">{loading ? <LoaderCircle className="size-4 animate-spin" /> : null}Submit for review</button>
      </div>
    </form>
  );
}
