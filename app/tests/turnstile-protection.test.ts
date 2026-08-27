import { describe, expect, it } from "vitest";
import { betaFeedbackSchema, betaSignupSchema, northSignalConsentText, northSignalConsentVersion } from "@/lib/product-insights/validation";
import { contactMessageSchema } from "@/lib/beta/validation";

describe("public form Turnstile contracts", () => {
  const signupContract = {
    successEventId: "14193f8e-a587-4d8b-b799-fd9d17df8bf0",
    occurredAt: "2026-08-26T12:00:00.000Z"
  };

  it("retains the challenge token on every protected public payload", () => {
    expect(betaSignupSchema.parse({
      email: "person@example.ca",
      consent: true,
      consentText: northSignalConsentText,
      consentVersion: northSignalConsentVersion,
      source: "newsletter_inline_home",
      landingPath: "/",
      ...signupContract,
      captchaToken: "signup-token"
    }).captchaToken).toBe("signup-token");

    expect(betaFeedbackSchema.parse({
      goal: "Find a supplier",
      missing: "More evidence",
      contextPath: "/organizations",
      captchaToken: "feedback-token"
    }).captchaToken).toBe("feedback-token");

    expect(contactMessageSchema.parse({
      category: "general",
      senderName: "Test User",
      senderEmail: "person@example.ca",
      message: "I would like to ask about the public map.",
      captchaToken: "contact-token"
    }).captchaToken).toBe("contact-token");
  });

  it("keeps tokens optional at schema level so honeypot requests remain safely disposable", () => {
    expect(betaSignupSchema.parse({
      email: "person@example.ca",
      consent: true,
      consentText: northSignalConsentText,
      consentVersion: northSignalConsentVersion,
      source: "newsletter_inline_home",
      landingPath: "/",
      ...signupContract
    }).captchaToken).toBe("");
    expect(betaFeedbackSchema.parse({ goal: "Find a supplier", missing: "More evidence", contextPath: "/organizations" }).captchaToken).toBe("");
    expect(contactMessageSchema.shape.captchaToken.parse(undefined)).toBe("");
  });
});
