import { describe, expect, it } from "vitest";
import {
  pilotDiscoveryRequestSchema,
  pilotEventSchema,
  pilotFeedbackSchema,
  pilotSignupSchema
} from "@/lib/pilot/validation";
import { normalizePilotSearchQuery } from "@/lib/pilot/server";

const sessionId = "66db055d-21d0-4a91-9601-c73bfbf950fa";
const searchId = "d711860e-8597-45db-9e8d-6c18ea913850";

describe("public-beta validation", () => {
  it("normalizes an affirmative update signup", () => {
    const parsed = pilotSignupSchema.parse({
      email: " Test@Example.ca ",
      consent: true,
      consentText: "I agree to receive occasional Ecosystem Intelligence public-beta updates.",
      consentVersion: "public-beta-2026-07",
      source: "public_beta_prompt",
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
    const parsed = pilotSignupSchema.safeParse({
      email: "test@example.ca",
      consent: false,
      consentText: "I agree to receive occasional Ecosystem Intelligence public-beta updates.",
      consentVersion: "public-beta-2026-07",
      source: "public_beta_prompt",
      landingPath: "/"
    });
    expect(parsed.success).toBe(false);
  });

  it("keeps feedback paths relative and contact details optional", () => {
    const parsed = pilotFeedbackSchema.parse({
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
    expect(pilotEventSchema.safeParse({ eventName: "page_view", contextPath: "/organizations/example", sessionId, searchId, metadata: {} }).success).toBe(false);
    expect(pilotEventSchema.safeParse({ eventName: "result_select", contextPath: "/", metadata: {} }).success).toBe(true);
    expect(pilotEventSchema.safeParse({ eventName: "connection", contextPath: "/connect/example", metadata: {} }).success).toBe(true);
    expect(pilotEventSchema.safeParse({ eventName: "email_address", contextPath: "/", metadata: {} }).success).toBe(false);
  });

  it("accepts a bounded private search context and normalizes spacing", () => {
    const parsed = pilotDiscoveryRequestSchema.parse({
      query: "  Halifax   underwater  ",
      contextPath: "/",
      cohort: "launch-week",
      sessionId
    });

    expect(parsed.query).toBe("Halifax   underwater");
    expect(normalizePilotSearchQuery(parsed.query)).toBe("halifax underwater");
  });

  it("accepts a browser request without a campaign cohort", () => {
    const parsed = pilotDiscoveryRequestSchema.parse({
      query: "Halifax",
      contextPath: "/",
      cohort: null,
      sessionId: null
    });

    expect(parsed.cohort).toBeNull();
    expect(parsed.sessionId).toBeNull();
  });
});
