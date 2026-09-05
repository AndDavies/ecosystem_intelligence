import { describe, expect, it } from "vitest";
import { buildNewsletterDeliveryWindows } from "@/lib/product-insights/newsletter-delivery";

describe("North Signal delivery windows", () => {
  it("uses only the latest aggregate snapshot for each campaign", () => {
    const rows = buildNewsletterDeliveryWindows([
      {
        provider_campaign_id: "campaign-a",
        observed_at: "2026-08-24T12:00:00.000Z",
        sent: 100,
        delivered: 90,
        estimated_unique_opens: 40,
        unique_clicks: 10,
        bounces: 10,
        unsubscribes: 1
      },
      {
        provider_campaign_id: "campaign-a",
        observed_at: "2026-08-25T12:00:00.000Z",
        sent: 120,
        delivered: 110,
        estimated_unique_opens: 50,
        unique_clicks: 20,
        bounces: 10,
        unsubscribes: 2
      },
      {
        provider_campaign_id: "campaign-b",
        observed_at: "2026-08-25T13:00:00.000Z",
        sent: 80,
        delivered: 75,
        estimated_unique_opens: 30,
        unique_clicks: 10,
        bounces: 5,
        unsubscribes: 1
      }
    ], [{provider_campaign_id: "campaign-a", completed_at: "2026-08-25T12:00:00.000Z"}, {provider_campaign_id: "campaign-b", completed_at: "2026-08-25T13:00:00.000Z"}], new Date("2026-08-26T12:00:00.000Z"), [7]);

    expect(rows).toEqual([{
      windowDays: 7,
      campaigns: 2,
      sent: 200,
      delivered: 185,
      estimatedUniqueOpens: 80,
      uniqueClicks: 30,
      bounces: 15,
      unsubscribes: 3
    }]);
  });

  it("anchors delivery to completion and excludes unknown dates from every window", () => {
    const now = new Date("2026-08-26T12:00:00.000Z");
    const rows = buildNewsletterDeliveryWindows([
      {
        provider_campaign_id: "campaign-seven",
        observed_at: "2026-08-25T12:00:00.000Z",
        sent: 120,
        delivered: 110,
        estimated_unique_opens: 50,
        unique_clicks: 20,
        bounces: 10,
        unsubscribes: 2
      },
      {
        provider_campaign_id: "campaign-fourteen",
        observed_at: "2026-08-25T12:00:00.000Z",
        sent: 80,
        delivered: 75,
        estimated_unique_opens: 30,
        unique_clicks: 10,
        bounces: 5,
        unsubscribes: 1
      },
      {
        provider_campaign_id: "campaign-twenty-eight",
        observed_at: "2026-08-06T12:00:00.000Z",
        sent: 40,
        delivered: 38,
        estimated_unique_opens: 15,
        unique_clicks: 5,
        bounces: 2,
        unsubscribes: 0
      },
      {
        provider_campaign_id: "campaign-outside",
        observed_at: "2026-08-25T12:00:00.000Z",
        sent: 999,
        delivered: 999,
        estimated_unique_opens: 999,
        unique_clicks: 999,
        bounces: 0,
        unsubscribes: 0
      },
      {
        provider_campaign_id: "campaign-future",
        observed_at: "2026-08-25T12:00:00.000Z",
        sent: 999,
        delivered: 999,
        estimated_unique_opens: 999,
        unique_clicks: 999,
        bounces: 0,
        unsubscribes: 0
      }
    ], [
      { provider_campaign_id: "campaign-seven", completed_at: "2026-08-24T12:00:00.000Z" },
      { provider_campaign_id: "campaign-fourteen", completed_at: "2026-08-16T12:00:00.000Z" },
      { provider_campaign_id: "campaign-twenty-eight", completed_at: null },
      { provider_campaign_id: "campaign-outside", completed_at: "2026-07-27T12:00:00.000Z" },
      { provider_campaign_id: "campaign-future", completed_at: "2026-08-26T12:06:00.000Z" }
    ], now);

    expect(rows[0]).toEqual({
      windowDays: 7,
      campaigns: 1,
      sent: 120,
      delivered: 110,
      estimatedUniqueOpens: 50,
      uniqueClicks: 20,
      bounces: 10,
      unsubscribes: 2
    });
    expect(rows[1]).toEqual({
      windowDays: 14,
      campaigns: 2,
      sent: 200,
      delivered: 185,
      estimatedUniqueOpens: 80,
      uniqueClicks: 30,
      bounces: 15,
      unsubscribes: 3
    });
    expect(rows[2]).toEqual({
      windowDays: 28,
      campaigns: 2,
      sent: 200,
      delivered: 185,
      estimatedUniqueOpens: 80,
      uniqueClicks: 30,
      bounces: 15,
      unsubscribes: 3
    });
  });
});
