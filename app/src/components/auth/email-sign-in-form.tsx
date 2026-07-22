"use client";

import Script from "next/script";
import { Mail } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { sendEmailSignInLink } from "@/lib/actions/auth";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";

type TurnstileOptions = {
  sitekey: string;
  theme: "light";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string;
      remove: (widgetId: string) => void;
    };
  }
}

function TurnstileField({
  siteKey,
  onTokenChange
}: {
  siteKey: string;
  onTokenChange: (token: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState("Checking this sign-in request…");

  const renderWidget = useCallback(() => {
    if (!window.turnstile || !containerRef.current || widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: "light",
      callback: (token) => {
        onTokenChange(token);
        setStatus("Sign-in request verified.");
      },
      "expired-callback": () => {
        onTokenChange("");
        setStatus("Verification expired. Complete the check again.");
      },
      "error-callback": () => {
        onTokenChange("");
        setStatus("Verification could not be completed. Refresh and try again.");
      }
    });
  }, [onTokenChange, siteKey]);

  useEffect(() => {
    renderWidget();
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      <div ref={containerRef} className="min-h-9" />
      <p className="text-[11px] leading-5 text-[var(--atlas-muted)]" aria-live="polite">
        {status}
      </p>
    </>
  );
}

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
        <TurnstileField siteKey={turnstileSiteKey} onTokenChange={setCaptchaToken} />
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
