import Link from "next/link";
import { Download } from "lucide-react";
import { AdminNav } from "@/components/atlas/admin-nav";
import { EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
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
    admin.from("pilot_update_signups").select("id, email, status, source, consent_version, created_at").order("created_at", { ascending: false }).limit(100),
    admin.from("pilot_searches").select("id, query_text, interpretation, resolved_filters, result_count, zero_result, context_path, created_at").order("created_at", { ascending: false }).limit(100),
    admin.from("pilot_events").select("event_name, created_at").gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).limit(5000)
  ]);

  const eventCounts = new Map<string, number>();
  for (const event of events.data ?? []) eventCounts.set(event.event_name, (eventCounts.get(event.event_name) ?? 0) + 1);
  const totalSearches = searches.data?.length ?? 0;
  const zeroSearches = searches.data?.filter((item) => item.zero_result).length ?? 0;

  return (
    <PublicPageShell variant="admin" eyebrow="Private administration" title="Public-beta operations" description="Review participation, learn from discovery behaviour, and progress private workflows without turning the product into a CRM." actions={<span className="rounded bg-[#f2f4f7] px-3 py-2 text-xs font-semibold text-[#475467]">{user.role} · {user.email}</span>}>
      <AdminNav />
      {params.error ? <div className="mb-5 rounded-md border border-[#fda29b] bg-[#fff6f5] px-3 py-2 text-sm text-[#b42318]">That review update could not be saved.</div> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Subscribers" value={subscribers.data?.filter((item) => item.status === "subscribed").length ?? 0} />
        <Metric label="Searches (90d)" value={totalSearches} />
        <Metric label="Zero-result rate" value={totalSearches ? `${Math.round((zeroSearches / totalSearches) * 100)}%` : "0%"} />
        <Metric label="Contributions" value={submissions.data?.length ?? 0} />
        <Metric label="Connection requests" value={connections.data?.length ?? 0} />
      </div>
      <PublicCard title="Workflow funnel" eyebrow="Meaningful events · last 30 days" className="mt-5"><div className="flex flex-wrap gap-2">{["atlas_search", "result_select", "dossier_open", "evidence_open", "export", "save", "submission", "connection", "subscription", "feedback"].map((name) => <span key={name} className="rounded-md border border-[#d0d5dd] bg-[#f8fafc] px-3 py-2 text-xs"><strong>{eventCounts.get(name) ?? 0}</strong> {name.replaceAll("_", " ")}</span>)}</div></PublicCard>

      <section className="mt-7 space-y-4"><SectionHeading title="Connection requests" detail="Human-vetted introductions only." />{connections.data?.length ? connections.data.map((item) => <WorkflowCard key={item.id} workflow="connection" item={item} statuses={["new", "reviewing", "introduced", "declined", "closed"]} title={`${item.requester_name} → ${item.organization_id}`} body={`${item.intent.replaceAll("_", " ")} · ${item.requester_organization ?? "No organization supplied"}\n${item.requester_email}\n\n${item.message}`} />) : <EmptyCoverage title="No connection requests" detail="Authenticated requests will appear here." />}</section>
      <section className="mt-7 space-y-4"><SectionHeading title="Contact inbox" detail="General, partnership, media, and privacy contact." />{contacts.data?.length ? contacts.data.map((item) => <WorkflowCard key={item.id} workflow="contact" item={item} statuses={["new", "reviewing", "replied", "closed", "spam"]} title={`${item.sender_name} · ${item.category}`} body={`${item.sender_email}${item.organization_name ? ` · ${item.organization_name}` : ""}\n\n${item.message}`} />) : <EmptyCoverage title="No contact messages" detail="Public contact will appear here." />}</section>
      <section className="mt-7 space-y-4"><SectionHeading title="Profile contributions" detail="Claims, corrections, and suggested organizations. The review-interface gap is now closed." />{submissions.data?.length ? submissions.data.map((item) => <WorkflowCard key={item.id} workflow="submission" item={item} statuses={["pending", "in_review", "approved", "rejected"]} title={item.submission_type.replaceAll("_", " ")} body={JSON.stringify(item.submitted_payload, null, 2)} />) : <EmptyCoverage title="No contributions" detail="Authenticated profile submissions will appear here." />}</section>
      <section className="mt-7 space-y-4"><SectionHeading title="Feedback" detail="Voluntary product feedback." />{feedback.data?.length ? feedback.data.map((item) => <WorkflowCard key={item.id} workflow="feedback" item={item} statuses={["pending", "reviewed", "archived"]} title={item.goal} body={`Worked: ${item.worked ?? "Not supplied"}\n\nMissing: ${item.missing}\n\n${item.contact_email ?? "No follow-up email"} · ${item.context_path}`} />) : <EmptyCoverage title="No feedback" detail="Public-beta feedback will appear here." />}</section>
      <section className="mt-7"><div className="flex items-center justify-between gap-3"><SectionHeading title="Subscribers" detail="Consent-backed list. Do not send until sender and unsubscribe are configured." /><Link href="/api/admin/subscribers" className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-3 text-xs font-semibold text-[#344054] no-underline"><Download className="size-4" />Export CSV</Link></div><div className="mt-4 overflow-x-auto rounded-lg border border-[#d0d5dd] bg-white"><table className="min-w-full text-left text-xs"><thead className="bg-[#f8fafc] text-[#667085]"><tr><th className="p-3">Email</th><th className="p-3">Status</th><th className="p-3">Source</th><th className="p-3">Consent</th><th className="p-3">Created</th></tr></thead><tbody>{subscribers.data?.map((item) => <tr key={item.id} className="border-t border-[#eaecf0]"><td className="p-3">{item.email}</td><td className="p-3">{item.status}</td><td className="p-3">{item.source}</td><td className="p-3">{item.consent_version}</td><td className="p-3">{new Date(item.created_at).toLocaleDateString("en-CA")}</td></tr>)}</tbody></table></div></section>
      <section className="mt-7"><SectionHeading title="Recent searches" detail="Raw text expires after 90 days. Prioritize repeated zero-result themes." /><div className="mt-4 space-y-2">{searches.data?.map((item) => <div key={item.id} className={`rounded-md border p-3 text-xs ${item.zero_result ? "border-[#fedf89] bg-[#fffaeb]" : "border-[#d0d5dd] bg-white"}`}><div className="flex items-center justify-between gap-3"><strong>{item.query_text}</strong><span>{item.result_count} results</span></div><p className="mt-1 text-[#667085]">{item.interpretation} · {item.context_path} · {new Date(item.created_at).toLocaleString("en-CA")}</p></div>)}</div></section>
    </PublicPageShell>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-lg border border-[#d0d5dd] bg-white p-4"><strong className="text-2xl text-[#101828]">{value}</strong><p className="mt-1 text-xs font-semibold text-[#667085]">{label}</p></div>; }
function SectionHeading({ title, detail }: { title: string; detail: string }) { return <div><h2 className="text-lg font-bold text-[#101828]">{title}</h2><p className="mt-1 text-xs text-[#667085]">{detail}</p></div>; }
function WorkflowCard({ workflow, item, statuses, title, body }: { workflow: "connection" | "contact" | "submission" | "feedback"; item: { id: string | number; status: string; created_at: string; reviewer_notes?: string | null }; statuses: string[]; title: string; body: string }) { return <PublicCard title={title} eyebrow={`${item.status} · ${new Date(item.created_at).toLocaleString("en-CA")}`}><pre className="whitespace-pre-wrap rounded-md bg-[#f8fafc] p-3 text-xs leading-5 text-[#475467]">{body}</pre><form action={updateBetaWorkflow} className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end"><input type="hidden" name="workflow" value={workflow} /><input type="hidden" name="id" value={item.id} /><label className="grid gap-1 text-xs font-semibold text-[#344054]">Private reviewer notes<input name="notes" maxLength={4000} defaultValue={item.reviewer_notes ?? ""} className="form-control" /></label><label className="grid gap-1 text-xs font-semibold text-[#344054]">Status<select name="status" defaultValue={item.status} className="form-control">{statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label><button className="h-11 rounded-md bg-[#007f98] px-4 text-xs font-semibold text-white">Save</button></form></PublicCard>; }
