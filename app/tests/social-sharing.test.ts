import { describe, expect, it } from "vitest";
import { socialImageUrl, socialMetadata } from "@/lib/seo/social";

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
});
