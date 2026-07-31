import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { getRegionArt, regionProvinceLabel } from "@/lib/atlas/region-presentation";

describe("regional presentation", () => {
  it("maps every public region to a distinct optimized illustration", () => {
    const slugs = ["canada", "atlantic-canada", "quebec", "ontario", "prairies", "british-columbia", "north"];

    for (const slug of slugs) {
      const art = getRegionArt(slug);
      expect(art.imageSrc).toBe(`/imagery/regions/${slug}.webp`);
      expect(art.imageAlt).toMatch(/^Illustrative map /);
      expect(art.imagePosition).toBeTruthy();
      expect(art.imageFit).toBe("contain");
      expect(art.showLabel).toBe(false);
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

  it("renders regional cards in the native four-by-three frame without side gutters", () => {
    const regionsPage = fs.readFileSync(path.resolve(process.cwd(), "src/app/regions/page.tsx"), "utf8");
    const heroArt = fs.readFileSync(path.resolve(process.cwd(), "src/components/atlas/atlas-hero-art.tsx"), "utf8");

    expect(regionsPage).toContain('className="aspect-[4/3] border-b border-[var(--atlas-border)]"');
    expect(heroArt).toContain("const classNames = cn(");
  });
});
