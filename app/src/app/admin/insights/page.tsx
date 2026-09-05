import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { NewsletterProviderHealth } from "@/components/atlas/newsletter-provider-health";
import { AdminNav } from "@/components/atlas/admin-nav";
import { EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PendingButton } from "@/components/ui/pending-button";
import { updateBetaWorkflow } from "@/lib/actions/beta-admin";
import { importNewsletterCampaignAggregate } from "@/lib/actions/newsletter-admin";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildMarketingCampaignBreakdown, buildMarketingContinuationWindows, isMarketingScorecardEvent, localFounderPilotPreviewEvents, meaningfulMarketingEvents } from "@/lib/product-insights/marketing-scorecard";
import { buildNewsletterDeliveryWindows } from "@/lib/product-insights/newsletter-delivery";
import { buildNewsletterFunnelRows, localNewsletterFunnelPreviewEvents, type NewsletterInsightEvent } from "@/lib/product-insights/newsletter-funnel";

export const dynamic = "force-dynamic";

export default async function AdminInsightsPage({ searchParams }: { searchParams: Promise<{ error?: string; preview?: string }> }) {
  const user = await requireAtlasStaff("editor");
  const params = await searchParams;
  const admin = createAdminClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [connections, contacts, submissionCount, feedback, subscribers, searches, events, preferences, deliveryRuns, campaignMetrics] = await Promise.all([
    admin.from("connection_requests").select("id, organization_id, requester_name, requester_organization, requester_email, intent, message, status, reviewer_notes, created_at").order("created_at", { ascending: false }).limit(100),
    admin.from("contact_messages").select("id, category, sender_name, sender_email, organization_name, message, status, reviewer_notes, created_at").order("created_at", { ascending: false }).limit(100),
    admin.from("submissions").select("id", { count: "exact", head: true }),
    admin.from("pilot_feedback").select("id, goal, worked, missing, contact_email, context_path, status, created_at").order("created_at", { ascending: false }).limit(100),
    admin.from("pilot_update_signups").select("id", { count: "exact", head: true }).eq("status", "subscribed"),
    admin.from("pilot_searches").select("id, query_text, interpretation, resolved_filters, result_count, zero_result, context_path, created_at").order("created_at", { ascending: false }).limit(100),
    readAllInsightEvents(admin, since),
    admin.from("newsletter_subscription_preferences").select("stream, status, provider_sync_status, provider_synced_at, provider_error, updated_at"),
    admin.from("newsletter_delivery_runs").select("stream, content_slug, provider_campaign_id, purpose, status, scheduled_for, completed_at, error, updated_at").order("updated_at", { ascending: false }).limit(200),
    admin.from("newsletter_campaign_metric_snapshots").select("provider_campaign_id, observed_at, sent, delivered, estimated_unique_opens, unique_clicks, bounces, unsubscribes").order("observed_at", { ascending: false }).limit(500)
  ]);

  const showLocalMarketingPreview = process.env.NODE_ENV === "development" && params.preview === "founder-pilot";
  const localPreviewEvents = showLocalMarketingPreview ? localNewsletterFunnelPreviewEvents() : [];
  const allInsightEvents = [...events.data, ...localPreviewEvents];
  const scorecardEvents = [...allInsightEvents, ...(showLocalMarketingPreview ? localFounderPilotPreviewEvents() : [])].filter(isMarketingScorecardEvent);
  const funnelRows = buildNewsletterFunnelRows(allInsightEvents);
  const activeSubscriberCount = subscribers.error ? null : subscribers.count ?? 0;
  const activeWeekly = preferences.error ? null : (preferences.data ?? []).filter((row) => row.stream === "weekly" && row.status === "subscribed").length;
  const activeAlerts = preferences.error ? null : (preferences.data ?? []).filter((row) => row.stream === "signal_alerts" && row.status === "subscribed").length;
  const preferenceSyncFailures = preferences.error ? null : (preferences.data ?? []).filter((row) => row.provider_sync_status === "failed" || row.provider_error).length;
  const productionCampaigns = new Set((deliveryRuns.data ?? []).filter(run => run.purpose === "production").map(run => run.provider_campaign_id));
  const campaignMetricRows = campaignMetrics.error || deliveryRuns.error ? [] : (campaignMetrics.data ?? []).filter(row => productionCampaigns.has(row.provider_campaign_id));
  const deliverySummary = summarizeCampaignMetrics(campaignMetricRows);
  const hasCampaignMetrics = !campaignMetrics.error && campaignMetricRows.length > 0;
  const latestCampaignObservation = latestCampaignMetricObservation(campaignMetricRows);
  const campaignMetricState = campaignMetrics.error
    ? "Unavailable"
    : !latestCampaignObservation
      ? "No snapshot recorded"
      : Date.now() - Date.parse(latestCampaignObservation) > 8 * 24 * 60 * 60 * 1000
        ? `Stale · ${new Date(latestCampaignObservation).toLocaleDateString("en-CA")}`
        : `Updated ${new Date(latestCampaignObservation).toLocaleDateString("en-CA")}`;
  const marketingCampaignRows = buildMarketingCampaignBreakdown(scorecardEvents);
  const marketingContinuationRows = buildMarketingContinuationWindows(scorecardEvents);
  const deliveryWindowRows = buildNewsletterDeliveryWindows(campaignMetricRows, deliveryRuns.error ? [] : deliveryRuns.data ?? []);
  const eventCounts = new Map<string, number>();
  for (const event of scorecardEvents) if (event.event_name) eventCounts.set(event.event_name, (eventCounts.get(event.event_name) ?? 0) + 1);
  const totalSearches = searches.data?.length ?? 0;
  const zeroSearches = searches.data?.filter((item) => item.zero_result).length ?? 0;
  const assistantSearches = (searches.data ?? []).map((item) => assistantMeta(item.resolved_filters)).filter((item) => item.mode === "assistant");
  const coverageGaps = assistantSearches.filter((item) => item.outcome === "coverage_gap").length;
  const assistantLatency = assistantSearches.map((item) => item.latencyMs).filter((value): value is number => typeof value === "number");
  const averageLatency = assistantLatency.length ? Math.round(assistantLatency.reduce((sum, value) => sum + value, 0) / assistantLatency.length) : 0;
  const newsletterStages = ["newsletter_landing_view", "newsletter_impression", "newsletter_open", "newsletter_form_start", "newsletter_submit", "newsletter_success", "newsletter_error", "newsletter_dismiss"] as const;
  const newsletterStageLabels: Record<(typeof newsletterStages)[number], string> = {
    newsletter_landing_view: "Landing views",
    newsletter_impression: "Offer shown",
    newsletter_open: "Offer opened",
    newsletter_form_start: "Form started",
    newsletter_submit: "Submitted",
    newsletter_success: "Local consent recorded",
    newsletter_error: "Errors",
    newsletter_dismiss: "Dismissals"
  };
  const newsletterEvents = scorecardEvents.filter((event) => newsletterStages.includes(event.event_name as (typeof newsletterStages)[number]) || event.event_name?.startsWith("newsletter_") || event.event_name === "subscription");
  const newsletterPlacements = new Map<string, Map<string, number>>();
  const newsletterDimensions = new Map<string, Map<string, number>>();
  for (const event of newsletterEvents) {
    const metadata = event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata) ? event.metadata as Record<string, unknown> : {};
    const placement = typeof metadata.placement === "string" ? metadata.placement : typeof metadata.source === "string" ? metadata.source : "unknown";
    const counts = newsletterPlacements.get(placement) ?? new Map<string, number>();
    if (!event.event_name) continue;
    counts.set(event.event_name, (counts.get(event.event_name) ?? 0) + 1);
    newsletterPlacements.set(placement, counts);
    const dimensions = {
      Route: event.context_path || "unknown",
      Device: typeof metadata.device_class === "string" ? metadata.device_class : "unknown",
      "Source / medium": newsletterSourceMedium(event, metadata),
      Campaign: event.utm_campaign || event.cohort || "unattributed"
    };
    for (const [dimension, value] of Object.entries(dimensions)) {
      const key = `${dimension}\u0000${value}`;
      const dimensionCounts = newsletterDimensions.get(key) ?? new Map<string, number>();
      dimensionCounts.set(event.event_name, (dimensionCounts.get(event.event_name) ?? 0) + 1);
      newsletterDimensions.set(key, dimensionCounts);
    }
  }

  return (
    <PublicPageShell variant="admin" eyebrow="Private administration" title="Product and acquisition insights" description="Review aggregate discovery, newsletter, and campaign behaviour while keeping operational submissions in their own bounded queue." actions={<span className="rounded bg-[var(--admin-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--admin-muted-strong)]">{user.role} · {user.email}</span>}>
      <AdminNav />
      {showLocalMarketingPreview ? <div className="mb-5 rounded-md bg-[var(--admin-signal-soft)] px-3 py-2 text-xs font-semibold text-[var(--admin-ink)]">Local preview only · non-personal founder-pilot test events are projected in the scorecard and are not written to Supabase.</div> : null}
      {params.error ? <div className="mb-5 rounded-md border border-[var(--admin-danger-border)] bg-[var(--admin-danger-soft)] px-3 py-2 text-sm text-[var(--admin-danger)]">That review update could not be saved.</div> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Subscribers" value={activeSubscriberCount ?? "Unavailable"} />
        <Metric label="Searches (90d)" value={totalSearches} />
        <Metric label="Zero-result rate" value={totalSearches ? `${Math.round((zeroSearches / totalSearches) * 100)}%` : "0%"} />
        <Metric label="Ask True North runs" value={assistantSearches.length} />
        <Metric label="Assistant coverage gaps" value={coverageGaps} />
        <Metric label="Average assistant latency" value={averageLatency ? `${(averageLatency / 1000).toFixed(1)}s` : "No data"} />
        <Metric label="Public submissions" value={submissionCount.error ? "Unavailable" : submissionCount.count ?? 0} />
        <Metric label="Connection requests" value={connections.data?.length ?? 0} />
      </div>
      <PublicCard title="Workflow funnel" eyebrow="Meaningful events · last 30 days" className="mt-5"><div className="flex flex-wrap gap-2">{["atlas_search", "result_select", "dossier_open", "evidence_open", "export", "save", "submission", "connection", "subscription", "feedback"].map((name) => <span key={name} className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-3 py-2 text-xs"><strong>{eventCounts.get(name) ?? 0}</strong> {name.replaceAll("_", " ")}</span>)}</div></PublicCard>
      <PublicCard title="Founder pilot campaign" eyebrow="Outcome and attribution · last 30 days" className="mt-5">
        <p className="text-xs leading-5 text-[var(--admin-muted)]">Campaign reporting uses the existing bounded UTM and route fields. It shows whether an attributed visit progressed from discovery into a dossier, source, saved record, contribution, connection or North Signal conversion.</p>
        {marketingCampaignRows.length ? <div className="mt-5 overflow-x-auto" data-marketing-campaign-scorecard>
          <table className="min-w-full text-left text-xs">
            <thead><tr className="border-b border-[var(--admin-border)] text-[var(--admin-muted)]"><th className="px-3 py-2">Dimension</th><th className="px-3 py-2">Value</th>{meaningfulMarketingEvents.map((event) => <th key={event} className="px-3 py-2">{marketingEventLabel(event)}</th>)}<th className="px-3 py-2">Total</th></tr></thead>
            <tbody>{marketingCampaignRows.map((row) => <tr key={`${row.dimension}:${row.value}`} className="border-b border-[var(--admin-border)]"><td className="px-3 py-2 font-semibold text-[var(--admin-ink)]">{row.dimension}</td><td className="px-3 py-2 text-[var(--admin-muted-strong)]">{row.value}</td>{meaningfulMarketingEvents.map((event) => <td key={event} className="px-3 py-2 text-[var(--admin-muted-strong)]">{row.counts[event]}</td>)}<td className="px-3 py-2 font-semibold text-[var(--admin-ink)]">{row.total}</td></tr>)}</tbody>
          </table>
        </div> : <p className="mt-4 text-xs text-[var(--admin-muted)]">Attributed meaningful activity will appear here without changing the raw event ledger.</p>}
        {events.error ? <AvailabilityState title="Product continuation windows" state="Unavailable" detail="The first-party event ledger could not be read, so no 7, 14 or 28-day continuation total is inferred." /> : <div className="mt-5 overflow-x-auto" data-marketing-continuation-windows>
          <h3 className="text-sm font-bold text-[var(--admin-ink)]">Deeper product actions by window</h3>
          <table className="mt-3 min-w-full text-left text-xs">
            <thead><tr className="border-b border-[var(--admin-border)] text-[var(--admin-muted)]"><th className="px-3 py-2">Window</th>{meaningfulMarketingEvents.map((event) => <th key={event} className="px-3 py-2">{marketingEventLabel(event)}</th>)}<th className="px-3 py-2">Total</th></tr></thead>
            <tbody>{marketingContinuationRows.map((row) => <tr key={row.windowDays} className="border-b border-[var(--admin-border)]"><td className="px-3 py-2 font-semibold text-[var(--admin-ink)]">{row.windowDays} days</td>{meaningfulMarketingEvents.map((event) => <td key={event} className="px-3 py-2 text-[var(--admin-muted-strong)]">{row.counts[event]}</td>)}<td className="px-3 py-2 font-semibold text-[var(--admin-ink)]">{row.total}</td></tr>)}</tbody>
          </table>
        </div>}
        <p className="mt-4 text-xs leading-5 text-[var(--admin-muted)] [overflow-wrap:anywhere]">Pilot convention: <code>utm_source=linkedin|x|tnm_linkedin|approved_partner_slug</code>, <code>utm_medium=founder_social|company_social|earned_partner</code>, <code>utm_campaign=tnm_founder_pilot_v1</code>, and <code>utm_content=&lt;topic_slug&gt;_&lt;post_type&gt;</code>.</p>
      </PublicCard>
      <PublicCard title="Measurement coverage" eyebrow="Separate systems · separate denominators" className="mt-5">
        <div className="grid gap-3 md:grid-cols-3">
          <AvailabilityState title="Search Console" state="Unavailable here" detail="Search impressions, clicks and CTR remain in the private visibility refresh and Command Centre. Admin Insights does not invent a zero or treat GSC as a visitor funnel." />
          <AvailabilityState title="GA4" state="Consent-gated" detail="GA4 reports only analytics-consented production traffic. Its window is aligned to the latest finalized GSC date during visibility refresh, but the totals are not forced to match." />
          <AvailabilityState title="First-party funnel" state={events.error ? "Unavailable" : `${events.data.length.toLocaleString("en-CA")} rows loaded`} detail={events.error ? "The bounded event ledger could not be read." : `All pages were read without a 5,000-row cap${events.usedLegacyProjection ? "; the pre-migration projection does not yet include server traffic class or separate UTM columns" : ""}.`} />
        </div>
        <p className="mt-4 text-xs leading-5 text-[var(--admin-muted)]">The authoritative consent ledger and aggregate MailerLite delivery metrics are reported separately below. Command Centre receives sanitized aggregate visibility summaries only; no subscriber identity is exported.</p>
      </PublicCard>
      <PublicCard title="North Signal delivery" eyebrow="One newsletter · independent preferences" className="mt-5">
        <NewsletterProviderHealth />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Weekly subscribers" value={activeWeekly ?? "Unavailable"} />
          <Metric label="Defence Signal alerts" value={activeAlerts ?? "Unavailable"} />
          <Metric label="Preference sync failures" value={preferenceSyncFailures ?? "Unavailable"} />
          <Metric label="Delivery runs recorded" value={deliveryRuns.error ? "Unavailable" : deliveryRuns.data?.length ? deliveryRuns.data.length : "Not recorded"} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <Metric label="Sent" value={hasCampaignMetrics ? deliverySummary.sent : "Unavailable"} />
          <Metric label="Delivered" value={hasCampaignMetrics ? deliverySummary.delivered : "Unavailable"} />
          <Metric label="Estimated unique opens" value={hasCampaignMetrics ? deliverySummary.estimatedUniqueOpens : "Unavailable"} />
          <Metric label="Unique clicks" value={hasCampaignMetrics ? deliverySummary.uniqueClicks : "Unavailable"} />
          <Metric label="Bounces" value={hasCampaignMetrics ? deliverySummary.bounces : "Unavailable"} />
          <Metric label="Unsubscribes" value={hasCampaignMetrics ? deliverySummary.unsubscribes : "Unavailable"} />
        </div>
        <p className="mt-4 text-xs leading-5 text-[var(--admin-muted)]"><strong className="text-[var(--admin-ink)]">Provider metrics: {campaignMetricState}.</strong> Each campaign contributes only its latest aggregate snapshot. Opens are estimated and directional; clicks and attributable deeper product actions are stronger signals. An unavailable table or provider snapshot is shown as unavailable, never as zero.</p>
        {hasCampaignMetrics ? <div className="mt-5 overflow-x-auto" data-newsletter-delivery-windows>
          <h3 className="text-sm font-bold text-[var(--admin-ink)]">Aggregate delivery by window</h3>
          <table className="mt-3 min-w-full text-left text-xs">
            <thead><tr className="border-b border-[var(--admin-border)] text-[var(--admin-muted)]"><th className="px-3 py-2">Window</th><th className="px-3 py-2">Campaigns</th><th className="px-3 py-2">Sent</th><th className="px-3 py-2">Delivered</th><th className="px-3 py-2">Estimated opens</th><th className="px-3 py-2">Clicks</th><th className="px-3 py-2">Bounces</th><th className="px-3 py-2">Unsubscribes</th></tr></thead>
            <tbody>{deliveryWindowRows.map((row) => <tr key={row.windowDays} className="border-b border-[var(--admin-border)]"><td className="px-3 py-2 font-semibold text-[var(--admin-ink)]">{row.windowDays} days</td><td className="px-3 py-2">{row.campaigns}</td><td className="px-3 py-2">{row.sent}</td><td className="px-3 py-2">{row.delivered}</td><td className="px-3 py-2">{row.estimatedUniqueOpens}</td><td className="px-3 py-2">{row.uniqueClicks}</td><td className="px-3 py-2">{row.bounces}</td><td className="px-3 py-2">{row.unsubscribes}</td></tr>)}</tbody>
          </table>
          <p className="mt-2 text-xs text-[var(--admin-muted)]">Only production campaigns with a verified delivery timestamp enter these windows. Verification emails and unknown delivery dates remain outside them.</p>
        </div> : <AvailabilityState title="7, 14 and 28-day delivery comparison" state={campaignMetrics.error ? "Unavailable" : "No snapshot recorded"} detail={campaignMetrics.error ? "The aggregate campaign metric ledger could not be read." : "Import a sent campaign's aggregate report before interpreting delivery or engagement by window."} />}
        <form action={importNewsletterCampaignAggregate} className="mt-5 grid gap-3 rounded-lg bg-[var(--admin-surface-muted)] p-4 md:grid-cols-[180px_1fr_1fr_auto] md:items-end">
          <label className="grid gap-1 text-xs font-semibold text-[var(--admin-ink-soft)]">Delivery stream<select name="stream" className="form-control" defaultValue="weekly"><option value="weekly">North Signal weekly</option><option value="signal_alerts">Defence Signal alerts</option></select></label>
          <label className="grid gap-1 text-xs font-semibold text-[var(--admin-ink-soft)]">Purpose<select name="purpose" className="form-control" defaultValue="production"><option value="production">Published issue</option><option value="verification">Verification only</option></select></label>
          <label className="grid gap-1 text-xs font-semibold text-[var(--admin-ink-soft)]">Issue or edition slug<input name="contentSlug" required maxLength={180} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="form-control" placeholder="issue-or-edition-slug" /></label>
          <label className="grid gap-1 text-xs font-semibold text-[var(--admin-ink-soft)]">MailerLite campaign ID<input name="providerCampaignId" required maxLength={120} pattern="[A-Za-z0-9_-]+" className="form-control" placeholder="campaign-id" /></label>
          <PendingButton unstyled type="submit" pendingLabel="Reading aggregate…" className="inline-flex h-11 items-center justify-center rounded-md bg-[var(--admin-action)] px-4 text-xs font-semibold text-white">Import aggregate</PendingButton>
        </form>
        <p className="mt-2 text-xs leading-5 text-[var(--admin-muted)]">This owner-only action reads the aggregate report for one sent campaign and records a snapshot. It cannot create, schedule, send, edit or cancel a MailerLite campaign and imports no subscriber identity.</p>
      </PublicCard>
      <PublicCard title="North Signal conversion" eyebrow="Consent funnel · last 30 days" className="mt-5">
        <p className="mb-4 text-xs leading-5 text-[var(--admin-muted)]">{activeSubscriberCount === null ? <strong className="text-[var(--admin-ink)]">The active consent-backed subscriber total is unavailable.</strong> : <strong className="text-[var(--admin-ink)]">{activeSubscriberCount} active consent-backed subscribers.</strong>} This live ledger total is reported separately from event counts below.</p>
        {funnelRows.length ? <div className="mb-6 overflow-x-auto" data-newsletter-session-funnels>
          <h3 className="text-sm font-bold text-[var(--admin-ink)]">Distinct ordered session funnels</h3>
          <table className="mt-3 min-w-full text-left text-xs">
            <thead><tr className="border-b border-[var(--admin-border)] text-[var(--admin-muted)]"><th className="px-3 py-2">Window</th><th className="px-3 py-2">Surface</th><th className="px-3 py-2">Placement</th><th className="px-3 py-2">Ordered stages</th></tr></thead>
            <tbody>{funnelRows.map((row) => <tr key={`${row.windowDays}:${row.surface}:${row.placement}`} className="border-b border-[var(--admin-border)]"><td className="px-3 py-2 font-semibold">{row.windowDays} days</td><td className="px-3 py-2">{row.surface.replaceAll("_", " ")}</td><td className="px-3 py-2">{row.placement.replace(/^newsletter_/, "").replaceAll("_", " ")}</td><td className="px-3 py-2 text-[var(--admin-muted-strong)]">{formatFunnelStages(row.stageSessions)}</td></tr>)}</tbody>
          </table>
        </div> : <p className="mb-5 text-xs text-[var(--admin-muted)]">No complete session-attributed newsletter funnel is available for the selected windows.</p>}
        <h3 className="mb-3 text-sm font-bold text-[var(--admin-ink)]">Event diagnostics</h3>
        <div className="grid gap-px overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-border)] sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {newsletterStages.map((stage) => <div key={stage} className="bg-white p-4"><strong className="text-2xl text-[var(--admin-ink)]">{eventCounts.get(stage) ?? 0}</strong><p className="mt-1 text-xs font-semibold text-[var(--admin-muted)]">{newsletterStageLabels[stage]}</p></div>)}
        </div>
        {newsletterPlacements.size ? (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead><tr className="border-b border-[var(--admin-border)] text-[var(--admin-muted)]"><th className="px-3 py-2">Placement</th>{newsletterStages.map((stage) => <th key={stage} className="px-3 py-2">{newsletterStageLabels[stage]}</th>)}</tr></thead>
              <tbody>{Array.from(newsletterPlacements.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([placement, counts]) => <tr key={placement} className="border-b border-[var(--admin-border)]"><td className="px-3 py-2 font-semibold text-[var(--admin-ink)]">{placement.replace(/^newsletter_/, "").replaceAll("_", " ")}</td>{newsletterStages.map((stage) => <td key={stage} className="px-3 py-2 text-[var(--admin-muted-strong)]">{counts.get(stage) ?? 0}</td>)}</tr>)}</tbody>
            </table>
          </div>
        ) : <p className="mt-4 text-xs text-[var(--admin-muted)]">North Signal funnel activity will appear after the updated capture surfaces are live.</p>}
        {newsletterDimensions.size ? <div className="mt-7 overflow-x-auto"><h3 className="text-sm font-bold text-[var(--admin-ink)]">Attribution and route breakdown</h3><table className="mt-3 min-w-full text-left text-xs"><thead><tr className="border-b border-[var(--admin-border)] text-[var(--admin-muted)]"><th className="px-3 py-2">Dimension</th><th className="px-3 py-2">Value</th>{newsletterStages.map((stage) => <th key={stage} className="px-3 py-2">{newsletterStageLabels[stage]}</th>)}</tr></thead><tbody>{Array.from(newsletterDimensions.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([key, counts]) => { const [dimension, value] = key.split("\u0000"); return <tr key={key} className="border-b border-[var(--admin-border)]"><td className="px-3 py-2 font-semibold text-[var(--admin-ink)]">{dimension}</td><td className="px-3 py-2 text-[var(--admin-muted-strong)]">{value}</td>{newsletterStages.map((stage) => <td key={stage} className="px-3 py-2 text-[var(--admin-muted-strong)]">{counts.get(stage) ?? 0}</td>)}</tr>; })}</tbody></table></div> : null}
        <p className="mt-4 text-xs leading-5 text-[var(--admin-muted)]">The stage cards and placement tables above are event-count diagnostics. Conversion uses the distinct ordered sessions table. Historical <code>subscription</code>, placement and combined release-source values remain in the event ledger; new consent completions use <code>newsletter_success</code>.</p>
        <p className="mt-4 text-xs leading-5 text-[var(--admin-muted)]">Events contain bounded route, placement, device and UTM attribution only. Email addresses remain in the private consent ledger and are never attached to behaviour events. Local, staff and explicit QA traffic remains in the raw 30-day ledger but is excluded from these marketing scorecards.</p>
      </PublicCard>
      <PublicCard title="First-week release scorecard" eyebrow="Broader public beta targets" className="mt-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ScorecardItem label="Qualified sessions" target="300" current="Vercel Analytics" />
          <ScorecardItem label="Discovery engagement" target="50%" current="GA4 / Vercel" />
          <ScorecardItem label="Profile reach" target="25%" current={`${eventCounts.get("dossier_open") ?? 0} opens`} />
          <ScorecardItem label="Zero-result searches" target="Below 25%" current={totalSearches ? `${Math.round((zeroSearches / totalSearches) * 100)}%` : "No data"} />
          <ScorecardItem label="North Signal subscribers" target="25" current={activeSubscriberCount === null ? "Unavailable" : String(activeSubscriberCount)} />
          <ScorecardItem label="Useful contributions" target="5" current={submissionCount.error ? "Unavailable" : String(submissionCount.count ?? 0)} />
          <ScorecardItem label="Connection requests" target="3" current={String(connections.data?.length ?? 0)} />
          <ScorecardItem label="Substantive feedback" target="10" current={String(feedback.data?.length ?? 0)} />
        </div>
        <p className="mt-4 text-xs leading-5 text-[var(--admin-muted)]">Session and percentage metrics stay in aggregate analytics. Private workflow records remain in the production consent and operations ledger.</p>
      </PublicCard>

      <PublicCard title="Public submissions" eyebrow="Separate operational queue" className="mt-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-[var(--admin-muted-strong)]">Claims, corrections, and suggested organizations are reviewed in a dedicated queue. An approval records the reviewer decision and marks the submission for separate candidate preparation; it does not change a public profile.</p>
          <Link href="/admin/submissions" prefetch={false} className="atlas-secondary-button shrink-0">Open submissions queue</Link>
        </div>
      </PublicCard>

      <section className="mt-7 space-y-4"><SectionHeading title="Connection requests" detail="Human-vetted introductions only." />{connections.data?.length ? connections.data.map((item) => <WorkflowCard key={item.id} workflow="connection" item={item} statuses={["new", "reviewing", "introduced", "declined", "closed"]} title={`${item.requester_name} → ${item.organization_id}`} body={`${item.intent.replaceAll("_", " ")} · ${item.requester_organization ?? "No organization supplied"}\n${item.requester_email}\n\n${item.message}`} />) : <EmptyCoverage title="No connection requests" detail="Authenticated requests will appear here." />}</section>
      <section className="mt-7 space-y-4"><SectionHeading title="Contact inbox" detail="General, partnership, media, and privacy contact." />{contacts.data?.length ? contacts.data.map((item) => <WorkflowCard key={item.id} workflow="contact" item={item} statuses={["new", "reviewing", "replied", "closed", "spam"]} title={`${item.sender_name} · ${item.category}`} body={`${item.sender_email}${item.organization_name ? ` · ${item.organization_name}` : ""}\n\n${item.message}`} />) : <EmptyCoverage title="No contact messages" detail="Public contact will appear here." />}</section>
      <section className="mt-7 space-y-4"><SectionHeading title="Feedback" detail="Voluntary product feedback." />{feedback.data?.length ? feedback.data.map((item) => <WorkflowCard key={item.id} workflow="feedback" item={item} statuses={["pending", "reviewed", "archived"]} title={item.goal} body={`Worked: ${item.worked ?? "Not supplied"}\n\nMissing: ${item.missing}\n\n${item.contact_email ?? "No follow-up email"} · ${item.context_path}`} />) : <EmptyCoverage title="No feedback" detail="Public-beta feedback will appear here." />}</section>
      <section className="mt-7"><SectionHeading title="Recent searches" detail="Raw text expires after 90 days. Prioritize repeated coverage gaps, weak selections, and slow responses." /><div className="mt-4 space-y-2">{searches.data?.map((item) => { const assistant = assistantMeta(item.resolved_filters); return <div key={item.id} className={`rounded-md border p-3 text-xs ${item.zero_result ? "border-[var(--admin-warning-border-soft)] bg-[var(--admin-warning-soft)]" : "border-[var(--admin-border)] bg-white"}`}><div className="flex items-center justify-between gap-3"><strong>{item.query_text}</strong><span className="flex items-center gap-2">{item.zero_result ? <span className="inline-flex items-center gap-1 font-semibold text-[var(--admin-warning-strong)]"><TriangleAlert aria-hidden="true" className="size-3.5" />Coverage gap</span> : null}<span>{item.result_count} results</span></span></div><p className="mt-1 text-[var(--admin-muted)]">{assistant.mode === "assistant" ? `Ask True North · ${assistant.outcome ?? assistant.fallbackReason ?? "unknown outcome"}${assistant.failureClass ? ` · ${assistant.failureClass.replaceAll("_", " ")}` : ""}${assistant.latencyMs ? ` · ${(assistant.latencyMs / 1000).toFixed(1)}s` : ""}${assistant.inputTokens ? ` · ${assistant.inputTokens} input tokens` : ""}${assistant.candidateCount ? ` · ${assistant.candidateCount} candidates` : ""}` : item.interpretation} · {item.context_path} · {new Date(item.created_at).toLocaleString("en-CA")}</p></div>; })}</div></section>
    </PublicPageShell>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-lg border border-[var(--admin-border)] bg-white p-4"><strong className="text-2xl text-[var(--admin-ink)]">{value}</strong><p className="mt-1 text-xs font-semibold text-[var(--admin-muted)]">{label}</p></div>; }
function ScorecardItem({ label, target, current }: { label: string; target: string; current: string }) { return <div className="border-l-2 border-[var(--atlas-signal)] pl-3"><p className="text-xs font-bold text-[var(--admin-ink)]">{label}</p><p className="mt-1 text-xs text-[var(--admin-muted)]">Target: {target}</p><p className="text-xs text-[var(--admin-muted-strong)]">Current: {current}</p></div>; }
function assistantMeta(value: unknown) {
  const filters = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const raw = filters.__assistant;
  const meta = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  return {
    mode: meta.mode === "assistant" ? "assistant" : null,
    outcome: typeof meta.outcome === "string" ? meta.outcome : null,
    fallbackReason: typeof meta.fallbackReason === "string" ? meta.fallbackReason : null,
    failureClass: typeof meta.failureClass === "string" ? meta.failureClass : null,
    latencyMs: typeof meta.latencyMs === "number" ? meta.latencyMs : null,
    inputTokens: typeof meta.inputTokens === "number" ? meta.inputTokens : null,
    candidateCount: typeof meta.candidateCount === "number" ? meta.candidateCount : null
  };
}
function newsletterSourceMedium(event: NewsletterInsightEvent, metadata: Record<string, unknown>) {
  const source = event.utm_source ?? (typeof metadata.utm_source === "string" ? metadata.utm_source : null);
  const medium = event.utm_medium ?? (typeof metadata.utm_medium === "string" ? metadata.utm_medium : null);
  if (source || medium) return [source || "unknown", medium || "unknown"].join(" / ");
  return typeof metadata.release_source === "string" ? metadata.release_source : "unattributed";
}
async function readAllInsightEvents(admin: ReturnType<typeof createAdminClient>, since: string) {
  const enhancedColumns = "event_name, session_id, context_path, cohort, metadata, occurred_at, received_at, created_at, traffic_class, entry_channel, utm_source, utm_medium, utm_campaign, utm_content";
  const enhanced = await readInsightEventPages(admin, enhancedColumns, since);
  if (!enhanced.error) return { ...enhanced, usedLegacyProjection: false };
  const legacy = await readInsightEventPages(admin, "event_name, session_id, context_path, cohort, metadata, created_at", since);
  return { ...legacy, usedLegacyProjection: true };
}
async function readInsightEventPages(admin: ReturnType<typeof createAdminClient>, columns: string, since: string) {
  const pageSize = 1000;
  const upperResult = await admin.from("pilot_events").select("id, created_at").gte("created_at", since).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle();
  if (upperResult.error) return { data: [], error: upperResult.error };
  if (!upperResult.data) return { data: [], error: null };
  const upperBoundary = `created_at.lt.${upperResult.data.created_at},and(created_at.eq.${upperResult.data.created_at},id.lte.${upperResult.data.id})`;
  const countResult = await admin.from("pilot_events").select("id", { count: "exact", head: true }).gte("created_at", since).or(upperBoundary);
  if (countResult.error) return { data: [], error: countResult.error };
  const pageStarts = Array.from({ length: Math.ceil((countResult.count ?? 0) / pageSize) }, (_, index) => index * pageSize);
  const data: NewsletterInsightEvent[] = [];
  const concurrentPages = 4;
  for (let index = 0; index < pageStarts.length; index += concurrentPages) {
    const results = await Promise.all(pageStarts.slice(index, index + concurrentPages).map((from) =>
      admin.from("pilot_events").select(columns).gte("created_at", since).or(upperBoundary).order("created_at", { ascending: true }).order("id", { ascending: true }).range(from, from + pageSize - 1)
    ));
    const failedPage = results.find((result) => result.error);
    if (failedPage?.error) return { data: [], error: failedPage.error };
    for (const result of results) data.push(...((result.data ?? []) as unknown as NewsletterInsightEvent[]));
  }
  return { data, error: null };
}
function summarizeCampaignMetrics(rows: Array<{ provider_campaign_id: string; observed_at: string; sent: number; delivered: number; estimated_unique_opens: number; unique_clicks: number; bounces: number; unsubscribes: number }>) {
  const latest = new Map<string, (typeof rows)[number]>();
  for (const row of [...rows].sort((left, right) => Date.parse(right.observed_at) - Date.parse(left.observed_at))) {
    if (!latest.has(row.provider_campaign_id)) latest.set(row.provider_campaign_id, row);
  }
  return Array.from(latest.values()).reduce((summary, row) => ({
    sent: summary.sent + row.sent,
    delivered: summary.delivered + row.delivered,
    estimatedUniqueOpens: summary.estimatedUniqueOpens + row.estimated_unique_opens,
    uniqueClicks: summary.uniqueClicks + row.unique_clicks,
    bounces: summary.bounces + row.bounces,
    unsubscribes: summary.unsubscribes + row.unsubscribes
  }), { sent: 0, delivered: 0, estimatedUniqueOpens: 0, uniqueClicks: 0, bounces: 0, unsubscribes: 0 });
}
function latestCampaignMetricObservation(rows: Array<{ observed_at: string }>) {
  return rows.reduce<string | null>((latest, row) => !latest || Date.parse(row.observed_at) > Date.parse(latest) ? row.observed_at : latest, null);
}
function formatFunnelStages(stages: Record<string, number>) {
  const labels: Record<string, string> = {
    newsletter_landing_view: "landing",
    newsletter_impression: "shown",
    newsletter_open: "opened",
    newsletter_form_start: "started",
    newsletter_submit: "submitted",
    newsletter_success: "consent"
  };
  return Object.entries(stages).map(([stage, count]) => `${labels[stage] ?? stage}: ${count}`).join(" → ");
}
function AvailabilityState({ title, state, detail }: { title: string; state: string; detail: string }) { return <div className="rounded-lg bg-[var(--admin-surface-muted)] p-4"><p className="text-xs font-semibold text-[var(--admin-muted)]">{title}</p><strong className="mt-1 block text-sm text-[var(--admin-ink)]">{state}</strong><p className="mt-2 text-xs leading-5 text-[var(--admin-muted-strong)]">{detail}</p></div>; }
function marketingEventLabel(event: string) {
  const labels: Record<string, string> = {
    result_select: "Result selected",
    dossier_open: "Dossier opened",
    evidence_open: "Source opened",
    save: "Saved",
    feedback: "Feedback",
    submission: "Contribution",
    connection: "Connection",
    newsletter_form_start: "Signal form",
    newsletter_success: "Signal joined"
  };
  return labels[event] ?? event.replaceAll("_", " ");
}
function SectionHeading({ title, detail }: { title: string; detail: string }) { return <div><h2 className="text-lg font-bold text-[var(--admin-ink)]">{title}</h2><p className="mt-1 text-xs text-[var(--admin-muted)]">{detail}</p></div>; }
function WorkflowCard({ workflow, item, statuses, title, body }: { workflow: "connection" | "contact" | "feedback"; item: { id: string | number; status: string; created_at: string; reviewer_notes?: string | null }; statuses: string[]; title: string; body: string }) { return <PublicCard title={title} eyebrow={`${item.status} · ${new Date(item.created_at).toLocaleString("en-CA")}`}><pre className="whitespace-pre-wrap rounded-md bg-[var(--admin-surface-muted)] p-3 text-xs leading-5 text-[var(--admin-muted-strong)]">{body}</pre><form action={updateBetaWorkflow} className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end"><input type="hidden" name="workflow" value={workflow} /><input type="hidden" name="id" value={item.id} /><label className="grid gap-1 text-xs font-semibold text-[var(--admin-ink-soft)]">Private reviewer notes<input name="notes" maxLength={4000} defaultValue={item.reviewer_notes ?? ""} className="form-control" /></label><label className="grid gap-1 text-xs font-semibold text-[var(--admin-ink-soft)]">Status<select name="status" defaultValue={item.status} className="form-control">{statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label><PendingButton unstyled type="submit" pendingLabel="Saving…" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--admin-evidence)] px-4 text-xs font-semibold text-white">Save</PendingButton></form></PublicCard>; }
