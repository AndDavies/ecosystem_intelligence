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
import { normalizeBetaSearchQuery } from "@/lib/product-insights/server";

const sessionId = "66db055d-21d0-4a91-9601-c73bfbf950fa";
const searchId = "d711860e-8597-45db-9e8d-6c18ea913850";

describe("public-beta validation", () => {
  it("normalizes an affirmative update signup", () => {
    const parsed = betaSignupSchema.parse({
      email: " Test@Example.ca ",
      consent: true,
      consentText: northSignalConsentText,
      consentVersion: northSignalConsentVersion,
      source: "newsletter_inline_profile",
      cohort: "launch-week",
      sessionId,
      searchId,
      landingPath: "/organizations/example",
      website: ""
    });

    expect(parsed.email).toBe("test@example.ca");
    expect(parsed.cohort).toBe("launch-week");
    expect(parsed.sessionId).toBe(sessionId);
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
    expect(betaEventSchema.safeParse({ eventName: "page_view", contextPath: "/organizations/example", sessionId, searchId, metadata: {} }).success).toBe(false);
    expect(betaEventSchema.safeParse({ eventName: "result_select", contextPath: "/", metadata: {} }).success).toBe(true);
    expect(betaEventSchema.safeParse({ eventName: "connection", contextPath: "/connect/example", metadata: {} }).success).toBe(true);
    expect(betaEventSchema.safeParse({ eventName: "share", contextPath: "/briefs/example", metadata: { method: "linkedin" } }).success).toBe(true);
    expect(betaEventSchema.safeParse({ eventName: "newsletter_impression", contextPath: "/organizations/example", metadata: { placement: "newsletter_inline_profile", device_class: "desktop" } }).success).toBe(true);
    expect(betaEventSchema.safeParse({ eventName: "newsletter_error", contextPath: "/", metadata: { placement: "newsletter_modal_desktop", error_class: "network_error" } }).success).toBe(true);
    expect(betaEventSchema.safeParse({ eventName: "email_address", contextPath: "/", metadata: {} }).success).toBe(false);
  });

  it("keeps dossier engagement actions enumerated and metadata free of narrative or contact data", () => {
    const base = {
      eventName: "profile_engagement" as const,
      contextPath: "/organizations/sample",
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
      landingPath: "/"
    };
    expect(betaSignupSchema.safeParse(base).success).toBe(true);
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
});
