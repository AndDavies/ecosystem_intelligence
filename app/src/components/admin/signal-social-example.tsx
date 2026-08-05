"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function SignalSocialExample({ platform, text, status }: { platform: string; text: string; status: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <article className="rounded-2xl bg-[var(--atlas-blue-soft)] p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="atlas-eyebrow">{platform === "x" ? "X" : "LinkedIn"}</p><p className="mt-1 text-xs text-[var(--atlas-muted)]">Private example · {status}</p></div>
      <button type="button" onClick={copy} className="atlas-secondary-button h-10 gap-2 px-3 text-xs" aria-live="polite">{copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? "Copied" : "Copy"}</button>
    </div>
    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[var(--atlas-ink-soft)]">{text}</p>
  </article>;
}
