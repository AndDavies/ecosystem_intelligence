import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { socialImageUrl, socialMetadata } from "@/lib/seo/social";
import { brandCopy, rootSocialCard } from "@/lib/brand-copy";

describe("public social sharing", () => {
  it("builds a canonical branded image without exposing arbitrary query state", () => {
    const url = new URL(socialImageUrl({ title: "Kraken Robotics & Canada", eyebrow: "Canadian technology", detail: "St. John’s, NL" }));
    expect(url.origin).toBe("https://truenorthmap.ca");
    expect(url.pathname).toBe("/api/og");
    expect(url.searchParams.get("title")).toBe("Kraken Robotics & Canada");
    expect(url.searchParams.get("eyebrow")).toBe("Canadian technology");
  });

  it("keeps LinkedIn and X metadata page specific", () => {
    const metadata = socialMetadata({ title: "A Canadian capability", description: "Evidence-backed description", path: "/capabilities/example", eyebrow: "Canadian technology" });
    expect(metadata.openGraph.url).toBe("/capabilities/example");
    expect(metadata.openGraph.title).toBe("A Canadian capability");
    expect(metadata.twitter.title).toBe("A Canadian capability");
    expect(metadata.twitter.card).toBe("summary_large_image");
  });

  it("uses the outcome-led category and trust hierarchy for reusable social art", async () => {
    const [rootCard, dynamicCard, organizationRoute] = await Promise.all([
      readFile(path.resolve("src/app/opengraph-image.tsx"), "utf8"),
      readFile(path.resolve("src/app/api/og/route.tsx"), "utf8"),
      readFile(path.resolve("src/app/organizations/[slug]/page.tsx"), "utf8")
    ]);
    expect(brandCopy.categoryLabel).toBe("CANADIAN DEFENCE AND DUAL-USE DIRECTORY");
    expect(rootCard).toContain("brandCopy.categoryLabel");
    expect(rootCard).not.toContain("PUBLIC BETA");
    expect(dynamicCard).toContain("Public sources cited · {location} · Human review");
    expect(dynamicCard).toContain('position: "absolute", left: 0, right: 0, bottom: 0');
    expect(dynamicCard).toContain("veryLongTitle ? 44 : longTitle ? 48 : 60");
    expect(organizationRoute).toContain("title: socialTitle");
    expect(organizationRoute).toContain("detail: primaryCapability?.name");
    expect(dynamicCard).not.toContain("EVIDENCE-LED ECOSYSTEM DISCOVERY");
  });

  it("gives the homepage a dedicated thumbnail-readable social card", async () => {
    const [homePage, homeCard, layout, signalsPage] = await Promise.all([
      readFile(path.resolve("src/app/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/api/og/home-v2/route.tsx"), "utf8"),
      readFile(path.resolve("src/app/layout.tsx"), "utf8"),
      readFile(path.resolve("src/app/signals/page.tsx"), "utf8")
    ]);

    expect(rootSocialCard).toEqual({
      path: "/api/og/home-v2",
      width: 1200,
      height: 630,
      type: "image/png",
      alt: "True North Map — Make Canadian capability visible."
    });
    expect(homePage).toContain("rootSocialCard.type");
    expect(homePage).toContain("type: \"website\"");
    expect(homePage).toContain("primaryImageOfPage");
    expect(homeCard).toContain("brandCopy.categoryLabel");
    expect(homeCard).toContain("Make Canadian");
    expect(homeCard).toContain("capability&nbsp;");
    expect(homeCard).not.toContain("brandCopy.headline");
    expect(homeCard).not.toContain("brandCopy.trust");
    expect(homeCard).not.toContain("PUBLIC BETA");
    expect(layout).toContain('url: "/opengraph-image"');
    expect(signalsPage).toContain('url: "/opengraph-image"');
  });

  it("uses the dialog trigger contract so focus returns after share options close", async () => {
    const share = await readFile(path.resolve("src/components/atlas/public-share.tsx"), "utf8");
    expect(share).toContain("<Dialog.Trigger asChild>");
    expect(share).toContain("<Dialog.Close asChild>");
    expect(share).toContain("<Dialog.Root open={open} onOpenChange={setOpen}>");
  });
});
