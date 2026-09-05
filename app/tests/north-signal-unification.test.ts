import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFile(path.resolve(file), "utf8");

describe("one-newsletter public contract", () => {
  it("uses Defence Signals for the public stream and North Signal for one free weekly newsletter", async () => {
    const [header, footer, signals, northSignal, signup] = await Promise.all([
      read("src/components/atlas/public-atlas-header.tsx"),
      read("src/components/atlas/public-atlas-footer.tsx"),
      read("src/app/signals/page.tsx"),
      read("src/app/north-signal/page.tsx"),
      read("src/components/atlas/north-signal-signup.tsx")
    ]);
    expect(header).toContain('{ href: "/signals", label: "Defence Signals"');
    expect(header).toContain("Free weekly briefing");
    expect(footer).toContain("Free weekly briefing");
    expect(signals).toContain('title="Canadian Defence Signals"');
    expect(signals).toContain("Source-linked Canadian defence developments and what they may change.");
    expect(northSignal).toContain("northSignalOffer.headline");
    expect(signup).toContain("brandCopy.northSignal");
    expect(signup).toContain("Also email me when a new Defence Signal is published.");
    expect(`${header}\n${footer}\n${signals}\n${northSignal}\n${signup}`).not.toMatch(/daily newsletter|published daily|daily publication/i);
  });

  it("server-renders recent Signals and preserves reciprocal discovery plus visible RSS", async () => {
    const [home, archive, detail, sitemap, signalsRepository] = await Promise.all([
      read("src/app/page.tsx"),
      read("src/app/signals/page.tsx"),
      read("src/app/signals/[slug]/page.tsx"),
      read("src/app/sitemap.ts"),
      read("src/lib/atlas/signals.ts")
    ]);
    expect(home).toContain("getPublishedSignals(1)");
    expect(home).toContain("signalEditionPresentation(signal).deck");
    expect(archive).toContain("RSS feed");
    expect(detail).toContain("Topics in this edition");
    expect(detail).toContain("Follow the edition into the organizations, technologies, Defence needs and Mission areas");
    expect(detail).toContain('placement="newsletter_inline_signals" trigger="signals_bottom_line"');
    expect(sitemap).toContain("getAllPublishedSignals()");
    expect(sitemap).toContain("signals.map");
    expect(signalsRepository).toContain("hydrationPageSize = 1000");
    expect(signalsRepository).toContain(".range(from, from + hydrationPageSize - 1)");
  });

  it("keeps aggregate MailerLite measurement owner-only, read-only at the provider, and unavailable until observed", async () => {
    const [insights, action, provider] = await Promise.all([
      read("src/app/admin/insights/page.tsx"),
      read("src/lib/actions/newsletter-admin.ts"),
      read("src/lib/email/mailerlite-campaign-metrics.ts")
    ]);
    expect(action).toContain('await requireAtlasStaff("editor")');
    expect(action).toContain("readMailerLiteCampaignAggregate");
    expect(provider).toContain('method: "GET"');
    expect(provider).not.toMatch(/method:\s*"(?:POST|PUT|PATCH|DELETE)"/);
    expect(insights).toContain('hasCampaignMetrics ? deliverySummary.sent : "Unavailable"');
    expect(insights).toContain("No snapshot recorded");
    expect(insights).toContain("imports no subscriber identity");
  });
});
