import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  boundedMetadataTitle,
  searchTitleMaximumLength,
  searchTitleSuffix
} from "@/lib/seo/metadata-title";

describe("search metadata", () => {
  it("uses a shorter meaningful organization descriptor before dropping context", () => {
    const title = boundedMetadataTitle("MDA Space", [
      "MDA CHORUS Synthetic Aperture Radar Constellation",
      "Earth Observation SAR Constellation",
      "Company"
    ]);

    expect(title).toBe("MDA Space — Earth Observation SAR Constellation");
    expect(`${title}${searchTitleSuffix}`).toHaveLength(64);
    expect(`${title}${searchTitleSuffix}`.length).toBeLessThanOrEqual(searchTitleMaximumLength);
  });

  it("keeps every generated title inside the search-result limit", () => {
    const title = boundedMetadataTitle(
      "A Very Long Canadian Defence Organization Name That Cannot Fit Unchanged",
      ["A still longer capability description that cannot fit either"]
    );
    expect(`${title}${searchTitleSuffix}`.length).toBeLessThanOrEqual(searchTitleMaximumLength);
  });

  it("prevents the streamed organization loading boundary from contributing a second H1", async () => {
    const loading = await readFile(path.resolve("src/app/organizations/loading.tsx"), "utf8");
    expect(loading).toContain("pageHeader={(");
    expect(loading).not.toContain("<h1");
    expect(loading).toContain('role="status"');
    expect(loading).toContain('aria-busy="true"');
  });
});
