import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { mailerLiteGroups } from "./mailerlite";
import { parseMailerLiteCampaignAggregate } from "./mailerlite-campaign-metrics";
import { campaignPurpose, campaignStream, observationMetrics, emptyNewsletterMetrics, newsletterObservationSchema, type NewsletterObservation } from "./newsletter-observation";

type Row = Record<string, unknown>;
const record = (value: unknown): Row => value && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
const count = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
const text = (value: unknown) => typeof value === "string" ? value : "";
const API = "https://connect.mailerlite.com/api";

// All provider requests in this collector are GET. It cannot grant consent,
// alter an audience, activate a workflow, create a campaign or send mail.
export async function observeNewsletter() {
  const admin = createAdminClient();
  const groups = mailerLiteGroups();
  const token = process.env.MAILERLITE_API_TOKEN?.trim();
  const summary: NewsletterObservation = {
    schemaVersion: "tnm_newsletter_observation_v1", collectedAt: new Date().toISOString(), status: "available", errors: [],
    groups: {master: null, weekly: null, signalAlerts: null},
    preferences: {checked: null, verified: null, mismatches: null, changedDuringCheck: null, unrecordedMemberships: null},
    welcome: {enabled: null, metrics: emptyNewsletterMetrics()}, alerts: {status: "unknown"}, campaigns: []
  };
  const fail = (scope: NewsletterObservation["errors"][number]) => { if (!summary.errors.includes(scope)) summary.errors.push(scope); };
  const get = async (route: string) => {
    const response = await fetch(`${API}${route}`, {headers: {Accept: "application/json", Authorization: `Bearer ${token}`}, cache: "no-store", signal: AbortSignal.timeout(12000)});
    if (!response.ok) throw new Error(`Provider read failed (${response.status})`);
    return record(await response.json());
  };
  const pages = async (route: string) => {
    const rows: Row[] = [];
    for (let page = 1; page <= 100; page++) {
      const payload = await get(`${route}${route.includes("?") ? "&" : "?"}limit=100&page=${page}`);
      if (!Array.isArray(payload.data)) throw new Error("Invalid provider page");
      rows.push(...payload.data.map(record));
      const links = record(payload.links), meta = record(payload.meta);
      if (links.next === null || (typeof meta.last_page === "number" && page >= meta.last_page)) return rows;
      if (payload.data.length === 0 || !links.next) throw new Error("Unresolved provider pagination");
    }
    throw new Error("Provider pagination incomplete");
  };
  if (!token || !groups.master || !groups.weekly || !groups.signalAlerts || new Set(Object.values(groups)).size !== 3) fail("configuration");
  else {
    const members = new Map<string, Set<string>>();
    await Promise.all([
      (async () => {
        try {
          const allGroups = await pages("/groups");
          for (const key of ["master", "weekly", "signalAlerts"] as const) {
            const group = allGroups.find(row => String(row.id) === groups[key]);
            summary.groups[key] = count(group?.active_count);
            if (summary.groups[key] === null) fail("groups");
          }
          for (const groupId of new Set(Object.values(groups) as string[])) {
            const emails = new Set<string>(); let cursor: string | null = null; const seen = new Set<string>();
            for (let page = 0; page < 100; page++) {
              const payload = await get(`/groups/${encodeURIComponent(groupId)}/subscribers?limit=1000&filter[status]=active${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
              if (!Array.isArray(payload.data)) throw new Error("Invalid membership page");
              for (const member of payload.data.map(record)) {
                if (member.status !== "active" || !text(member.email)) throw new Error("Invalid membership");
                emails.add(text(member.email).toLowerCase());
              }
              const next = record(payload.meta).next_cursor;
              if (next === null) { members.set(groupId, emails); break; }
              if (typeof next !== "string" || !next || seen.has(next)) throw new Error("Unresolved membership pagination");
              seen.add(next); cursor = next;
            }
            if (!members.has(groupId)) throw new Error("Membership incomplete");
          }
        } catch { fail("membership"); }
      })(),
      (async () => {
        try {
          const welcome = record((await get("/automations/194407335178798132")).data);
          summary.welcome.enabled = typeof welcome.enabled === "boolean" ? welcome.enabled : null;
          const step = Array.isArray(welcome.steps) ? welcome.steps.map(record).find(step => String(step.email_id) === "194407335345521721") : undefined;
          summary.welcome.metrics = observationMetrics(record(step?.email).stats ?? welcome.stats);
          if (summary.welcome.enabled === null) fail("welcome");
        } catch { fail("welcome"); }
      })(),
      (async () => {
        try {
          const alert = record((await get("/campaigns/196946216528905287")).data);
          summary.alerts.status = ["draft", "ready", "sent"].includes(text(alert.status)) ? alert.status as "draft" | "ready" | "sent" : "unknown";
          const campaigns = await pages("/campaigns?filter[status]=sent");
          for (const row of campaigns) {
            const stream = campaignStream(row.filter, groups);
            if (!stream) continue;
            const id = String(row.id);
            if (!/^\d+$/.test(id)) throw new Error("Invalid campaign identifier");
            const detail = record((await get(`/campaigns/${encodeURIComponent(id)}`)).data);
            const aggregate = parseMailerLiteCampaignAggregate({data: detail});
            const completedAt = aggregate?.completedAt ?? null;
            const purpose = campaignPurpose(id, text(row.name));
            summary.campaigns.push({id, stream, purpose, completedAt, metrics: observationMetrics(detail.stats)});
            // The older snapshot table requires all counters. Its schema must
            // never turn a missing provider count into an invented zero.
            if (!aggregate) continue;
            const {sent, delivered, estimatedUniqueOpens, uniqueClicks, bounces, unsubscribes} = aggregate;
            const {data: existing, error: existingError} = await admin.from("newsletter_delivery_runs").select("id,content_slug,completed_at").eq("provider_campaign_id", id).maybeSingle();
            if (existingError) throw new Error("Storage unavailable");
            const {data: run, error} = await admin.from("newsletter_delivery_runs").upsert({stream, content_slug: existing?.content_slug ?? `mailerlite-${id}`, provider_campaign_id: id, status: "sent", purpose, completed_at: completedAt ?? existing?.completed_at ?? null, error: null}, {onConflict: "stream,content_slug"}).select("id").single();
            if (error || !run) throw new Error("Storage unavailable");
            const {error: metricError} = await admin.from("newsletter_campaign_metric_snapshots").insert({delivery_run_id: run.id, provider_campaign_id: id, observed_at: summary.collectedAt, sent, delivered, estimated_unique_opens: estimatedUniqueOpens, unique_clicks: uniqueClicks, bounces, unsubscribes});
            if (metricError) throw new Error("Storage unavailable");
          }
        } catch (error) { console.warn("newsletter_campaign_collection", error instanceof Error ? error.message : "Unknown failure"); fail("campaigns"); }
      })()
    ]);
    if (members.size === 3) {
      try {
        const preferences: Row[] = [];
        for (let offset = 0; ; offset += 1000) {
          const {data, error} = await admin.from("newsletter_subscription_preferences").select("id,stream,status,updated_at,pilot_update_signups!inner(email,status,consented)").order("id").range(offset, offset + 999);
          if (error || !data) throw new Error("Preference read failed");
          preferences.push(...data); if (data.length < 1000) break;
        }
        summary.preferences = {checked: preferences.length, verified: 0, mismatches: 0, changedDuringCheck: 0, unrecordedMemberships: 0};
        const recorded = new Set<string>();
        for (const preference of preferences) {
          const subscriber = record(preference.pilot_update_signups);
          const groupId = preference.stream === "weekly" ? groups.weekly : groups.signalAlerts;
          const email = text(subscriber.email).toLowerCase();
          recorded.add(`${groupId}:${email}`);
          const present = members.get(groupId)!.has(email);
          const expected = preference.status === "subscribed" && subscriber.status === "subscribed" && subscriber.consented === true;
          const matches = present === expected && (!expected || members.get(groups.master)!.has(email));
          const {data, error} = await admin.from("newsletter_subscription_preferences").update({provider_group_id: groupId, provider_sync_status: matches ? "synced" : "failed", provider_synced_at: matches ? summary.collectedAt : null, provider_error: matches ? null : "Provider membership differs from recorded consent. Review before changing delivery."}).eq("id", preference.id).eq("updated_at", preference.updated_at).select("id");
          if (error) throw new Error("Preference receipt failed");
          if (!data?.length) summary.preferences.changedDuringCheck!++;
          else if (matches) summary.preferences.verified!++;
          else summary.preferences.mismatches!++;
        }
        for (const groupId of [groups.weekly, groups.signalAlerts]) {
          for (const email of members.get(groupId)!) {
            if (!recorded.has(`${groupId}:${email}`)) summary.preferences.unrecordedMemberships!++;
          }
        }
      } catch { fail("preferences"); }
    }
  }
  summary.status = summary.errors.includes("configuration") ? "unavailable" : summary.errors.length ? "partial" : "available";
  newsletterObservationSchema.parse(summary);
  const {error} = await admin.from("newsletter_provider_observations").upsert({observed_day: summary.collectedAt.slice(0,10), collected_at: summary.collectedAt, status: summary.status, summary}, {onConflict: "observed_day"});
  if (error) throw new Error("Newsletter observation could not be saved.");
  let dashboardSyncedAt: string | null = null;
  try {
    const ingest = process.env.TNM_VISIBILITY_DASHBOARD_INGEST_URL;
    const ingestToken = process.env.TNM_VISIBILITY_DASHBOARD_INGEST_TOKEN;
    const bypass = process.env.TNM_VISIBILITY_DASHBOARD_SITES_BYPASS_TOKEN;
    if (!ingest || !ingestToken || !bypass) throw new Error("Dashboard configuration missing");
    const destination = new URL("/api/newsletter", ingest);
    if (destination.origin !== "https://true-north-map-visibility-lab.madavies.chatgpt.site") throw new Error("Dashboard destination not approved");
    const response = await fetch(destination, {method: "POST", redirect: "error", headers: {authorization: `Bearer ${ingestToken}`, "OAI-Sites-Authorization": `Bearer ${bypass}`, "content-type": "application/json"}, body: JSON.stringify(summary), signal: AbortSignal.timeout(30000)});
    const receipt = record(await response.json());
    if (!response.ok || receipt.ok !== true || receipt.collectedAt !== summary.collectedAt) throw new Error("Dashboard acknowledgement failed");
    dashboardSyncedAt = new Date().toISOString();
  } catch { fail("dashboard"); summary.status = summary.status === "unavailable" ? "unavailable" : "partial"; }
  const {error: receiptError} = await admin.from("newsletter_provider_observations").update({status: summary.status, summary, dashboard_synced_at: dashboardSyncedAt}).eq("observed_day", summary.collectedAt.slice(0,10)).eq("collected_at", summary.collectedAt);
  if (receiptError) throw new Error("Dashboard receipt could not be saved.");
  return summary;
}
