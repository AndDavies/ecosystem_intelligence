import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { EmailSignInForm } from "@/components/auth/email-sign-in-form";
import { PublicAtlasHeader } from "@/components/atlas/public-atlas-header";
import { signInWithGoogle } from "@/lib/actions/auth";
import { getAtlasUser } from "@/lib/atlas/auth";
import { safeAuthNextPath } from "@/lib/auth-utils";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false }
};

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; next?: string; success?: string }>;
}) {
  const params = await searchParams;
  const next = safeAuthNextPath(params.next);
  const user = await getAtlasUser();
  if (user) redirect(next);
  const configured = hasSupabasePublicEnv();
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <main className="atlas-page min-h-screen bg-[var(--atlas-canvas)] text-[var(--atlas-ink)]">
      <PublicAtlasHeader />
      <div className="mx-auto grid min-h-[calc(100vh-68px)] max-w-5xl items-center gap-6 px-4 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="p-3 sm:p-8">
          <span className="flex size-11 items-center justify-center rounded-lg bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]"><LockKeyhole className="size-5" /></span>
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.13em] text-[var(--atlas-primary)]">Optional account</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Keep your research together.</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-[var(--atlas-muted)]">The map, organization profiles, evidence and exports remain public. Sign in only when you want to save or contribute.</p>
          <ul className="mt-6 space-y-3 text-sm text-[var(--atlas-muted)]">
            {["Save private Working Lists", "Claim or correct an organization", "Request a human-vetted introduction"].map((item) => (
              <li key={item} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[var(--atlas-primary)]" />{item}</li>
            ))}
          </ul>
          <Link href="/" className="mt-7 inline-flex text-xs font-semibold text-[var(--atlas-primary)] no-underline hover:underline">Continue without signing in</Link>
        </section>

        <section className="rounded-xl border border-[var(--atlas-border)] bg-white p-6 shadow-[0_12px_34px_rgba(16,24,40,0.08)] sm:p-8">
          <div className="flex size-10 items-center justify-center rounded-md bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]" aria-hidden="true">
            <LockKeyhole className="size-5" />
          </div>
          <h2 className="mt-5 text-xl font-bold tracking-[-0.02em]">Sign in or create an account</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--atlas-muted)]">Use Google or any personal or work email. No password is required.</p>
          {params.error ? <div className="mt-5 rounded-md border border-[var(--atlas-danger)] bg-[var(--atlas-danger-soft)] px-3 py-2 text-sm text-[var(--atlas-danger)]">{params.error}</div> : null}
          {params.success ? <div className="mt-5 rounded-md border border-[var(--atlas-primary-border)] bg-[var(--atlas-primary-soft)] px-3 py-2 text-sm text-[var(--atlas-primary)]">{params.success}</div> : null}
          {!configured ? <div className="mt-5 rounded-md border border-[var(--atlas-amber)] bg-[var(--atlas-amber-soft)] px-3 py-2 text-sm leading-5 text-[var(--atlas-amber)]">Hosted sign-in is temporarily unavailable. Public browsing remains fully usable.</div> : null}

          <form action={signInWithGoogle} className="mt-6">
            <input type="hidden" name="next" value={next} />
            <AuthSubmitButton pendingLabel="Redirecting to Google…" disabled={!configured} className="border border-[var(--atlas-border-strong)] bg-white text-[var(--atlas-ink-soft)] hover:bg-[var(--atlas-surface-muted)]">
              <span className="text-base font-bold text-[#4285f4]" aria-hidden="true">G</span>
              Continue with Google
            </AuthSubmitButton>
          </form>

          <div className="my-5 flex items-center gap-3" aria-hidden="true"><span className="h-px flex-1 bg-[var(--atlas-border)]" /><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--atlas-muted)]">or</span><span className="h-px flex-1 bg-[var(--atlas-border)]" /></div>

          <EmailSignInForm next={next} configured={configured} turnstileSiteKey={turnstileSiteKey} />
          <p className="mt-4 text-center text-[11px] leading-5 text-[var(--atlas-muted)]">By continuing, you agree to the <Link href="/terms" className="underline">Terms</Link> and acknowledge the <Link href="/privacy" className="underline">Privacy notice</Link>.</p>
        </section>
      </div>
    </main>
  );
}
