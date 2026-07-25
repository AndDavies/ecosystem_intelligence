import { describe, expect, it } from "vitest";
import {
  analyticsConsentStorageKey,
  isAnalyticsEligiblePath,
  legacyAnalyticsConsentStorageKey,
  parseAnalyticsPreferences,
  readAnalyticsPreferences,
  sanitizeAnalyticsUrl
} from "@/lib/analytics-consent";

describe("isAnalyticsEligiblePath", () => {
  it("allows public discovery and governance pages", () => {
    expect(isAnalyticsEligiblePath("/")).toBe(true);
    expect(isAnalyticsEligiblePath("/organizations/acme")).toBe(true);
    expect(isAnalyticsEligiblePath("/methodology")).toBe(true);
    expect(isAnalyticsEligiblePath("/how-it-works")).toBe(true);
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

describe("analytics preferences", () => {
  it("parses only the current granular preference contract", () => {
    expect(parseAnalyticsPreferences(JSON.stringify({ version: 2, productAnalytics: true, experienceDiagnostics: false, decidedAt: "2026-07-25T12:00:00.000Z" }))).toMatchObject({ productAnalytics: true, experienceDiagnostics: false });
    expect(parseAnalyticsPreferences("accepted")).toBeNull();
    expect(parseAnalyticsPreferences(JSON.stringify({ version: 1, productAnalytics: true }))).toBeNull();
  });

  it("migrates prior Google consent without silently enabling session replay", () => {
    const values = new Map<string, string>([[legacyAnalyticsConsentStorageKey, "accepted"]]);
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
    const preferences = readAnalyticsPreferences(storage);
    expect(preferences).toMatchObject({ version: 2, productAnalytics: true, experienceDiagnostics: false });
    expect(values.has(analyticsConsentStorageKey)).toBe(true);
  });
});
