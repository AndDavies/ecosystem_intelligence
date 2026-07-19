import { describe, expect, it } from "vitest";
import { isAnalyticsEligiblePath, sanitizeAnalyticsUrl } from "@/lib/analytics-consent";

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
    expect(isAnalyticsEligiblePath("/connect/acme")).toBe(false);
    expect(isAnalyticsEligiblePath("/sign-in")).toBe(false);
    expect(isAnalyticsEligiblePath("/submit")).toBe(false);
  });

  it("removes query data from public analytics and rejects private URLs", () => {
    expect(sanitizeAnalyticsUrl("https://truenorthmap.ca/organizations/acme?utm_source=test#evidence")).toBe("https://truenorthmap.ca/organizations/acme");
    expect(sanitizeAnalyticsUrl("https://truenorthmap.ca/submit?targetId=private-id")).toBeNull();
    expect(sanitizeAnalyticsUrl("https://truenorthmap.ca/connect/acme?next=%2Faccount")).toBeNull();
  });
});
