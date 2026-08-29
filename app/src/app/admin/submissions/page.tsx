import Link from "next/link";
import { ExternalLink, FileCheck2, ShieldCheck } from "lucide-react";
import { AdminNav } from "@/components/atlas/admin-nav";
import { EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { FlashBanner } from "@/components/ui/flash-banner";
import { PaginationNav } from "@/components/ui/pagination-nav";
import { PendingButton } from "@/components/ui/pending-button";
import { reviewPublicSubmission } from "@/lib/actions/submissions-admin";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const pageSize = 20;
const statuses = ["active", "pending", "in_review", "approved", "rejected", "withdrawn", "all"] as const;
const submissionTypes = ["all", "profile_claim", "correction", "new_organization"] as const;
type SubmissionStatusFilter = (typeof statuses)[number];
type SubmissionTypeFilter = (typeof submissionTypes)[number];

type SubmissionRow = {
  id: string;
  submission_type: "profile_claim" | "correction" | "new_organization";
  target_entity_type: string | null;
  target_entity_id: string | null;
  submitted_payload: unknown;
  status: "pending" | "in_review" | "approved" | "rejected" | "withdrawn";
  created_at: string;
  updated_at: string;
};

type DecisionRow = {
  submission_id: string;
  decision: string;
  rationale: string;
  created_at: string;
};

type OrganizationRow = { id: string; name: string; slug: string };

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage({ searchParams }: { searchParams: Promise<{ status?: string; type?: string; page?: string; success?: string; error?: string }> }) {
  const user = await requireAtlasStaff("reviewer");
  const params = await searchParams;
  const status: SubmissionStatusFilter = statuses.includes(params.status as SubmissionStatusFilter) ? params.status as SubmissionStatusFilter : "active";
  const submissionType: SubmissionTypeFilter = submissionTypes.includes(params.type as SubmissionTypeFilter) ? params.type as SubmissionTypeFilter : "all";
  const requestedPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const admin = createAdminClient();

  let countQuery = admin.from("submissions").select("id", { count: "exact", head: true });
  if (status === "active") countQuery = countQuery.in("status", ["pending", "in_review"]);
  else if (status !== "all") countQuery = countQuery.eq("status", status);
  if (submissionType !== "all") countQuery = countQuery.eq("submission_type", submissionType);
  const countResult = await countQuery;
  if (countResult.error) throw new Error(`Unable to count public submissions: ${countResult.error.message}`);
  const total = countResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const rangeStart = (page - 1) * pageSize;

  let submissions: SubmissionRow[] = [];
  if (total > 0) {
    let rowsQuery = admin
      .from("submissions")
      .select("id, submission_type, target_entity_type, target_entity_id, submitted_payload, status, created_at, updated_at")
      .order("created_at", { ascending: false })
      .range(rangeStart, rangeStart + pageSize - 1);
    if (status === "active") rowsQuery = rowsQuery.in("status", ["pending", "in_review"]);
    else if (status !== "all") rowsQuery = rowsQuery.eq("status", status);
    if (submissionType !== "all") rowsQuery = rowsQuery.eq("submission_type", submissionType);
    const rowsResult = await rowsQuery;
    if (rowsResult.error) throw new Error(`Unable to load public submissions: ${rowsResult.error.message}`);
    submissions = (rowsResult.data ?? []) as SubmissionRow[];
  }

  const submissionIds = submissions.map((submission) => submission.id);
  const targetIds = Array.from(new Set(submissions.map((submission) => submission.target_entity_id).filter((id): id is string => Boolean(id))));
  const [decisionsResult, organizationsResult] = await Promise.all([
    submissionIds.length
      ? admin.from("review_decisions").select("submission_id, decision, rationale, created_at").in("submission_id", submissionIds).order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    targetIds.length
      ? admin.from("organizations").select("id, name, slug").in("id", targetIds)
      : Promise.resolve({ data: [], error: null })
  ]);
  if (decisionsResult.error) throw new Error(`Unable to load submission decisions: ${decisionsResult.error.message}`);
  if (organizationsResult.error) throw new Error(`Unable to load submission targets: ${organizationsResult.error.message}`);
  const decisionsBySubmission = new Map<string, DecisionRow[]>();
  for (const decision of (decisionsResult.data ?? []) as DecisionRow[]) {
    const rows = decisionsBySubmission.get(decision.submission_id) ?? [];
    rows.push(decision);
    decisionsBySubmission.set(decision.submission_id, rows);
  }
  const organizationsById = new Map(((organizationsResult.data ?? []) as OrganizationRow[]).map((organization) => [organization.id, organization]));

  return (
    <PublicPageShell variant="admin" eyebrow="Private review workspace" title="Public submissions" description="Review signed-in claims, corrections, and organization suggestions without confusing workflow approval with publication." backHref="/admin" backLabel="Admin home" actions={<span className="rounded bg-[var(--admin-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--admin-muted-strong)]">{user.role} · {user.email}</span>}>
      <AdminNav />
      {params.success ? <FlashBanner tone="success">Submission moved to {params.success.replaceAll("_", " ")}. The public atlas was not changed.{params.success === "approved" ? <> <Link href="/admin/submissions?status=approved" prefetch={false} className="font-semibold underline">Open approved submissions</Link> when you are ready to prepare the governed research handoff.</> : null}</FlashBanner> : null}
      {params.error ? <FlashBanner tone="error">{params.error === "invalid" ? "Choose a valid action and record at least 20 characters of reviewer rationale." : params.error === "stale" ? "This submission changed while it was open. Review its current state before deciding again." : "The submission decision could not be saved. No public data changed."}</FlashBanner> : null}

      <PublicCard title="Review boundary" eyebrow="Decision recorded · publication separate" className="mb-5">
        <div className="flex items-start gap-3">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--admin-evidence)]" />
          <div>
            <p className="text-sm leading-6 text-[var(--admin-muted-strong)]"><strong className="text-[var(--admin-ink)]">Approve for candidate preparation</strong> records that a submission is worth carrying into the governed research workflow. It does not create, alter, or publish an organization or capability. Research validation, Admin Review, and the separate Publish checkpoint still apply.</p>
            <p className="mt-2 text-xs leading-5 text-[var(--admin-muted)]">Every action requires rationale and records a reviewer decision plus an audit event. Concurrent or stale decisions fail closed.</p>
          </div>
        </div>
      </PublicCard>

      <form method="get" className="mb-5 grid gap-3 rounded-lg bg-[var(--admin-surface-muted)] p-4 sm:grid-cols-[minmax(180px,240px)_minmax(180px,240px)_auto] sm:items-end">
        <label className="grid gap-1 text-xs font-semibold text-[var(--admin-ink-soft)]">Status<select name="status" defaultValue={status} className="form-control">{statuses.map((value) => <option key={value} value={value}>{value === "active" ? "Needs a decision" : value.replaceAll("_", " ")}</option>)}</select></label>
        <label className="grid gap-1 text-xs font-semibold text-[var(--admin-ink-soft)]">Submission type<select name="type" defaultValue={submissionType} className="form-control">{submissionTypes.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
        <button className="h-11 rounded-md bg-[var(--admin-action)] px-4 text-sm font-semibold text-white hover:bg-[var(--admin-action-hover)]">Apply filters</button>
      </form>

      <div className="mb-3 flex items-center justify-between text-xs text-[var(--admin-muted)]">
        <span>{total} {status === "active" ? "submission(s) needing a decision" : `${status.replaceAll("_", " ")} submission(s)`}</span>
        {(status !== "active" || submissionType !== "all") ? <Link href="/admin/submissions" prefetch={false} className="font-semibold text-[var(--admin-action)]">Clear filters</Link> : null}
      </div>

      {submissions.length ? <div className="space-y-4">
        {submissions.map((submission) => {
          const payload = submissionPayload(submission.submitted_payload);
          const target = submission.target_entity_id ? organizationsById.get(submission.target_entity_id) : null;
          const decisions = decisionsBySubmission.get(submission.id) ?? [];
          const active = submission.status === "pending" || submission.status === "in_review";
          return <PublicCard key={submission.id} title={payload.subject || submission.submission_type.replaceAll("_", " ")} eyebrow={`${submission.submission_type.replaceAll("_", " ")} · ${submission.status.replaceAll("_", " ")} · ${new Date(submission.created_at).toLocaleString("en-CA")}`}>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--admin-muted-strong)]">{payload.details || "No submission details were recorded."}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs">
                  {target ? <Link href={`/organizations/${target.slug}`} prefetch={false} target="_blank" className="inline-flex items-center gap-1 font-semibold text-[var(--admin-action)]">Target: {target.name}<ExternalLink aria-hidden="true" className="size-3.5" /></Link> : <span className="text-[var(--admin-muted)]">Target: new organization suggestion</span>}
                  {payload.evidenceUrl ? <a href={payload.evidenceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[var(--admin-action)]">Open submitted evidence<ExternalLink aria-hidden="true" className="size-3.5" /></a> : <span className="text-[var(--admin-muted)]">No evidence URL supplied</span>}
                  {payload.submitterRole ? <span className="text-[var(--admin-muted)]">Relationship: {payload.submitterRole}</span> : null}
                </div>
              </div>
              <div className="rounded-md bg-[var(--admin-surface-muted)] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--admin-muted)]">Decision history</p>
                {decisions.length ? <ol className="mt-2 space-y-3">{decisions.map((decision, index) => <li key={`${decision.created_at}:${index}`} className="text-xs leading-5 text-[var(--admin-muted-strong)]"><strong className="text-[var(--admin-ink)]">{decision.decision}</strong> · {new Date(decision.created_at).toLocaleString("en-CA")}<span className="block">{decision.rationale}</span></li>)}</ol> : <p className="mt-2 text-xs text-[var(--admin-muted)]">No reviewer decision recorded.</p>}
              </div>
            </div>
            {active ? <form action={reviewPublicSubmission} className="mt-5 border-t border-[var(--admin-border)] pt-4">
              <input type="hidden" name="submissionId" value={submission.id} />
              <input type="hidden" name="expectedStatus" value={submission.status} />
              <label className="grid gap-1 text-xs font-semibold text-[var(--admin-ink-soft)]">Reviewer rationale<textarea name="rationale" required minLength={20} maxLength={2000} rows={3} className="form-control" placeholder="Explain the decision, source limitation, or next research step." /></label>
              <div className="mt-3 flex flex-wrap gap-2">
                {submission.status === "pending" ? <PendingButton unstyled type="submit" name="action" value="start_review" pendingLabel="Starting…" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--admin-action)] px-4 text-xs font-semibold text-white"><FileCheck2 aria-hidden="true" className="size-4" />Start review</PendingButton> : <PendingButton unstyled type="submit" name="action" value="return_pending" pendingLabel="Returning…" className="inline-flex min-h-11 items-center rounded-md border border-[var(--admin-border)] bg-white px-4 text-xs font-semibold text-[var(--admin-ink)]">Return to pending</PendingButton>}
                <PendingButton unstyled type="submit" name="action" value="approve" pendingLabel="Approving…" className="inline-flex min-h-11 items-center rounded-md bg-[var(--admin-evidence)] px-4 text-xs font-semibold text-white">Approve for candidate preparation</PendingButton>
                <PendingButton unstyled type="submit" name="action" value="reject" pendingLabel="Rejecting…" confirmMessage="Reject this public submission? The rationale will remain in the private audit trail." className="inline-flex min-h-11 items-center rounded-md border border-[var(--admin-danger-border)] bg-white px-4 text-xs font-semibold text-[var(--admin-danger)]">Reject</PendingButton>
              </div>
            </form> : submission.status === "approved" ? <div className="mt-5 flex flex-col gap-3 border-t border-[var(--admin-border)] pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-[var(--admin-muted)]">Approved for candidate preparation only. Resolve the claim against durable sources, then stage a schema-valid private candidate through the ordinary intake and research workflow.</p><Link href="/admin/intake" prefetch={false} className="atlas-secondary-button shrink-0">Prepare source-backed candidate</Link></div> : <p className="mt-5 border-t border-[var(--admin-border)] pt-4 text-xs leading-5 text-[var(--admin-muted)]">This submission is closed. Its decision remains private, and no public record change is implied.</p>}
          </PublicCard>;
        })}
        <PaginationNav path="/admin/submissions" page={page} totalPages={totalPages} start={rangeStart + 1} end={Math.min(rangeStart + submissions.length, total)} total={total} itemLabel="public submissions" query={{ status, type: submissionType }} />
      </div> : <EmptyCoverage title="No submissions in this view" detail="Choose another status or type. New signed-in contributions will appear in the active queue." />}
    </PublicPageShell>
  );
}

function submissionPayload(value: unknown) {
  const payload = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const evidenceUrl = typeof payload.evidenceUrl === "string" && safeHttpsUrl(payload.evidenceUrl) ? payload.evidenceUrl : null;
  return {
    subject: typeof payload.subject === "string" ? payload.subject : "",
    details: typeof payload.details === "string" ? payload.details : "",
    evidenceUrl,
    submitterRole: typeof payload.submitterRole === "string" ? payload.submitterRole : null
  };
}

function safeHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
