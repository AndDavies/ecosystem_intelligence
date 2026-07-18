"use client";

import Link from "next/link";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  analyticsConsentStorageKey,
  analyticsPreferencesEvent,
  isAnalyticsEligiblePath,
  openAnalyticsPreferences,
  type AnalyticsConsent
} from "@/lib/analytics-consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

function clearGoogleAnalyticsCookies() {
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0]?.trim();
    if (!name?.startsWith("_ga")) return;
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; path=/; domain=.${window.location.hostname}; SameSite=Lax`;
  });
}

function GoogleAnalytics() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<AnalyticsConsent>("unknown");
  const eligible = isAnalyticsEligiblePath(pathname);

  useEffect(() => {
    const stored = window.localStorage.getItem(analyticsConsentStorageKey);
    if (stored === "accepted" || stored === "declined") setConsent(stored);

    const openPreferences = () => setConsent("unknown");
    window.addEventListener(analyticsPreferencesEvent, openPreferences);
    return () => window.removeEventListener(analyticsPreferencesEvent, openPreferences);
  }, []);

  useEffect(() => {
    if (!measurementId || consent !== "accepted" || !eligible) return;
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = window.gtag ?? function gtag() {
      window.dataLayer?.push(arguments);
    };
    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      send_page_view: false
    });
  }, [consent, eligible]);

  useEffect(() => {
    if (!measurementId || consent !== "accepted" || !eligible || !window.gtag) return;
    window.gtag("event", "page_view", {
      page_location: `${window.location.origin}${pathname}`,
      page_path: pathname,
      page_title: document.title
    });
  }, [consent, eligible, pathname]);

  const choose = (choice: Exclude<AnalyticsConsent, "unknown">) => {
    window.localStorage.setItem(analyticsConsentStorageKey, choice);
    if (choice === "declined") {
      window.gtag?.("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied"
      });
      clearGoogleAnalyticsCookies();
    }
    setConsent(choice);
  };

  return (
    <>
      {measurementId && consent === "accepted" && eligible ? (
        <Script
          id="true-north-map-google-analytics"
          src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
          strategy="afterInteractive"
        />
      ) : null}
      {measurementId && consent === "unknown" && eligible ? (
        <aside
          aria-label="Analytics choice"
          className="fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-2xl rounded-3xl border border-[var(--atlas-border)] bg-white/95 p-4 shadow-[0_22px_70px_rgba(15,31,46,0.18)] backdrop-blur sm:p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-[var(--atlas-ink-soft)]">
              Help improve True North Map with privacy-conscious Google Analytics. It is optional, excludes private workflows, and is never used for advertising. <Link href="/privacy" className="font-semibold text-[var(--atlas-primary)] underline">Privacy details</Link>
            </p>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => choose("declined")} className="atlas-secondary-button px-4 py-2 text-xs">No thanks</button>
              <button type="button" onClick={() => choose("accepted")} className="atlas-primary-button px-4 py-2 text-xs">Allow analytics</button>
            </div>
          </div>
        </aside>
      ) : null}
    </>
  );
}

export function AnalyticsPreferencesButton({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={openAnalyticsPreferences} className={className}>
      Analytics preferences
    </button>
  );
}

export function PublicBetaInsights() {
  return (
    <>
      <Analytics
        beforeSend={(event: BeforeSendEvent) => {
          if (event.url.includes("/admin") || event.url.includes("/review")) return null;
          const url = new URL(event.url);
          url.search = "";
          url.hash = "";
          return { ...event, url: url.toString() };
        }}
      />
      <SpeedInsights sampleRate={0.5} />
      <GoogleAnalytics />
    </>
  );
}
