import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleUserRound, FolderLock, LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { deleteAccount } from "@/lib/actions/account";
import { signOut } from "@/lib/actions/auth";
import { isAtlasAdminOwner, requireAtlasUser } from "@/lib/atlas/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false }
};

const connectionStatus: Record<string, string> = {
  new: "Received",
  reviewing: "Under review",
  introduced: "Introduction made",
  declined: "Not progressed",
  closed: "Closed"
};

const submissionStatus: Record<string, string> = {
  pending: "Received",
  in_review: "Under review",
  approved: "Approved",
  rejected: "Not approved",
  withdrawn: "Withdrawn"
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

export default async function AccountPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; reauth?: string }>;
}) {
  const user = await requireAtlasUser("/account");
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: authData }, collectionsResult, connectionsResult, submissionsResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("saved_collections").select("id, name, description, updated_at").eq("owner_id", user.id).order("updated_at", { ascending: false }).limit(5),
    supabase.from("connection_requests").select("id, intent, status, message, created_at, organization:organizations(name, slug)").eq("requester_id", user.id).order("created_at", { ascending: false }).limit(10),
    supabase.from("submissions").select("id, submission_type, status, created_at").eq("owner_id", user.id).order("created_at", { ascending: false }).limit(10)
  ]);
  const providers = Array.from(new Set((authData.user?.identities ?? []).map((identity) => identity.provider)));
  const isAdmin = isAtlasAdminOwner(user);
  const errorMessages: Record<string, string> = {
    "admin-account-protected": "The sole administrator account cannot be deleted through the public account workflow.",
    "confirmation-mismatch": "Enter the exact email address shown on this page to confirm deletion.",
    "newsletter-withdrawal-failed": "Your newsletter withdrawal could not be recorded, so no account data was deleted. Try again or contact the site owner.",
    "session-revocation-failed": "Your active sessions could not be closed, so no account data was deleted. Try again or contact the site owner."
  };

  return (
    <PublicPageShell
      eyebrow="Private workspace"
      title="Your account"
      description="Manage your identity, Shortlists, connection requests, contributions, and private data."
      actions={
        <form action={signOut}>
          <AuthSubmitButton pendingLabel="Signing out…" className="h-10 w-auto border border-[var(--atlas-border)] bg-white px-4 text-[var(--atlas-ink-soft)] hover:bg-[var(--atlas-surface-muted)]">
            <LogOut className="size-4" aria-hidden="true" />Sign out
          </AuthSubmitButton>
        </form>
      }
    >
      {params.error ? <div className="mb-5 rounded-md border border-[var(--atlas-danger)] bg-[var(--atlas-danger-soft)] px-3 py-2 text-sm text-[var(--atlas-danger)]">{errorMessages[params.error] ?? "That account action could not be completed."}</div> : null}
      {params.reauth === "delete" ? <div className="mb-5 rounded-md border border-[var(--atlas-primary-border)] bg-[var(--atlas-primary-soft)] px-3 py-2 text-sm text-[var(--atlas-primary)]">Identity confirmed. Complete the deletion form below if you still want to remove this account.</div> : null}

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <PublicCard title="Identity" eyebrow="Signed in">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]"><CircleUserRound className="size-5" aria-hidden="true" /></span>
            <div className="min-w-0"><p className="break-all text-sm font-bold text-[var(--atlas-ink)]">{user.email}</p><p className="mt-1 text-xs text-[var(--atlas-muted)]">Sign-in methods: {providers.length ? providers.map((provider) => provider === "email" ? "Email link" : "Google").join(" and ") : "Verified email"}</p></div>
          </div>
          <div className="mt-5 rounded-md border border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] px-3 py-3 text-xs leading-5 text-[var(--atlas-muted)]">
            Your public browsing is not attached to this profile. Private actions are protected by secure authentication and record-level access controls.
          </div>
        </PublicCard>

        <PublicCard title="Shortlists" eyebrow={`${collectionsResult.data?.length ?? 0} recent`}>
          {collectionsResult.data?.length ? <div className="divide-y divide-[var(--atlas-border)]">{collectionsResult.data.map((collection) => <Link key={collection.id} href={`/collections/${collection.id}`} className="flex items-center justify-between gap-4 py-3 text-sm no-underline first:pt-0 last:pb-0"><span><strong className="block text-[var(--atlas-ink)]">{collection.name}</strong><span className="mt-1 block text-xs text-[var(--atlas-muted)]">{collection.description || "Private shortlist"}</span></span><ArrowRight className="size-4 shrink-0 text-[var(--atlas-primary)]" /></Link>)}</div> : <EmptyCoverage title="No Shortlists yet" detail="Save organizations or capabilities into a private shortlist as you explore." />}
          <Link href="/collections" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[var(--atlas-primary)] no-underline hover:underline"><FolderLock className="size-4" />Open all Shortlists</Link>
        </PublicCard>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <PublicCard title="Connection requests" eyebrow="Private status history">
          {connectionsResult.data?.length ? <div className="divide-y divide-[var(--atlas-border)]">{connectionsResult.data.map((request) => {
            const organization = Array.isArray(request.organization) ? request.organization[0] : request.organization;
            return <article key={request.id} className="py-3 first:pt-0 last:pb-0"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-[var(--atlas-ink)]">{organization?.name ?? "Organization"}</p><p className="mt-1 text-xs capitalize text-[var(--atlas-muted)]">{request.intent.replaceAll("_", " ")} · {formatDate(request.created_at)}</p></div><span className="rounded-full bg-[var(--atlas-primary-soft)] px-2.5 py-1 text-[10px] font-bold text-[var(--atlas-primary)]">{connectionStatus[request.status] ?? request.status}</span></div></article>;
          })}</div> : <EmptyCoverage title="No connection requests" detail="Requests you submit from an organization dossier will appear here." />}
        </PublicCard>

        <PublicCard title="Profile contributions" eyebrow="Claims, corrections, and suggestions">
          {submissionsResult.data?.length ? <div className="divide-y divide-[var(--atlas-border)]">{submissionsResult.data.map((submission) => <article key={submission.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"><div><p className="text-sm font-bold capitalize text-[var(--atlas-ink)]">{submission.submission_type.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-[var(--atlas-muted)]">Submitted {formatDate(submission.created_at)}</p></div><span className="rounded-full bg-[var(--atlas-surface-muted)] px-2.5 py-1 text-[10px] font-bold text-[var(--atlas-muted)]">{submissionStatus[submission.status] ?? submission.status}</span></article>)}</div> : <EmptyCoverage title="No contributions" detail="Claims, corrections, and suggested organizations will show their review status here." />}
        </PublicCard>
      </div>

      <PublicCard title="Delete account and private data" eyebrow="Data control" className="mt-5 border-[var(--atlas-danger)]">
        {isAdmin ? (
          <div className="flex gap-3 rounded-md bg-[var(--atlas-amber-soft)] p-4 text-sm leading-6 text-[var(--atlas-amber)]"><ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><p>This account is the sole administrator and is protected from self-service deletion. Transfer administration and review the audit history before removing it directly from the identity system.</p></div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <div><p className="text-sm leading-6 text-[var(--atlas-muted)]">Deletion permanently removes your account, Shortlists, saved items, connection requests, and contributions. Published organization records and anonymized audit history are retained. This cannot be undone.</p><p className="mt-2 text-xs text-[var(--atlas-muted)]">If your last sign-in was more than 15 minutes ago, you will be asked to sign in again before deletion.</p></div>
            <form action={deleteAccount} className="space-y-3">
              <label className="grid gap-1.5 text-xs font-semibold text-[var(--atlas-ink-soft)]">Confirm your email<input name="confirmationEmail" required type="email" autoComplete="email" placeholder={user.email} className="h-10 rounded-md border border-[var(--atlas-border)] px-3 text-sm font-normal outline-none focus:border-[var(--atlas-danger)] focus:ring-4 focus:ring-[var(--atlas-danger)]/10" /></label>
              <label className="flex items-start gap-2 text-xs leading-5 text-[var(--atlas-muted)]"><input type="checkbox" name="unsubscribe" value="yes" defaultChecked className="mt-1" />Also unsubscribe this email from every North Signal delivery preference.</label>
              <AuthSubmitButton pendingLabel="Deleting account…" className="h-10 bg-[var(--atlas-danger)] text-white hover:bg-[var(--atlas-danger)]"><Trash2 className="size-4" aria-hidden="true" />Delete account and private data</AuthSubmitButton>
            </form>
          </div>
        )}
      </PublicCard>
    </PublicPageShell>
  );
}
