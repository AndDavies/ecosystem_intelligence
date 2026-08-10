import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFile(path.resolve(file), "utf8");

describe("North Signal acquisition architecture", () => {
  it("uses the dedicated landing route as the campaign hub and Signals as proof", async () => {
    const [landing, telemetry, sitemap] = await Promise.all([
      read("src/app/north-signal/page.tsx"),
      read("src/components/atlas/north-signal-landing-telemetry.tsx"),
      read("src/app/sitemap.ts")
    ]);

    expect(landing).toContain('alternates: { canonical: "/north-signal" }');
    expect(landing).toContain("A clearer weekly read on what is changing in Canadian defence.");
    expect(landing).toContain('placement="newsletter_page"');
    expect(landing).toContain("sovereign-capability.webp");
    expect(landing).toContain("Three source-linked Signals behind it");
    expect(landing).not.toContain('href="/briefs');
    expect(telemetry).toContain("newsletter_landing_view");
    expect(telemetry).toContain("newsletter_sample_open");
    expect(sitemap).toContain('"/north-signal"');
  });

  it("keeps the Brief archive live but removes it from primary acquisition surfaces", async () => {
    const [header, footer, homepage, briefArchive] = await Promise.all([
      read("src/components/atlas/public-atlas-header.tsx"),
      read("src/components/atlas/public-atlas-footer.tsx"),
      read("src/components/atlas/guided-landing-dynamic.tsx"),
      read("src/app/briefs/page.tsx")
    ]);

    expect(header).not.toContain('["Defence Briefs", "/briefs"]');
    expect(footer).not.toContain('["Defence Briefs", "/briefs"]');
    expect(homepage).toContain("Read recent Signals");
    expect(homepage).not.toContain('href="/briefs"');
    expect(briefArchive).toContain("All Defence Briefs");
  });

  it("publishes a summary-only RSS surface for the latest twenty editions", async () => {
    const [feed, signals] = await Promise.all([
      read("src/app/signals/feed.xml/route.ts"),
      read("src/app/signals/page.tsx")
    ]);

    expect(feed).toContain("getPublishedSignals(20)");
    expect(feed).toContain("edition.executiveSummary");
    expect(feed).not.toContain("edition.items");
    expect(feed).toContain('rel="related" title="North Signal weekly decision brief"');
    expect(signals).toContain('"application/rss+xml": "/signals/feed.xml"');
  });

  it("keeps all external acquisition copy Signals-led", async () => {
    const [welcome, weekly] = await Promise.all([
      read("../content/email/north-signal/welcome.md"),
      read("../content/email/north-signal/weekly-template.md")
    ]);

    expect(welcome).toContain("Read recent Canadian Defence Signals");
    expect(welcome).toContain("utm_campaign=north_signal_welcome");
    expect(weekly).toContain("Three Signals behind it");
    expect(weekly).not.toContain("https://truenorthmap.ca/briefs");
  });
});
