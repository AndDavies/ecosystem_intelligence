import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  analyticsPreferences,
  analyticsConsentStorageKey,
  isAnalyticsEligiblePath,
  legacyAnalyticsConsentStorageKey,
  parseAnalyticsPreferences,
  readAnalyticsPreferences,
  sanitizeAnalyticsUrl
} from "@/lib/analytics-consent";
import { organicSearchEngine } from "@/components/atlas/public-beta-insights";

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
  it("keeps the compact first choice limited to product analytics", () => {
    expect(analyticsPreferences(true, false, "2026-07-26T12:00:00.000Z")).toEqual({
      version: 2,
      productAnalytics: true,
      experienceDiagnostics: false,
      decidedAt: "2026-07-26T12:00:00.000Z"
    });
  });

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

  it("keeps undecided, declined and accepted states distinct", () => {
    const empty = { getItem: () => null, setItem: () => undefined };
    expect(readAnalyticsPreferences(empty)).toBeNull();
    expect(parseAnalyticsPreferences(JSON.stringify(analyticsPreferences(false, false, "2026-08-26T12:00:00Z")))?.productAnalytics).toBe(false);
    expect(parseAnalyticsPreferences(JSON.stringify(analyticsPreferences(true, false, "2026-08-26T12:00:00Z")))?.productAnalytics).toBe(true);
  });

  it("does not misclassify Google authentication as organic search", () => {
    expect(organicSearchEngine("https://accounts.google.com/o/oauth2/v2/auth")).toBeNull();
    expect(organicSearchEngine("https://www.google.ca/search?q=canadian+defence")).toBe("google");
  });

  it("loads GA only on production hosts and sends queryless locations with explicit campaign fields", async () => {
    const source = await readFile(path.resolve("src/components/atlas/public-beta-insights.tsx"), "utf8");
    expect(source).toContain('["truenorthmap.ca", "www.truenorthmap.ca"].includes(window.location.hostname)');
    expect(source).toContain("send_page_view: false");
    expect(source).toContain("page_location: `${window.location.origin}${pathname}`");
    expect(source).toContain("campaign_source: attribution.source");
    expect(source).toContain("campaign_medium: attribution.medium");
    expect(source).toContain("campaign_name: attribution.campaign");
    expect(source).toContain("campaign_content: attribution.content");
    expect(source).not.toContain("page_location: window.location.href");
  });
});
