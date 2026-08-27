"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { BarChart3, Check, MousePointer2, Settings2, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  analyticsConsentUpdatedEvent,
  analyticsPreferences,
  analyticsPreferencesEvent,
  isAnalyticsEligiblePath,
  openAnalyticsPreferences,
  readAnalyticsPreferences,
  sanitizeAnalyticsUrl,
  writeAnalyticsPreferences,
  type AnalyticsPreferences
} from "@/lib/analytics-consent";
import { currentReleaseAttribution } from "@/lib/product-insights/client";

declare global {
  interface Window {
    clarity?: ((...args: unknown[]) => void) & { q?: IArguments[] };
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
const clarityProjectId = process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_ID;
const landingEntryPaths = new Set(["need", "public_need", "mission", "map", "example", "brief", "signals", "north_signal"]);

export function publicContentType(pathname: string) {
  if (/^\/briefs\/[^/]+$/.test(pathname)) return "brief";
  if (/^\/organizations\/[^/]+$/.test(pathname)) return "organization_profile";
  if (/^\/capabilities\/[^/]+$/.test(pathname)) return "capability_profile";
  if (/^\/demand\/[^/]+$/.test(pathname)) return "demand_profile";
  if (/^\/missions\/[^/]+$/.test(pathname)) return "mission_profile";
  if (/^\/regions\/[^/]+$/.test(pathname)) return "region";
  if (["/briefs", "/organizations", "/regions", "/demand", "/methodology", "/how-it-works"].includes(pathname)) return "discovery_hub";
  return null;
}

export function organicSearchEngine(referrer: string) {
  try {
    const hostname = new URL(referrer).hostname.toLowerCase();
    if (hostname === "accounts.google.com") return null;
    if (hostname === "google.com" || hostname.endsWith(".google.com") || /^www\.google\.[a-z.]+$/.test(hostname)) return "google";
    if (/^(?:www\.)?bing\./.test(hostname)) return "bing";
    if (/^(?:www\.)?duckduckgo\./.test(hostname)) return "duckduckgo";
  } catch {
    // A malformed or missing referrer simply is not an attributable organic entry.
  }
  return null;
}

function clearAnalyticsCookies() {
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0]?.trim();
    if (!name || (!name.startsWith("_ga") && name !== "_clck" && name !== "_clsk")) return;
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; path=/; domain=.${window.location.hostname}; SameSite=Lax`;
  });
}

function useAnalyticsPreferences() {
  const [preferences, setPreferences] = useState<AnalyticsPreferences | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);

  useEffect(() => {
    const stored = readAnalyticsPreferences(window.localStorage);
    setPreferences(stored);
    setNoticeOpen(!stored && Boolean(measurementId));

    const open = () => {
      setNoticeOpen(false);
      setPreferencesOpen(true);
    };
    window.addEventListener(analyticsPreferencesEvent, open);
    return () => window.removeEventListener(analyticsPreferencesEvent, open);
  }, []);

  const save = (next: AnalyticsPreferences) => {
    const shouldUnloadClarity = Boolean(preferences?.experienceDiagnostics && !next.experienceDiagnostics);
    writeAnalyticsPreferences(window.localStorage, next);
    setPreferences(next);
    setNoticeOpen(false);
    setPreferencesOpen(false);
    window.dispatchEvent(new CustomEvent(analyticsConsentUpdatedEvent, { detail: next }));
    if (shouldUnloadClarity) window.setTimeout(() => window.location.reload(), 0);
  };

  const changePreferencesOpen = (next: boolean) => {
    setPreferencesOpen(next);
    if (!next && !preferences) setNoticeOpen(Boolean(measurementId));
  };

  return { preferences, preferencesOpen, noticeOpen, changePreferencesOpen, save };
}

function GoogleAnalytics({ preferences }: { preferences: AnalyticsPreferences | null }) {
  const pathname = usePathname();
  const eligible = isAnalyticsEligiblePath(pathname);
  const [productionHost, setProductionHost] = useState(false);
  useEffect(() => {
    setProductionHost(["truenorthmap.ca", "www.truenorthmap.ca"].includes(window.location.hostname));
  }, []);
  const enabled = Boolean(measurementId && preferences?.productAnalytics && eligible && productionHost);

  useEffect(() => {
    if (!measurementId || !enabled) return;
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = window.gtag ?? function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
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
  }, [enabled]);

  useEffect(() => {
    if (!measurementId || !enabled || !window.gtag) return;
    const attribution = currentReleaseAttribution();
    window.gtag("event", "page_view", {
      page_location: `${window.location.origin}${pathname}`,
      page_path: pathname,
      page_title: document.title,
      ...(attribution?.source ? { campaign_source: attribution.source } : {}),
      ...(attribution?.medium ? { campaign_medium: attribution.medium } : {}),
      ...(attribution?.campaign ? { campaign_name: attribution.campaign } : {}),
      ...(attribution?.content ? { campaign_content: attribution.content } : {})
    });
    const type = publicContentType(pathname);
    if (type) window.gtag("event", "tnm_content_view", { content_type: type });

    const entryKey = "tnm-analytics-organic-entry-v1";
    const searchEngine = organicSearchEngine(document.referrer);
    if (searchEngine && !window.sessionStorage.getItem(entryKey)) {
      window.gtag("event", "tnm_organic_entry", { search_engine: searchEngine });
      window.sessionStorage.setItem(entryKey, "1");
    }
  }, [enabled, pathname]);

  useEffect(() => {
    if (!measurementId || !enabled) return;
    const onLandingEntry = (event: Event) => {
      const entryPath = (event as CustomEvent<{ entryPath?: string }>).detail?.entryPath;
      if (!entryPath || !landingEntryPaths.has(entryPath)) return;
      window.gtag?.("event", "tnm_landing_entry", { entry_path: entryPath });
    };
    window.addEventListener("tnm:landing-entry", onLandingEntry);
    return () => window.removeEventListener("tnm:landing-entry", onLandingEntry);
  }, [enabled]);

  useEffect(() => {
    if (!measurementId || !enabled || !window.gtag) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a");
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      if (link.target === "_blank" && /^https?:\/\//i.test(href)) {
        window.gtag?.("event", "tnm_external_source_open", { content_type: publicContentType(pathname) ?? "other_public_page" });
      }
      if (href.startsWith("/collections")) {
        window.gtag?.("event", "tnm_working_list_intent", { content_type: publicContentType(pathname) ?? "other_public_page" });
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [enabled, pathname]);

  useEffect(() => {
    if (preferences?.productAnalytics === false) {
      window.gtag?.("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied"
      });
      clearAnalyticsCookies();
    }
  }, [preferences?.productAnalytics]);

  return enabled ? (
    <Script
      id="true-north-map-google-analytics"
      src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      strategy="afterInteractive"
    />
  ) : null;
}

function MicrosoftClarity({ preferences }: { preferences: AnalyticsPreferences | null }) {
  const pathname = usePathname();
  const eligible = isAnalyticsEligiblePath(pathname);
  const enabled = Boolean(clarityProjectId && preferences?.experienceDiagnostics && eligible);

  useEffect(() => {
    if (!clarityProjectId || !window.clarity) return;
    if (enabled) {
      window.clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" });
      window.clarity("set", "page_type", publicContentType(pathname) ?? "other_public_page");
    } else {
      window.clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "denied" });
      clearAnalyticsCookies();
    }
  }, [enabled, pathname]);

  if (!enabled) return null;

  return (
    <Script id="true-north-map-microsoft-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityProjectId}");window.clarity("consentv2",{ad_Storage:"denied",analytics_Storage:"granted"});`}
    </Script>
  );
}

