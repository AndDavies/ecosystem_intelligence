import { describe, expect, it } from "vitest";
import { getRegionArt, regionProvinceLabel } from "@/lib/atlas/region-presentation";

describe("regional presentation", () => {
  it("maps every public region to a distinct optimized illustration", () => {
    const slugs = ["canada", "atlantic-canada", "quebec", "ontario", "prairies", "british-columbia", "north"];

    for (const slug of slugs) {
      const art = getRegionArt(slug);
      expect(art.imageSrc).toBe(`/imagery/regions/${slug}.webp`);
      expect(art.imageAlt).toMatch(/^Illustrative view of /);
      expect(art.imagePosition).toBeTruthy();
    }
  });

  it("retains the abstract fallback for an unknown region", () => {
    const art = getRegionArt("not-yet-mapped");
    expect(art.imageSrc).toBeUndefined();
    expect(art.imageAlt).toBeUndefined();
    expect(art.icon).toBeTruthy();
  });

  it("keeps regional coverage labels explicit", () => {
    expect(regionProvinceLabel([])).toBe("Coverage under review");
    expect(regionProvinceLabel(["Nova Scotia", "New Brunswick"])).toBe("Nova Scotia · New Brunswick");
    expect(regionProvinceLabel(["1", "2", "3", "4", "5", "6", "7"])).toBe("7 provinces and territories");
  });
});
