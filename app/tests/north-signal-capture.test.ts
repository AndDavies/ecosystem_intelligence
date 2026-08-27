import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { northSignalOffer } from "@/lib/north-signal/offer";
import {
  automaticNorthSignalPromptIsSuppressed,
  northSignalDismissalMs,
  pathAllowsAutomaticNorthSignal,
  pathSupportsNorthSignal
} from "@/lib/north-signal/prompt";

describe("North Signal capture", () => {
  it("uses weekly consent with one separately gated optional alert preference", async () => {
    const [signup, turnstile, validation, signupRoute] = await Promise.all([
      readFile(path.resolve("src/components/atlas/north-signal-signup.tsx"), "utf8"),
      readFile(path.resolve("src/components/security/turnstile-field.tsx"), "utf8"),
      readFile(path.resolve("src/lib/product-insights/validation.ts"), "utf8"),
      readFile(path.resolve("src/app/api/beta-signup/route.ts"), "utf8")
    ]);

    expect(northSignalOffer.cta).toBe("Get North Signal");
    expect(signup).toContain("consent: true");
    expect(signup).toContain("signalAlertsAvailable ? <label");
    expect(signup).toContain('fetch("/api/beta-signup"');
    expect(signupRoute).toContain("signalAlertsAreConfigured()");
    expect(signup).toContain('name="signalAlerts" type="checkbox"');
    expect(signup).toContain("Also email me when a new Defence Signal is published.");
    expect(signup).toContain("newsletter_form_start");
    expect(signup).toContain("newsletter_submit");
    expect(signup).toContain("newsletter_error");
    expect(turnstile).toContain('appearance: "interaction-only"');
    expect(turnstile).toContain('size: "flexible"');
    expect(validation).toContain("north-signal-weekly-2026-08-v1");
    expect(validation).toContain("defence-signal-alerts-2026-08-v1");
    expect(signup).toContain(">Email address</label>");
    expect(signup).toContain("northSignalOffer.riskReversal");
    expect(signup).toContain("northSignalOffer.previewLabel");
    expect(signup).toContain('role="status"');
    expect(signup).toContain('role="alert"');
    expect(signup.indexOf("sample_path: previewHref")).toBeLessThan(signup.indexOf("...eventMetadata"));
    expect(signupRoute.indexOf("verifyPublicTurnstileToken")).toBeLessThan(signupRoute.indexOf("record_north_signal_consent"));
  });

  it("prompts automatically only after high-intent behaviour", async () => {
    const [experience, client] = await Promise.all([
      readFile(path.resolve("src/components/atlas/public-beta-experience.tsx"), "utf8"),
      readFile(path.resolve("src/lib/product-insights/client.ts"), "utf8")
    ]);

    expect(experience).toContain("second_profile");
    expect(experience).toContain("ask_result_viewed");
    expect(experience).toContain("evidence_opened");
    expect(experience).toContain("signal_60_percent");
    expect(experience).toContain("newsletter_banner_mobile");
    expect(experience).toContain("onCloseAutoFocus");
    expect(experience).toContain("data-north-signal-mobile-return-focus");
    expect(experience).toContain("takePendingBetaUpdatesOpen");
    expect(client).toContain("__tnmPendingNorthSignalOpen");
    expect(experience).toContain('pathname === "/signals"');
    expect(experience).toContain('pathname === "/north-signal"');
    expect(experience).toContain("[data-north-signal-page-signup]");
    expect(experience).toContain("scrollIntoView");
    expect(experience).toContain('matchMedia("(prefers-reduced-motion: reduce)")');
    expect(experience).toContain("email.focus({ preventScroll: true })");
    expect(experience).toContain("window.requestAnimationFrame(() => window.requestAnimationFrame(() => focusPageSignup()))");
    expect(experience).toContain('if (pathname === "/north-signal")');
    expect(experience).toContain("setUpdatesOpen(false)");
    expect(experience).not.toContain("75_000");
    expect(experience).not.toContain("fallbackTimer");
  });

  it("keeps explicit map signup available without interrupting map work", () => {
    const now = 10_000_000_000;
    expect(pathSupportsNorthSignal("/map")).toBe(true);
    expect(pathAllowsAutomaticNorthSignal("/map")).toBe(false);
    expect(pathSupportsNorthSignal("/north-signal")).toBe(true);
    expect(pathAllowsAutomaticNorthSignal("/north-signal")).toBe(false);
    expect(pathAllowsAutomaticNorthSignal("/signals/example")).toBe(true);
    expect(automaticNorthSignalPromptIsSuppressed({ subscribed: true, dismissedAt: 0, now })).toBe(true);
    expect(automaticNorthSignalPromptIsSuppressed({ subscribed: false, dismissedAt: now - northSignalDismissalMs + 1, now })).toBe(true);
    expect(automaticNorthSignalPromptIsSuppressed({ subscribed: false, dismissedAt: now - northSignalDismissalMs - 1, now })).toBe(false);
  });

  it("places contextual signup surfaces on the highest-intent public pages", async () => {
    const [landing, map, organization, brief, signals, mission, demand, header, footer] = await Promise.all([
      readFile(path.resolve("src/app/page.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/atlas-explorer.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/executive-organization-dossier.tsx"), "utf8"),
      readFile(path.resolve("src/app/briefs/[slug]/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/signals/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/missions/[slug]/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/demand/[slug]/page.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/public-atlas-header.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/public-atlas-footer.tsx"), "utf8")
    ]);

    expect(landing).toContain('placement="newsletter_inline_home"');
    expect(map).toContain('placement="newsletter_inline_map"');
    expect(organization).toContain('placement="newsletter_inline_profile"');
    expect(brief).not.toContain('placement="newsletter_inline_brief"');
    expect(signals).toContain('placement="newsletter_inline_signals"');
    expect(mission).toContain('placement="newsletter_inline_mission"');
    expect(demand).toContain('placement="newsletter_inline_demand"');
    expect(header).toContain("Subscribe to the free newsletter");
    expect(footer).toContain("Subscribe to the free newsletter");
    expect(footer).toContain("About North Signal");
    expect(organization).toContain('placement="newsletter_inline_profile"');
    expect(signals).toContain('placement="newsletter_inline_signals"');
    expect(footer).toContain("trackNorthSignalCtaClick");
  });

  it("keeps subscriber identity out of bounded funnel events", async () => {
    const [signup, originalMigration, acquisitionMigration, ctaMigration, insights, route] = await Promise.all([
      readFile(path.resolve("src/components/atlas/north-signal-signup.tsx"), "utf8"),
      readFile(path.resolve("supabase/migrations/20260730084549_north_signal_capture_funnel.sql"), "utf8"),
      readFile(path.resolve("supabase/migrations/20260810220542_expand_north_signal_acquisition_events.sql"), "utf8"),
      readFile(path.resolve("supabase/migrations/20260813081500_add_newsletter_cta_click_event.sql"), "utf8"),
      readFile(path.resolve("src/app/admin/insights/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/api/beta-signup/route.ts"), "utf8")
    ]);

    const metadataBuilder = signup.slice(signup.indexOf("function eventMetadata"), signup.indexOf("export function NorthSignalSignupForm"));
    expect(metadataBuilder).not.toContain("email");
    expect(originalMigration).toContain("newsletter_impression");
    expect(originalMigration).toContain("newsletter_dismiss");
    expect(originalMigration).toContain("Subscriber email is never stored in event metadata");
    expect(acquisitionMigration).toContain("newsletter_landing_view");
    expect(acquisitionMigration).toContain("newsletter_sample_open");
    expect(acquisitionMigration).toContain("newsletter_success");
    expect(ctaMigration).toContain("newsletter_cta_click");
    expect(route).toContain('rpc("record_north_signal_consent"');
    expect(route).toContain("p_success_event_id");
    expect(route).not.toContain("p_success_metadata: { email");
    expect(route).toContain("utm_medium");
    expect(insights).toContain("North Signal conversion");
    expect(insights).toContain("active consent-backed subscribers");
  });
});
