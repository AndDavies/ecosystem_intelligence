import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import {
  betaDiscoveryRequestSchema,
  betaEventSchema,
  betaFeedbackSchema,
  betaSignupSchema,
  northSignalConsentText,
  northSignalConsentVersion
} from "@/lib/product-insights/validation";
import { normalizeBetaSearchQuery, serverEntryChannel, serverTrafficClass } from "@/lib/product-insights/server";

const sessionId = "66db055d-21d0-4a91-9601-c73bfbf950fa";
const searchId = "d711860e-8597-45db-9e8d-6c18ea913850";
const eventId = "14193f8e-a587-4d8b-b799-fd9d17df8bf0";
const occurredAt = "2026-08-26T12:00:00.000Z";
const eventContract = { eventId, occurredAt };
const signupContract = { successEventId: eventId, occurredAt };

describe("public-beta validation", () => {
  it("normalizes an affirmative update signup", () => {
    const parsed = betaSignupSchema.parse({
      email: " Test@Example.ca ",
      consent: true,
      consentText: northSignalConsentText,
      consentVersion: northSignalConsentVersion,
      source: "newsletter_inline_profile",
      cohort: "launch-week",
      deviceClass: "desktop",
      contentType: "organization_profile",
      utmSource: "partner",
      utmMedium: "referral",
      utmContent: "sample-partner",
      sessionId,
      searchId,
      ...signupContract,
      landingPath: "/organizations/example",
      website: ""
    });

    expect(parsed.email).toBe("test@example.ca");
    expect(parsed.cohort).toBe("launch-week");
    expect(parsed.sessionId).toBe(sessionId);
    expect(parsed.deviceClass).toBe("desktop");
    expect(parsed.utmMedium).toBe("referral");
  });

  it("rejects update capture without affirmative consent", () => {
    const parsed = betaSignupSchema.safeParse({
      email: "test@example.ca",
      consent: false,
      consentText: northSignalConsentText,
      consentVersion: northSignalConsentVersion,
      source: "newsletter_modal_desktop",
      landingPath: "/"
    });
    expect(parsed.success).toBe(false);
  });

  it("keeps feedback paths relative and contact details optional", () => {
    const parsed = betaFeedbackSchema.parse({
      goal: "Find relevant suppliers",
      worked: "Evidence was clear",
      missing: "Comparison workflow",
      contactEmail: "",
      contextPath: "/organizations/example",
      cohort: "",
      website: ""
    });
    expect(parsed.contactEmail).toBeNull();
    expect(parsed.cohort).toBeNull();
  });

  it("accepts only meaningful public-beta workflow events", () => {
    expect(betaEventSchema.safeParse({ ...eventContract, eventName: "page_view", contextPath: "/organizations/example", sessionId, searchId, metadata: {} }).success).toBe(false);
    expect(betaEventSchema.safeParse({ ...eventContract, eventName: "result_select", contextPath: "/", metadata: {} }).success).toBe(true);
    expect(betaEventSchema.safeParse({ ...eventContract, eventName: "connection", contextPath: "/connect/example", metadata: {} }).success).toBe(true);
    expect(betaEventSchema.safeParse({ ...eventContract, eventName: "share", contextPath: "/briefs/example", metadata: { method: "linkedin" } }).success).toBe(true);
    expect(betaEventSchema.safeParse({ ...eventContract, eventName: "newsletter_impression", contextPath: "/organizations/example", metadata: { placement: "newsletter_inline_profile", device_class: "desktop" } }).success).toBe(true);
    expect(betaEventSchema.safeParse({ ...eventContract, eventName: "newsletter_error", contextPath: "/", metadata: { placement: "newsletter_modal_desktop", error_class: "network_error" } }).success).toBe(true);
    expect(betaEventSchema.safeParse({ ...eventContract, eventName: "newsletter_landing_view", contextPath: "/north-signal", metadata: { placement: "newsletter_page" } }).success).toBe(true);
    expect(betaEventSchema.safeParse({ ...eventContract, eventName: "newsletter_cta_click", contextPath: "/signals/example", metadata: { placement: "newsletter_inline_signals", source_path: "/signals/example", destination_path: "/north-signal" } }).success).toBe(true);
    expect(betaEventSchema.safeParse({ ...eventContract, eventName: "newsletter_sample_open", contextPath: "/north-signal", metadata: { sample_path: "/signals/example" } }).success).toBe(true);
    expect(betaEventSchema.safeParse({ ...eventContract, eventName: "newsletter_success", contextPath: "/north-signal", metadata: { placement: "newsletter_page" } }).success).toBe(true);
    expect(betaEventSchema.safeParse({ ...eventContract, eventName: "email_address", contextPath: "/", metadata: {} }).success).toBe(false);
  });

  it("keeps dossier engagement actions enumerated and metadata free of narrative or contact data", () => {
    const base = {
      eventName: "profile_engagement" as const,
      contextPath: "/organizations/sample",
      ...eventContract,
      metadata: {
        action: "mission_open",
        organization_id: "organization-one",
        target_id: "mission-one",
        target_type: "mission_area",
        section: "connections",
        template_version: "organization_editorial_profile_v1"
      }
    };
    expect(betaEventSchema.safeParse(base).success).toBe(true);
    expect(betaEventSchema.safeParse({ ...base, metadata: { ...base.metadata, release_source: "newsletter/email" } }).success).toBe(true);
    expect(betaEventSchema.safeParse({ ...base, metadata: { ...base.metadata, action: "scroll_anywhere" } }).success).toBe(false);
    expect(betaEventSchema.safeParse({ ...base, metadata: { ...base.metadata, narrative: "Sensitive dossier prose" } }).success).toBe(false);
    expect(betaEventSchema.safeParse({ ...base, metadata: { ...base.metadata, email: "person@example.ca" } }).success).toBe(false);
  });

  it("accepts only the current North Signal consent and known placements", () => {
    const base = {
      email: "test@example.ca",
      consent: true as const,
      consentText: northSignalConsentText,
      consentVersion: northSignalConsentVersion,
      source: "newsletter_header" as const,
      ...signupContract,
      landingPath: "/"
    };
    expect(betaSignupSchema.safeParse(base).success).toBe(true);
    expect(betaSignupSchema.safeParse({ ...base, source: "newsletter_page" }).success).toBe(true);
    expect(betaSignupSchema.safeParse({ ...base, source: "newsletter_inline_signals" }).success).toBe(true);
    expect(betaSignupSchema.safeParse({ ...base, source: "newsletter_inline_mission" }).success).toBe(true);
    expect(betaSignupSchema.safeParse({ ...base, source: "newsletter_inline_demand" }).success).toBe(true);
    expect(betaSignupSchema.safeParse({ ...base, source: "updates_dialog" }).success).toBe(false);
    expect(betaSignupSchema.safeParse({ ...base, consentText: "Generic updates consent." }).success).toBe(false);
  });

  it("accepts a bounded private search context and normalizes spacing", () => {
    const parsed = betaDiscoveryRequestSchema.parse({
      query: "  Halifax   underwater  ",
      contextPath: "/",
      cohort: "launch-week",
      sessionId
    });

    expect(parsed.query).toBe("Halifax   underwater");
    expect(normalizeBetaSearchQuery(parsed.query)).toBe("halifax underwater");
  });

  it("accepts a browser request without a campaign cohort", () => {
    const parsed = betaDiscoveryRequestSchema.parse({
      query: "Halifax",
      contextPath: "/",
      cohort: null,
      sessionId: null
    });

    expect(parsed.cohort).toBeNull();
    expect(parsed.sessionId).toBeNull();
  });

  it("keeps assistant follow-up context temporary and bounded", () => {
    expect(betaDiscoveryRequestSchema.safeParse({
      query: "Which of those are in Ontario?",
      contextPath: "/",
      priorTurns: Array.from({ length: 3 }, (_, index) => ({ query: `Question ${index}`, organizationIds: [String(index)] }))
    }).success).toBe(true);
    expect(betaDiscoveryRequestSchema.safeParse({
      query: "Which of those are in Ontario?",
      contextPath: "/",
      priorTurns: Array.from({ length: 4 }, (_, index) => ({ query: `Question ${index}`, organizationIds: [String(index)] }))
    }).success).toBe(false);
  });

  it("rejects query, referrer and personal data while deriving server-side traffic classes", () => {
    expect(betaEventSchema.safeParse({ ...eventContract, eventName: "newsletter_cta_click", contextPath: "/signals?utm_source=google", metadata: {} }).success).toBe(false);
    expect(betaEventSchema.safeParse({ ...eventContract, eventName: "newsletter_cta_click", contextPath: "/signals/example", metadata: { source_path: "/signals/example?secret=value" } }).success).toBe(false);
    expect(betaEventSchema.safeParse({ ...eventContract, eventName: "share", contextPath: "/signals/example", metadata: { content_title: "person@example.ca" } }).success).toBe(false);

    const production = new Request("https://truenorthmap.ca/signals", { headers: { host: "truenorthmap.ca" } });
    const preview = new Request("https://preview.example/signals", { headers: { host: "preview.example" } });
    expect(serverTrafficClass(production)).toBe("production");
    expect(serverTrafficClass(production, true)).toBe("staff");
    expect(serverTrafficClass(preview)).toBe("qa");
    expect(serverEntryChannel(new Request("https://truenorthmap.ca/signals", { headers: { referer: "https://accounts.google.com/" } }), {})).toBe("authentication_service");
    expect(serverEntryChannel(new Request("https://truenorthmap.ca/signals", { headers: { referer: "https://www.google.ca/search" } }), {})).toBe("organic_google");
  });
});
