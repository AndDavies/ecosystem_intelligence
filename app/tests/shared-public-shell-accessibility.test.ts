import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFile(path.resolve(file), "utf8");

describe("shared public shell accessibility and naming", () => {
  it("connects and identifies the mobile menu while preserving large targets", async () => {
    const header = await read("src/components/atlas/public-atlas-header.tsx");

    expect(header).toContain('const mobileNavigationId = "public-atlas-mobile-navigation"');
    expect(header).toContain("aria-controls={mobileNavigationId}");
    expect(header).toContain("id={mobileNavigationId}");
    expect(header).toContain('aria-current={active ? "page" : undefined}');
    expect(header).toContain('event.key !== "Escape"');
    expect(header).toContain("menuButtonRef.current?.focus()");
    expect(header).toContain("min-h-11");
  });

  it("keeps feedback in shared header and footer controls rather than over reading content", async () => {
    const [header, footer, experience] = await Promise.all([
      read("src/components/atlas/public-atlas-header.tsx"),
      read("src/components/atlas/public-atlas-footer.tsx"),
      read("src/components/atlas/public-beta-experience.tsx")
    ]);

    expect(header).toContain('aria-label="Give feedback"');
    expect(footer).toContain("Give feedback");
    expect(footer).toContain('trackNorthSignalCtaClick("newsletter_footer", href)');
    expect(footer).toContain('openBetaUpdates("newsletter_footer")');
    expect(experience).not.toContain("fixed right-0 top-[58%]");
    expect(experience).not.toContain("landingFeedbackVisible");
  });

  it("uses the canonical Signals name and product social title", async () => {
    const [layout, archive, detail] = await Promise.all([
      read("src/app/layout.tsx"),
      read("src/app/signals/page.tsx"),
      read("src/app/signals/[slug]/page.tsx")
    ]);

    expect(layout).toContain("True North Map | Make Canadian capability visible");
    expect(layout).not.toContain("True North Map Canadian Public Beta");
    expect(archive).toContain('eyebrow="Canadian Defence Signals"');
    expect(detail).toContain("Canadian Defence Signals");
    expect(`${archive}\n${detail}`).not.toContain("True North Defence Signals");
  });
});
