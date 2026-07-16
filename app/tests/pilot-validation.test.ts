import { describe, expect, it } from "vitest";
import { pilotEventSchema, pilotFeedbackSchema, pilotSignupSchema } from "@/lib/pilot/validation";

describe("design-partner preview validation", () => {
  it("normalizes an affirmative update signup", () => {
    const parsed = pilotSignupSchema.parse({
      email: " Test@Example.ca ",
      consent: true,
      consentText: "I agree to receive occasional design-partner preview updates.",
      consentVersion: "preview-2026-07",
      source: "pilot_prompt",
      cohort: "cove-bd-week1",
      landingPath: "/organizations/example",
      website: ""
    });

    expect(parsed.email).toBe("test@example.ca");
    expect(parsed.cohort).toBe("cove-bd-week1");
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
    expect(pilotEventSchema.safeParse({ eventName: "dossier_open", contextPath: "/organizations/example", metadata: {} }).success).toBe(true);
    expect(pilotEventSchema.safeParse({ eventName: "email_address", contextPath: "/", metadata: {} }).success).toBe(false);
  });
});

