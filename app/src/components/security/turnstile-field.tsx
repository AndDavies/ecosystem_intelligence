"use client";

import Script from "next/script";
import { useCallback, useEffect, useId, useRef, useState } from "react";

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
      reset: (widgetId: string) => void;
    };
  }
}

export function TurnstileField({
  siteKey,
  onTokenChange,
  purpose = "request"
}: {
  siteKey: string;
  onTokenChange: (token: string) => void;
  purpose?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const statusId = useId();
  const [status, setStatus] = useState(`Checking this ${purpose}…`);

  const renderWidget = useCallback(() => {
    if (!window.turnstile || !containerRef.current || widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: "light",
      callback: (token) => {
        onTokenChange(token);
        setStatus(`${purpose.charAt(0).toUpperCase()}${purpose.slice(1)} verified.`);
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
  }, [onTokenChange, purpose, siteKey]);

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
    <div aria-describedby={statusId}>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      <div ref={containerRef} className="min-h-9" />
      <p id={statusId} className="text-[11px] leading-5 text-[var(--atlas-muted)]" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
