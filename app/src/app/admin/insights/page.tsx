import { TriangleAlert } from "lucide-react";
import { AdminNav } from "@/components/atlas/admin-nav";
import { EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PendingButton } from "@/components/ui/pending-button";
import { updateBetaWorkflow } from "@/lib/actions/beta-admin";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminInsightsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
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
    admin.from("pilot_events").select("event_name, created_at").gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).limit(5000)
  ]);

  const eventCounts = new Map<string, number>();
  for (const event of events.data ?? []) eventCounts.set(event.event_name, (eventCounts.get(event.event_name) ?? 0) + 1);
  const totalSearches = searches.data?.length ?? 0;
  const zeroSearches = searches.data?.filter((item) => item.zero_result).length ?? 0;
  const assistantSearches = (searches.data ?? []).map((item) => assistantMeta(item.resolved_filters)).filter((item) => item.mode === "assistant");
  const coverageGaps = assistantSearches.filter((item) => item.outcome === "coverage_gap").length;
  const assistantLatency = assistantSearches.map((item) => item.latencyMs).filter((value): value is number => typeof value === "number");
  const averageLatency = assistantLatency.length ? Math.round(assistantLatency.reduce((sum, value) => sum + value, 0) / assistantLatency.length) : 0;

  return (
    <PublicPageShell variant="admin" eyebrow="Private administration" title="Public-beta operations" description="Review participation, learn from discovery behaviour, and progress private workflows without turning the product into a CRM." actions={<span className="rounded bg-[var(--admin-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--admin-muted-strong)]">{user.role} · {user.email}</span>}>
      <AdminNav />
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
      <PublicCard title="First-week release scorecard" eyebrow="Broader public beta targets" className="mt-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ScorecardItem label="Qualified sessions" target="300" current="Vercel Analytics" />
          <ScorecardItem label="Discovery engagement" target="50%" current="GA4 / Vercel" />
          <ScorecardItem label="Profile reach" target="25%" current={`${eventCounts.get("dossier_open") ?? 0} opens`} />
          <ScorecardItem label="Zero-result searches" target="Below 25%" current={totalSearches ? `${Math.round((zeroSearches / totalSearches) * 100)}%` : "No data"} />
          <ScorecardItem label="Update subscribers" target="25" current={String(subscribers.count ?? 0)} />
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
function SectionHeading({ title, detail }: { title: string; detail: string }) { return <div><h2 className="text-lg font-bold text-[var(--admin-ink)]">{title}</h2><p className="mt-1 text-xs text-[var(--admin-muted)]">{detail}</p></div>; }
function WorkflowCard({ workflow, item, statuses, title, body }: { workflow: "connection" | "contact" | "submission" | "feedback"; item: { id: string | number; status: string; created_at: string; reviewer_notes?: string | null }; statuses: string[]; title: string; body: string }) { return <PublicCard title={title} eyebrow={`${item.status} · ${new Date(item.created_at).toLocaleString("en-CA")}`}><pre className="whitespace-pre-wrap rounded-md bg-[var(--admin-surface-muted)] p-3 text-xs leading-5 text-[var(--admin-muted-strong)]">{body}</pre><form action={updateBetaWorkflow} className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end"><input type="hidden" name="workflow" value={workflow} /><input type="hidden" name="id" value={item.id} /><label className="grid gap-1 text-xs font-semibold text-[var(--admin-ink-soft)]">Private reviewer notes<input name="notes" maxLength={4000} defaultValue={item.reviewer_notes ?? ""} className="form-control" /></label><label className="grid gap-1 text-xs font-semibold text-[var(--admin-ink-soft)]">Status<select name="status" defaultValue={item.status} className="form-control">{statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label><PendingButton unstyled type="submit" pendingLabel="Saving…" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--admin-evidence)] px-4 text-xs font-semibold text-white">Save</PendingButton></form></PublicCard>; }
