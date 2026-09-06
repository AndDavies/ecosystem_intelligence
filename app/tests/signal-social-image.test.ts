import { describe, expect, it } from "vitest";
import { signalSocialImage } from "@/lib/signals/visuals";

describe("Signal sharing images", () => {
  it("uses the published image before any presentation fallback", () => {
    const image = signalSocialImage({ slug: "allen-vanguard-distress-and-the-next-industrial-bets", title: "Test edition", heroImage: { url: "https://example.com/source.jpg", alt: "Published source image", attribution: "Source", sourceUrl: "https://example.com/article" } });
    expect(image).toEqual({ url: "https://example.com/source.jpg", alt: "Published source image" });
  });
  it("shares the approved local product image when the edition has no published hero", () => {
    expect(signalSocialImage({ slug: "allen-vanguard-distress-and-the-next-industrial-bets", title: "Test edition", heroImage: null }).url).toMatch(/^https:\/\/[^/]+\/images\/signals\/allen-vanguard-equinox-ng.png$/);
  });
  it("gives other imageless editions an edition-specific branded sharing image", () => {
    const image = signalSocialImage({ slug: "another-edition", title: "Canadian marine research", heroImage: null });
    const url = new URL(image.url);
    expect(url.pathname).toBe("/api/og");
    expect(url.searchParams.get("title")).toBe("Canadian marine research");
    expect(image.alt).toContain("Canadian marine research");
  });
});
