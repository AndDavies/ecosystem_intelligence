import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { northSignalOffer, resolveNorthSignalIssueProof } from "@/lib/north-signal/offer";

const read = (file: string) => readFile(path.resolve(file), "utf8");

describe("North Signal acquisition architecture", () => {
  it("uses the dedicated landing route as the campaign hub and Signals as proof", async () => {
    const [landing, experience, offerComponent, layout, proofRoute, telemetry, sitemap] = await Promise.all([
      read("src/app/north-signal/page.tsx"),
      read("src/components/atlas/public-beta-experience.tsx"),
      read("src/components/atlas/north-signal-offer.tsx"),
      read("src/app/layout.tsx"),
      read("src/app/api/signals/latest-proof/route.ts"),
      read("src/components/atlas/north-signal-landing-telemetry.tsx"),
      read("src/app/sitemap.ts")
    ]);

    expect(landing).toContain('alternates: { canonical: "/north-signal" }');
    expect(landing).toContain("northSignalOffer.headline");
    expect(landing).toContain("description={northSignalOffer.supportingSentence}");
    expect(landing).toContain('placement="newsletter_page"');
    expect(landing).toContain("<NorthSignalValueLines limit={3}");
    expect(landing).toContain("sovereign-capability.webp");
    expect(landing.match(/<NorthSignalSignupForm/g)).toHaveLength(1);
    expect(landing).not.toContain("pageHeader={<></>}");
    expect(landing).not.toContain('href="/briefs');
    expect(experience).toContain("NorthSignalThisWeekCard");
    expect(experience).not.toContain("NorthSignalValueLines");
    expect(experience).toContain("sm:max-w-[470px]");
    expect(experience).toContain("showPreviewLink={false}");
    expect(experience).toContain("[data-north-signal-page-signup]");
    expect(experience).not.toContain("NorthSignalArtwork");
    expect(experience).not.toContain("sovereign-capability.webp");
    expect(offerComponent).toContain("data-north-signal-proof-card");
    expect(offerComponent).toContain("data-north-signal-proof-loading");
    expect(offerComponent).toContain("data-north-signal-proof-fallback");
    expect(offerComponent).toContain("rounded-[18px] bg-[var(--atlas-blue-soft)] px-4");
    expect(offerComponent).toContain("device_class: deviceClass()");
    expect(layout).toContain("<PublicBetaExperience />");
    expect(layout).not.toContain("Suspense");
    expect(proofRoute).toContain("getLatestPublishedSignalProof");
    expect(experience).toContain('fetch("/api/signals/latest-proof"');
    expect(experience).not.toContain('fixed right-0 top-[58%]');
    expect(experience).toContain('pathname === "/map") return "atlas"');
    expect(experience).toContain("onPreview={closeUpdatesForPreview}");
    expect(experience).toContain("window.setTimeout(() =>");
    expect(telemetry).toContain("newsletter_landing_view");
    expect(telemetry).toContain("newsletter_sample_open");
    expect(sitemap).toContain('"/north-signal"');
  });

  it("locks one shared five-minute offer and a concrete Signals preview", () => {
    expect(northSignalOffer).toEqual({
      label: "NORTH SIGNAL · WEEKLY",
      headline: "Five minutes to understand what changed, which Canadian capabilities it may affect, and what to watch next.",
      supportingSentence: "One weekly decision brief connects the developments that matter to the Canadian capabilities and public needs worth watching.",
      valueLines: [
        "One clear bottom line.",
        "The source-linked Signals behind it.",
        "The Canadian capability and Public Need links worth watching.",
        "Without rebuilding the week yourself."
      ],
      proofLine: "Built from published Canadian Defence Signals. Human-reviewed before it reaches you.",
      cta: "Get North Signal",
      riskReversal: "Free. Weekly. Original sources included. Human reviewed. Unsubscribe anytime.",
      previewLabel: "Preview this week’s issue →",
      proofMeta: "One bottom line · 3 Signals · 5-minute read",
      proofLinkLabel: "Preview issue →"
    });
    expect(resolveNorthSignalIssueProof({ slug: "real-edition", title: "A real published headline" })).toEqual({
      headline: "A real published headline",
      href: "/signals/real-edition"
    });
    expect(resolveNorthSignalIssueProof(null)).toBeNull();
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
    expect(weekly).toContain("Signals behind it");
    expect(weekly).toContain("one to three");
    expect(weekly).not.toContain("https://truenorthmap.ca/briefs");
  });
});
