import { validDate, validPeriod, type ReportingPeriod } from "./intelligence";

export const productEventNames = new Set(["atlas_search","filter_apply","marker_select","result_select","dossier_open","evidence_open","export","save","submission","connection","subscription","newsletter_impression","newsletter_open","newsletter_cta_click","newsletter_form_start","newsletter_submit","newsletter_landing_view","newsletter_sample_open","newsletter_success","newsletter_error","newsletter_dismiss","feedback","share","profile_engagement"]);
export const productChannels = new Set(["organic_google","organic_bing","organic_other","ai_referral","founder_social","company_social","earned_partner","email","referral","direct","internal","unknown"]);
export const productFamilies = new Set(["home","organizations","capabilities","map","signals","north-signal","demand","missions","regions","briefs","other_public"]);
export type ProductSummary = {
  schemaVersion: "tnm_product_activity_summary_v1";
  collectedAt: string;
  period: ReportingPeriod;
  firstObservedDate: string | null;
  rows: Array<{ date: string; event: string; routeFamily: string; channel: string; events: number; observedSessions: number; taggedEvents: number }>;
};
export function validProductSummary(value: unknown): value is ProductSummary {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  if (Object.keys(v).sort().join() !== ["schemaVersion","collectedAt","period","firstObservedDate","rows"].sort().join() || v.schemaVersion !== "tnm_product_activity_summary_v1" || typeof v.collectedAt !== "string" || !Number.isFinite(Date.parse(v.collectedAt)) || !validPeriod(v.period) || !(v.firstObservedDate === null || validDate(v.firstObservedDate)) || !Array.isArray(v.rows) || v.rows.length > 100000) return false;
  const period = v.period;
  return v.rows.every(r => {
    if (!r || typeof r !== "object" || Object.keys(r).sort().join() !== ["date","event","routeFamily","channel","events","observedSessions","taggedEvents"].sort().join()) return false;
    return validDate(r.date) && r.date >= period.startDate && r.date <= period.endDate && productEventNames.has(r.event) && productChannels.has(r.channel) && productFamilies.has(r.routeFamily) && [r.events,r.observedSessions,r.taggedEvents].every(n => Number.isSafeInteger(n) && n >= 0) && r.taggedEvents <= r.events && r.observedSessions <= r.events;
  });
}
