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

describe("design-partner preview validation", () => {
  it("normalizes an affirmative update signup", () => {
    const parsed = pilotSignupSchema.parse({
      email: " Test@Example.ca ",
      consent: true,
      consentText: "I agree to receive occasional design-partner preview updates.",
      consentVersion: "preview-2026-07",
      source: "pilot_prompt",
      cohort: "cove-bd-week1",
      sessionId,
      searchId,
      landingPath: "/organizations/example",
      website: ""
    });

    expect(parsed.email).toBe("test@example.ca");
    expect(parsed.cohort).toBe("cove-bd-week1");
    expect(parsed.sessionId).toBe(sessionId);
  });

  it("rejects update capture without affirmative consent", () => {
    const parsed = pilotSignupSchema.safeParse({
      email: "test@example.ca",
      consent: false,
      consentText: "I agree to receive occasional design-partner preview updates.",
      consentVersion: "preview-2026-07",
      source: "pilot_prompt",
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

  it("accepts only the bounded preview event vocabulary", () => {
    expect(pilotEventSchema.safeParse({ eventName: "page_view", contextPath: "/organizations/example", sessionId, searchId, metadata: {} }).success).toBe(true);
    expect(pilotEventSchema.safeParse({ eventName: "result_select", contextPath: "/", metadata: {} }).success).toBe(true);
    expect(pilotEventSchema.safeParse({ eventName: "email_address", contextPath: "/", metadata: {} }).success).toBe(false);
  });

  it("accepts a bounded private search context and normalizes spacing", () => {
    const parsed = pilotDiscoveryRequestSchema.parse({
      query: "  Halifax   underwater  ",
      contextPath: "/",
      cohort: "cove-bd-week1",
      sessionId
    });

    expect(parsed.query).toBe("Halifax   underwater");
    expect(normalizePilotSearchQuery(parsed.query)).toBe("halifax underwater");
  });
});
