import { describe, expect, it } from "vitest";
import {
  buildNewsletterFunnelRows,
  newsletterFunnelStages,
  type NewsletterInsightEvent
} from "@/lib/product-insights/newsletter-funnel";

const now = new Date("2026-08-26T18:00:00.000Z");

function flow(session: number, names: readonly string[], placement = "newsletter_inline_signals"): NewsletterInsightEvent[] {
  return names.map((event_name, index) => ({
    event_name,
    session_id: `00000000-0000-4000-8000-${String(session).padStart(12, "0")}`,
    context_path: "/signals",
    occurred_at: new Date(now.getTime() - (names.length - index) * 1000).toISOString(),
    received_at: new Date(now.getTime() - (names.length - index) * 1000).toISOString(),
    traffic_class: "production",
    metadata: { placement, variant: "inline" }
  }));
}

describe("North Signal distinct-session funnels", () => {
  it("counts only ordered prefixes and never invents an inline open stage", () => {
    const complete = flow(1, newsletterFunnelStages.inline);
    const outOfOrder = flow(2, ["newsletter_impression", "newsletter_submit", "newsletter_form_start", "newsletter_success"]);
    const rows = buildNewsletterFunnelRows([...complete, ...outOfOrder], now, [7]);
    const row = rows[0];
    expect(row.surface).toBe("inline");
    expect(row.stageSessions).toEqual({
      newsletter_impression: 2,
      newsletter_form_start: 2,
      newsletter_submit: 1,
      newsletter_success: 1
    });
    expect(row.stageSessions).not.toHaveProperty("newsletter_open");
  });

  it("aggregates beyond 5,000 raw events and excludes QA sessions", () => {
    const production = Array.from({ length: 1_300 }, (_, index) => flow(index + 1, newsletterFunnelStages.inline)).flat();
    const qa = flow(9_999, newsletterFunnelStages.inline).map((event) => ({ ...event, traffic_class: "qa" }));
    expect(production.length).toBe(5_200);
    const rows = buildNewsletterFunnelRows([...production, ...qa], now, [7]);
    expect(rows[0].stageSessions).toEqual({
      newsletter_impression: 1_300,
      newsletter_form_start: 1_300,
      newsletter_submit: 1_300,
      newsletter_success: 1_300
    });
  });

  it("keeps dedicated, inline and revealed surfaces as separate denominators", () => {
    const inline = flow(1, newsletterFunnelStages.inline);
    const dedicated = newsletterFunnelStages.dedicated_page.map((event_name, index) => ({
      event_name,
      session_id: "20000000-0000-4000-8000-000000000001",
      context_path: "/north-signal",
      occurred_at: new Date(now.getTime() - (10 - index) * 1000).toISOString(),
      traffic_class: "production",
      metadata: { placement: "newsletter_page", variant: "inline" }
    }));
    const modal = newsletterFunnelStages.modal_banner.map((event_name, index) => ({
      event_name,
      session_id: "30000000-0000-4000-8000-000000000001",
      context_path: "/organizations/example",
      occurred_at: new Date(now.getTime() - (20 - index) * 1000).toISOString(),
      traffic_class: "production",
      metadata: { placement: "newsletter_modal_desktop", variant: "dialog" }
    }));
    const rows = buildNewsletterFunnelRows([...inline, ...dedicated, ...modal], now, [7]);
    expect(rows.map((row) => row.surface)).toEqual(["dedicated_page", "inline", "modal_banner"]);
  });
});
