import { describe, expect, it } from "vitest";
import { buildMarketingCampaignBreakdown, isMarketingScorecardEvent, localFounderPilotPreviewEvents } from "@/lib/product-insights/marketing-scorecard";

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
});