function AnalyticsPreferencesDialog({
  open,
  preferences,
  onOpenChange,
  onSave
}: {
  open: boolean;
  preferences: AnalyticsPreferences | null;
  onOpenChange: (open: boolean) => void;
  onSave: (preferences: AnalyticsPreferences) => void;
}) {
  const [customizing, setCustomizing] = useState(false);
  const [productAnalytics, setProductAnalytics] = useState(preferences?.productAnalytics ?? false);
  const [experienceDiagnostics, setExperienceDiagnostics] = useState(preferences?.experienceDiagnostics ?? false);

  useEffect(() => {
    if (!open) return;
    setCustomizing(false);
    setProductAnalytics(preferences?.productAnalytics ?? false);
    setExperienceDiagnostics(preferences?.experienceDiagnostics ?? false);
  }, [open, preferences]);

  const save = (product: boolean, experience: boolean) => onSave(analyticsPreferences(product, experience));

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1400] bg-[var(--atlas-ink)]/45 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby="analytics-preferences-description"
          className="fixed bottom-0 left-1/2 z-[1401] max-h-[94vh] w-full -translate-x-1/2 overflow-y-auto rounded-t-[1.75rem] border border-[var(--atlas-border)] bg-white p-5 shadow-[var(--atlas-shadow-float)] outline-none sm:bottom-auto sm:top-1/2 sm:max-w-xl sm:-translate-y-1/2 sm:rounded-[1.75rem] sm:p-7"
        >
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]"><ShieldCheck className="size-5" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <p className="atlas-eyebrow">Your privacy choices</p>
              <Dialog.Title className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-[var(--atlas-ink)]">Help improve True North Map</Dialog.Title>
            </div>
            <Dialog.Close asChild><button type="button" className="flex size-9 items-center justify-center rounded-xl text-[var(--atlas-muted)] hover:bg-[var(--atlas-surface-muted)]" aria-label="Close analytics preferences"><X className="size-4" /></button></Dialog.Close>
          </div>
          <Dialog.Description id="analytics-preferences-description" className="mt-4 text-sm leading-6 text-[var(--atlas-muted)]">
            Optional analytics help identify useful pages, broken journeys, and confusing interactions. Private account and administration routes are always excluded. Nothing is used for advertising.
          </Dialog.Description>

          {customizing ? (
            <div className="mt-5 space-y-3">
              {measurementId ? <PreferenceRow icon={BarChart3} title="Product analytics" detail="Google Analytics records sanitized public-page visits and broad interaction patterns. Search parameters and private workflows are excluded." checked={productAnalytics} onChange={setProductAnalytics} /> : null}
              {clarityProjectId ? <PreferenceRow icon={MousePointer2} title="Experience diagnostics" detail="Microsoft Clarity provides masked heatmaps and session replays so layout and usability issues can be understood. Form content is explicitly masked." checked={experienceDiagnostics} onChange={setExperienceDiagnostics} /> : null}
              <button type="button" onClick={() => save(productAnalytics, experienceDiagnostics)} className="atlas-primary-button mt-2 h-11 w-full px-5 text-sm">Save choices</button>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] p-4 text-xs leading-5 text-[var(--atlas-muted)]">
              <div className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-[var(--atlas-primary)]" /><p>Essential site functions, security, consent records, and aggregate performance monitoring remain active.</p></div>
              <div className="mt-3 flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-[var(--atlas-primary)]" /><p>Optional analytics load only after you allow them and can be changed later from the footer or privacy page.</p></div>
            </div>
          )}

          {!customizing ? <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <button type="button" onClick={() => save(false, false)} className="atlas-secondary-button h-11 px-4 text-xs">Essential only</button>
            <button type="button" onClick={() => setCustomizing(true)} className="atlas-secondary-button h-11 gap-2 px-4 text-xs"><Settings2 className="size-4" />Choose</button>
            <button type="button" onClick={() => save(Boolean(measurementId), Boolean(clarityProjectId))} className="atlas-primary-button h-11 px-4 text-xs">Allow optional analytics</button>
          </div> : null}
          <p className="mt-4 text-[11px] leading-5 text-[var(--atlas-muted)]">Read the <Link href="/privacy" className="font-semibold text-[var(--atlas-primary)] underline">privacy policy</Link> for providers, retention, and your choices.</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function AnalyticsConsentNotice({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  return (
    <aside
      aria-label="Analytics choice"
      className="fixed inset-x-3 bottom-3 z-[1390] mx-auto max-w-3xl rounded-2xl border border-[var(--atlas-border)] bg-white/95 px-4 py-3 shadow-[0_12px_32px_rgba(36,40,39,0.16)] backdrop-blur sm:bottom-5 sm:flex sm:items-center sm:gap-5 sm:px-5"
    >
      <p className="min-w-0 flex-1 text-xs leading-5 text-[var(--atlas-muted)]">
        <strong className="text-[var(--atlas-ink)]">Help us improve the map.</strong>{" "}
        Optional analytics show which public pages and journeys are useful. No advertising profiles or private workflows.{" "}
        <Link href="/privacy" className="font-semibold text-[var(--atlas-ink)] underline underline-offset-2">Privacy</Link>
      </p>
      <div className="mt-3 flex shrink-0 items-center justify-end gap-3 sm:mt-0">
        <button type="button" onClick={onDecline} className="px-2 py-2 text-xs font-semibold text-[var(--atlas-muted)] hover:text-[var(--atlas-ink)]">No thanks</button>
        <button type="button" onClick={onAccept} className="atlas-primary-button h-10 px-4 text-xs">Accept analytics</button>
      </div>
    </aside>
  );
}

function PreferenceRow({ icon: Icon, title, detail, checked, onChange }: { icon: typeof BarChart3; title: string; detail: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-2xl border border-[var(--atlas-border)] p-4 hover:border-[var(--atlas-primary-border)]">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]"><Icon className="size-4" aria-hidden="true" /></span>
      <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[var(--atlas-ink)]">{title}</span><span className="mt-1 block text-xs leading-5 text-[var(--atlas-muted)]">{detail}</span></span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 size-4 shrink-0 accent-[var(--atlas-primary)]" />
    </label>
  );
}

export function AnalyticsPreferencesButton({ className = "" }: { className?: string }) {
  return <button type="button" onClick={openAnalyticsPreferences} className={className}>Analytics preferences</button>;
}

export function PublicBetaInsights() {
  const pathname = usePathname();
  const eligible = isAnalyticsEligiblePath(pathname);
  const { preferences, preferencesOpen, noticeOpen, changePreferencesOpen, save } = useAnalyticsPreferences();

  return (
    <>
      {eligible ? <Analytics beforeSend={(event: BeforeSendEvent) => {
        const url = sanitizeAnalyticsUrl(event.url);
        return url ? { ...event, url } : null;
      }} /> : null}
      {eligible ? <SpeedInsights sampleRate={0.5} /> : null}
      <GoogleAnalytics preferences={preferences} />
      <MicrosoftClarity preferences={preferences} />
      {eligible && noticeOpen ? <AnalyticsConsentNotice onAccept={() => save(analyticsPreferences(Boolean(measurementId), false))} onDecline={() => save(analyticsPreferences(false, false))} /> : null}
      {eligible && (measurementId || clarityProjectId) ? <AnalyticsPreferencesDialog open={preferencesOpen} preferences={preferences} onOpenChange={changePreferencesOpen} onSave={save} /> : null}
    </>
  );
}
