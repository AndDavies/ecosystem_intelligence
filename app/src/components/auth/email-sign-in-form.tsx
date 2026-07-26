"use client";

import { Mail } from "lucide-react";
import { useState } from "react";
import { sendEmailSignInLink } from "@/lib/actions/auth";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { TurnstileField } from "@/components/security/turnstile-field";

export function EmailSignInForm({
  next,
  configured,
  turnstileSiteKey
}: {
  next: string;
  configured: boolean;
  turnstileSiteKey?: string;
}) {
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRequired = Boolean(turnstileSiteKey);

  return (
    <form action={sendEmailSignInLink} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="captchaToken" value={captchaToken} />
      <label className="grid gap-1.5 text-xs font-semibold text-[var(--atlas-ink-soft)]">
        Email address
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--atlas-muted)]" aria-hidden="true" />
          <input
            name="email"
            required
            type="email"
            autoComplete="email"
            maxLength={320}
            placeholder="you@company.ca"
            className="h-11 w-full rounded-md border border-[var(--atlas-border)] pl-10 pr-3 text-sm font-normal outline-none focus:border-[var(--atlas-primary)] focus:ring-4 focus:ring-[var(--atlas-primary)]/10"
          />
        </div>
      </label>
      {turnstileSiteKey ? (
        <TurnstileField siteKey={turnstileSiteKey} onTokenChange={setCaptchaToken} purpose="sign-in request" />
      ) : null}
      <AuthSubmitButton
        pendingLabel="Sending secure link…"
        disabled={!configured || (captchaRequired && !captchaToken)}
        className="bg-[var(--atlas-ink)] text-white hover:bg-[var(--atlas-primary-hover)]"
      >
        Email me a secure sign-in link
      </AuthSubmitButton>
    </form>
  );
}
