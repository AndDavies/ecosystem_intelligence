import { describe, expect, it } from "vitest";
import { isAnalyticsEligiblePath } from "@/lib/analytics-consent";

describe("isAnalyticsEligiblePath", () => {
  it("allows public discovery and governance pages", () => {
    expect(isAnalyticsEligiblePath("/")).toBe(true);
    expect(isAnalyticsEligiblePath("/organizations/acme")).toBe(true);
    expect(isAnalyticsEligiblePath("/methodology")).toBe(true);
  });

  it("excludes private and administrative workflows", () => {
    expect(isAnalyticsEligiblePath("/admin")).toBe(false);
    expect(isAnalyticsEligiblePath("/admin/insights")).toBe(false);
    expect(isAnalyticsEligiblePath("/account")).toBe(false);
    expect(isAnalyticsEligiblePath("/collections/123")).toBe(false);
    expect(isAnalyticsEligiblePath("/sign-in")).toBe(false);
  });
});
