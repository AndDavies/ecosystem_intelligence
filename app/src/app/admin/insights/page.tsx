import { TriangleAlert } from "lucide-react";
import { AdminNav } from "@/components/atlas/admin-nav";
import { EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PendingButton } from "@/components/ui/pending-button";
import { updateBetaWorkflow } from "@/lib/actions/beta-admin";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildMarketingCampaignBreakdown, isMarketingScorecardEvent, localFounderPilotPreviewEvents, meaningfulMarketingEvents } from "@/lib/product-insights/marketing-scorecard";

export const dynamic = "force-dynamic";

export default async function AdminInsightsPage({ searchParams }: { searchParams: Promise<{ error?: string; preview?: string }> }) {
  const user = await requireAtlasStaff("editor");
  const params = await searchParams;
  const admin = createAdminClient();
  const [connections, contacts, submissions, feedback, subscribers, searches, events] = await Promise.all([
    admin.from("connection_requests").select("id, organization_id, requester_name, requester_organization, requester_email, intent, message, status, reviewer_notes, created_at").order("created_at", { ascending: false }).limit(100),
    admin.from("contact_messages").select("id, category, sender_name, sender_email, organization_name, message, status, reviewer_notes, created_at").order("created_at", { ascending: false }).limit(100),
    admin.from("submissions").select("id, owner_id, submission_type, target_entity_type, target_entity_id, submitted_payload, status, created_at").order("created_at", { ascending: false }).limit(100),
    admin.from("pilot_feedback").select("id, goal, worked, missing, contact_email, context_path, status, created_at").order("created_at", { ascending: false }).limit(100),
    admin.from("pilot_update_signups").select("id", { count: "exact", head: true }).eq("status", "subscribed"),
    admin.from("pilot_searches").select("id, query_text, interpretation, resolved_filters, result_count, zero_result, context_path, created_at").order("created_at", { ascending: false }).limit(100),
    admin.from("pilot_events").select("event_name, session_id, context_path, cohort, metadata, created_at").gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).limit(5000)
  ]);

  const showLocalMarketingPreview = process.env.NODE_ENV === "development" && params.preview === "founder-pilot";
  const scorecardEvents = [...(events.data ?? []), ...(showLocalMarketingPreview ? localFounderPilotPreviewEvents() : [])].filter(isMarketingScorecardEvent);
  const marketingCampaignRows = buildMarketingCampaignBreakdown(scorecardEvents);
  const eventCounts = new Map<string, number>();
  for (const event of scorecardEvents) eventCounts.set(event.event_name, (eventCounts.get(event.event_name) ?? 0) + 1);
  const totalSearches = searches.data?.length ?? 0;
  const zeroSearches = searches.data?.filter((item) => item.zero_result).length ?? 0;
  const assistantSearches = (searches.data ?? []).map((item) => assistantMeta(item.resolved_filters)).filter((item) => item.mode === "assistant");
  const coverageGaps = assistantSearches.filter((item) => item.outcome === "coverage_gap").length;
  const assistantLatency = assistantSearches.map((item) => item.latencyMs).filter((value): value is number => typeof value === "number");
  const averageLatency = assistantLatency.length ? Math.round(assistantLatency.reduce((sum, value) => sum + value, 0) / assistantLatency.length) : 0;
  const newsletterStages = ["newsletter_landing_view", "newsletter_cta_click", "newsletter_sample_open", "newsletter_form_start", "newsletter_submit", "newsletter_success", "newsletter_error", "newsletter_dismiss"] as const;
  const newsletterStageLabels: Record<(typeof newsletterStages)[number], string> = {
    newsletter_landing_view: "Landing views",
    newsletter_cta_click: "CTA clicks",
    newsletter_sample_open: "Sample clicks",
    newsletter_form_start: "Form started",
    newsletter_submit: "Submit attempted",
    newsletter_success: "Consent succeeded",
    newsletter_error: "Errors",
    newsletter_dismiss: "Dismissals"
  };
  const newsletterEvents = scorecardEvents.filter((event) => newsletterStages.includes(event.event_name as (typeof newsletterStages)[number]) || event.event_name.startsWith("newsletter_") || event.event_name === "subscription");
  const newsletterPlacements = new Map<string, Map<string, number>>();
  const newsletterDimensions = new Map<string, Map<string, number>>();
  for (const event of newsletterEvents) {
    const metadata = event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata) ? event.metadata as Record<string, unknown> : {};
    const placement = typeof metadata.placement === "string" ? metadata.placement : typeof metadata.source === "string" ? metadata.source : "unknown";
    const counts = newsletterPlacements.get(placement) ?? new Map<string, number>();
    counts.set(event.event_name, (counts.get(event.event_name) ?? 0) + 1);
    newsletterPlacements.set(placement, counts);
    const dimensions = {
      Route: event.context_path || "unknown",
      Device: typeof metadata.device_class === "string" ? metadata.device_class : "unknown",
      "Source / medium": newsletterSourceMedium(metadata),
      Campaign: event.cohort || "unattributed"
    };
    for (const [dimension, value] of Object.entries(dimensions)) {
      const key = `${dimension}\u0000${value}`;
      const dimensionCounts = newsletterDimensions.get(key) ?? new Map<string, number>();
      dimensionCounts.set(event.event_name, (dimensionCounts.get(event.event_name) ?? 0) + 1);
      newsletterDimensions.set(key, dimensionCounts);
    }
  }

  return (
    <PublicPageShell variant="admin" eyebrow="Private administration" title="Public-beta operations" description="Review participation, learn from discovery behaviour, and progress private workflows without turning the product into a CRM." actions={<span className="rounded bg-[var(--admin-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--admin-muted-strong)]">{user.role} · {user.email}</span>}>
      <AdminNav />
      {showLocalMarketingPreview ? <div className="mb-5 rounded-md bg-[var(--admin-signal-soft)] px-3 py-2 text-xs font-semibold text-[var(--admin-ink)]">Local preview only · non-personal founder-pilot test events are projected in the scorecard and are not written to Supabase.</div> : null}
      {params.error ? <div className="mb-5 rounded-md border border-[var(--admin-danger-border)] bg-[var(--admin-danger-soft)] px-3 py-2 text-sm text-[var(--admin-danger)]">That review update could not be saved.</div> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Subscribers" value={subscribers.count ?? 0} />
        <Metric label="Searches (90d)" value={totalSearches} />
        <Metric label="Zero-result rate" value={totalSearches ? `${Math.round((zeroSearches / totalSearches) * 100)}%` : "0%"} />
        <Metric label="Ask True North runs" value={assistantSearches.length} />
        <Metric label="Assistant coverage gaps" value={coverageGaps} />
        <Metric label="Average assistant latency" value={averageLatency ? `${(averageLatency / 1000).toFixed(1)}s` : "No data"} />
        <Metric label="Contributions" value={submissions.data?.length ?? 0} />
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
        <p className="mt-4 text-xs leading-5 text-[var(--admin-muted)]">Pilot convention: <code>utm_source=linkedin|x|tnm_linkedin|approved_partner_slug</code>, <code>utm_medium=founder_social|company_social|earned_partner</code>, <code>utm_campaign=tnm_founder_pilot_v1</code>, and <code>utm_content=&lt;topic_slug&gt;_&lt;post_type&gt;</code>.</p>
      </PublicCard>
      <PublicCard title="North Signal conversion" eyebrow="Consent funnel · last 30 days" className="mt-5">
        <p className="mb-4 text-xs leading-5 text-[var(--admin-muted)]"><strong className="text-[var(--admin-ink)]">{subscribers.count ?? 0} active consent-backed subscribers.</strong> This live ledger total is reported separately from event counts below.</p>
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
        <p className="mt-4 text-xs leading-5 text-[var(--admin-muted)]">Historical <code>subscription</code>, placement and combined release-source values remain in the event ledger and placement table; new consent completions use <code>newsletter_success</code>.</p>
        <p className="mt-4 text-xs leading-5 text-[var(--admin-muted)]">Events contain bounded route, placement, device and UTM attribution only. Email addresses remain in the private consent ledger and are never attached to behaviour events. Local, staff and explicit QA traffic remains in the raw 30-day ledger but is excluded from these marketing scorecards.</p>
      </PublicCard>
      <PublicCard title="First-week release scorecard" eyebrow="Broader public beta targets" className="mt-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ScorecardItem label="Qualified sessions" target="300" current="Vercel Analytics" />
          <ScorecardItem label="Discovery engagement" target="50%" current="GA4 / Vercel" />
          <ScorecardItem label="Profile reach" target="25%" current={`${eventCounts.get("dossier_open") ?? 0} opens`} />
          <ScorecardItem label="Zero-result searches" target="Below 25%" current={totalSearches ? `${Math.round((zeroSearches / totalSearches) * 100)}%` : "No data"} />
          <ScorecardItem label="North Signal subscribers" target="25" current={String(subscribers.count ?? 0)} />
          <ScorecardItem label="Useful contributions" target="5" current={String(submissions.data?.length ?? 0)} />
          <ScorecardItem label="Connection requests" target="3" current={String(connections.data?.length ?? 0)} />
          <ScorecardItem label="Substantive feedback" target="10" current={String(feedback.data?.length ?? 0)} />
        </div>
        <p className="mt-4 text-xs leading-5 text-[var(--admin-muted)]">Session and percentage metrics stay in aggregate analytics. Private workflow records remain in the production consent and operations ledger.</p>
      </PublicCard>

      <section className="mt-7 space-y-4"><SectionHeading title="Connection requests" detail="Human-vetted introductions only." />{connections.data?.length ? connections.data.map((item) => <WorkflowCard key={item.id} workflow="connection" item={item} statuses={["new", "reviewing", "introduced", "declined", "closed"]} title={`${item.requester_name} → ${item.organization_id}`} body={`${item.intent.replaceAll("_", " ")} · ${item.requester_organization ?? "No organization supplied"}\n${item.requester_email}\n\n${item.message}`} />) : <EmptyCoverage title="No connection requests" detail="Authenticated requests will appear here." />}</section>
      <section className="mt-7 space-y-4"><SectionHeading title="Contact inbox" detail="General, partnership, media, and privacy contact." />{contacts.data?.length ? contacts.data.map((item) => <WorkflowCard key={item.id} workflow="contact" item={item} statuses={["new", "reviewing", "replied", "closed", "spam"]} title={`${item.sender_name} · ${item.category}`} body={`${item.sender_email}${item.organization_name ? ` · ${item.organization_name}` : ""}\n\n${item.message}`} />) : <EmptyCoverage title="No contact messages" detail="Public contact will appear here." />}</section>
      <section className="mt-7 space-y-4"><SectionHeading title="Profile contributions" detail="Claims, corrections, and suggested organizations. The review-interface gap is now closed." />{submissions.data?.length ? submissions.data.map((item) => <WorkflowCard key={item.id} workflow="submission" item={item} statuses={["pending", "in_review", "approved", "rejected"]} title={item.submission_type.replaceAll("_", " ")} body={JSON.stringify(item.submitted_payload, null, 2)} />) : <EmptyCoverage title="No contributions" detail="Authenticated profile submissions will appear here." />}</section>
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
function newsletterSourceMedium(metadata: Record<string, unknown>) {
  const source = typeof metadata.utm_source === "string" ? metadata.utm_source : null;
  const medium = typeof metadata.utm_medium === "string" ? metadata.utm_medium : null;
  if (source || medium) return [source || "unknown", medium || "unknown"].join(" / ");
  return typeof metadata.release_source === "string" ? metadata.release_source : "unattributed";
}
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
function WorkflowCard({ workflow, item, statuses, title, body }: { workflow: "connection" | "contact" | "submission" | "feedback"; item: { id: string | number; status: string; created_at: string; reviewer_notes?: string | null }; statuses: string[]; title: string; body: string }) { return <PublicCard title={title} eyebrow={`${item.status} · ${new Date(item.created_at).toLocaleString("en-CA")}`}><pre className="whitespace-pre-wrap rounded-md bg-[var(--admin-surface-muted)] p-3 text-xs leading-5 text-[var(--admin-muted-strong)]">{body}</pre><form action={updateBetaWorkflow} className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end"><input type="hidden" name="workflow" value={workflow} /><input type="hidden" name="id" value={item.id} /><label className="grid gap-1 text-xs font-semibold text-[var(--admin-ink-soft)]">Private reviewer notes<input name="notes" maxLength={4000} defaultValue={item.reviewer_notes ?? ""} className="form-control" /></label><label className="grid gap-1 text-xs font-semibold text-[var(--admin-ink-soft)]">Status<select name="status" defaultValue={item.status} className="form-control">{statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label><PendingButton unstyled type="submit" pendingLabel="Saving…" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--admin-evidence)] px-4 text-xs font-semibold text-white">Save</PendingButton></form></PublicCard>; }
