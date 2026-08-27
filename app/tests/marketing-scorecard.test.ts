import { describe, expect, it } from "vitest";
import {
  buildMarketingCampaignBreakdown,
  buildMarketingContinuationWindows,
  isMarketingScorecardEvent,
  localFounderPilotPreviewEvents
} from "@/lib/product-insights/marketing-scorecard";

describe("North Signal marketing scorecard", () => {
  it("keeps ordinary attributed visitor events", () => {
    expect(isMarketingScorecardEvent({
      context_path: "/signals/current-edition",
      cohort: "north_signal_90d",
      metadata: { utm_source: "linkedin" }
    })).toBe(true);
  });

  it("excludes local, explicit QA, staff and development traffic without deleting it", () => {
    expect(isMarketingScorecardEvent({ context_path: "/dev/dossier-preview", metadata: {} })).toBe(false);
    expect(isMarketingScorecardEvent({ context_path: "/north-signal", metadata: { utm_source: "qa" } })).toBe(false);
    expect(isMarketingScorecardEvent({ context_path: "/north-signal", metadata: { traffic_class: "qa" } })).toBe(false);
    expect(isMarketingScorecardEvent({ context_path: "/north-signal", cohort: "staff", metadata: {} })).toBe(false);
  });

  it("breaks meaningful founder-pilot outcomes down by campaign, source, content and destination", () => {
    const rows = buildMarketingCampaignBreakdown([
      { event_name: "result_select", context_path: "/organizations", cohort: "tnm_founder_pilot_v1", metadata: { utm_source: "linkedin", utm_medium: "founder_social", utm_content: "rov_company_capability" } },
      { event_name: "dossier_open", context_path: "/organizations/kraken-robotics", cohort: "tnm_founder_pilot_v1", metadata: { utm_source: "linkedin", utm_medium: "founder_social", utm_content: "rov_company_capability" } },
      { event_name: "evidence_open", context_path: "/organizations/kraken-robotics", cohort: "qa", metadata: { utm_source: "qa", utm_medium: "founder_social", utm_content: "ignored" } },
      { event_name: "atlas_search", context_path: "/map", cohort: "tnm_founder_pilot_v1", metadata: { utm_source: "linkedin" } }
    ]);
    const campaign = rows.find((row) => row.dimension === "Campaign / cohort" && row.value === "tnm_founder_pilot_v1");
    const source = rows.find((row) => row.dimension === "Source / medium" && row.value === "linkedin / founder_social");
    const content = rows.find((row) => row.dimension === "Content" && row.value === "rov_company_capability");
    const destination = rows.find((row) => row.dimension === "Destination route" && row.value === "/organizations/kraken-robotics");
    expect(campaign?.total).toBe(2);
    expect(campaign?.counts.result_select).toBe(1);
    expect(campaign?.counts.dossier_open).toBe(1);
    expect(source?.total).toBe(2);
    expect(content?.total).toBe(2);
    expect(destination?.counts.dossier_open).toBe(1);
    expect(rows.some((row) => row.value === "ignored")).toBe(false);
  });

  it("keeps the authenticated local preview non-personal and out of QA scorecards", () => {
    const events = localFounderPilotPreviewEvents();
    expect(JSON.stringify(events)).not.toMatch(/@|email|session_id|requester/i);
    const rows = buildMarketingCampaignBreakdown(events);
    expect(rows.find((row) => row.dimension === "Campaign / cohort" && row.value === "tnm_founder_pilot_v1")?.total).toBe(7);
    expect(rows.some((row) => row.value === "qa")).toBe(false);
  });

  it("builds cumulative 7, 14 and 28 day continuation windows", () => {
    const now = new Date("2026-08-26T12:00:00.000Z");
    const rows = buildMarketingContinuationWindows([
      { event_name: "result_select", context_path: "/organizations", utm_campaign: "tnm_founder_pilot_v1", occurred_at: "2026-08-24T12:00:00.000Z" },
      { event_name: "dossier_open", context_path: "/organizations/example", utm_campaign: "tnm_founder_pilot_v1", occurred_at: "2026-08-16T12:00:00.000Z" },
      { event_name: "evidence_open", context_path: "/organizations/example", utm_campaign: "tnm_founder_pilot_v1", occurred_at: "2026-08-06T12:00:00.000Z" }
    ], now);

    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ windowDays: 7, total: 1, counts: { result_select: 1, dossier_open: 0, evidence_open: 0 } });
    expect(rows[1]).toMatchObject({ windowDays: 14, total: 2, counts: { result_select: 1, dossier_open: 1, evidence_open: 0 } });
    expect(rows[2]).toMatchObject({ windowDays: 28, total: 3, counts: { result_select: 1, dossier_open: 1, evidence_open: 1 } });
  });

  it("uses occurred, then received, then created timestamps in that order", () => {
    const now = new Date("2026-08-26T12:00:00.000Z");
    const rows = buildMarketingContinuationWindows([
      {
        event_name: "save",
        context_path: "/organizations/example",
        utm_campaign: "tnm_founder_pilot_v1",
        occurred_at: "2026-08-06T12:00:00.000Z",
        received_at: "2026-08-24T12:00:00.000Z",
        created_at: "2026-08-25T12:00:00.000Z"
      },
      {
        event_name: "feedback",
        context_path: "/contact",
        utm_campaign: "tnm_founder_pilot_v1",
        received_at: "2026-08-16T12:00:00.000Z",
        created_at: "2026-08-25T12:00:00.000Z"
      },
      {
        event_name: "submission",
        context_path: "/organizations/example",
        utm_campaign: "tnm_founder_pilot_v1",
        created_at: "2026-08-24T12:00:00.000Z"
      }
    ], now);

    expect(rows.find((row) => row.windowDays === 7)).toMatchObject({ total: 1, counts: { save: 0, feedback: 0, submission: 1 } });
    expect(rows.find((row) => row.windowDays === 14)).toMatchObject({ total: 2, counts: { save: 0, feedback: 1, submission: 1 } });
    expect(rows.find((row) => row.windowDays === 28)).toMatchObject({ total: 3, counts: { save: 1, feedback: 1, submission: 1 } });
  });

  it("rejects future, out-of-window, unattributed and QA continuation events", () => {
    const now = new Date("2026-08-26T12:00:00.000Z");
    const rows = buildMarketingContinuationWindows([
      { event_name: "connection", context_path: "/connect/example", utm_campaign: "tnm_founder_pilot_v1", occurred_at: "2026-08-26T12:06:00.000Z" },
      { event_name: "result_select", context_path: "/organizations", utm_campaign: "tnm_founder_pilot_v1", occurred_at: "2026-07-28T12:00:00.000Z" },
      { event_name: "dossier_open", context_path: "/dev/dossier-preview", utm_campaign: "tnm_founder_pilot_v1", occurred_at: "2026-08-25T12:00:00.000Z" },
      { event_name: "evidence_open", context_path: "/organizations/example", traffic_class: "qa", utm_campaign: "tnm_founder_pilot_v1", occurred_at: "2026-08-25T12:00:00.000Z" },
      { event_name: "save", context_path: "/organizations/example", cohort: "staff", occurred_at: "2026-08-25T12:00:00.000Z" },
      { event_name: "newsletter_success", context_path: "/north-signal", metadata: { utm_source: "qa" }, occurred_at: "2026-08-25T12:00:00.000Z" },
      { event_name: "feedback", context_path: "/contact", occurred_at: "2026-08-25T12:00:00.000Z" }
    ], now);

    expect(rows.map((row) => ({ windowDays: row.windowDays, total: row.total }))).toEqual([
      { windowDays: 7, total: 0 },
      { windowDays: 14, total: 0 },
      { windowDays: 28, total: 0 }
    ]);
  });
});
