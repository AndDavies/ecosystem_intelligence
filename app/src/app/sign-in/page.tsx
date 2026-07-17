import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import { PublicAtlasHeader } from "@/components/atlas/public-atlas-header";
import { signInWithGoogle } from "@/lib/actions/auth";
import { getAtlasUser } from "@/lib/atlas/auth";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

function safeNext(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/collections";
  return value;
}

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false }
};

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const user = await getAtlasUser();
  if (user) redirect(next);
  const configured = hasSupabasePublicEnv();

  return (
    <main className="atlas-page min-h-screen bg-[#f7f9fc] text-[#101828]">
      <PublicAtlasHeader />
      <div className="mx-auto grid min-h-[calc(100vh-68px)] max-w-5xl items-center gap-6 px-4 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="p-3 sm:p-8">
          <span className="flex size-11 items-center justify-center rounded-lg bg-[#e7f8fa] text-[#007f98]"><LockKeyhole className="size-5" /></span>
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.13em] text-[#007f98]">Optional account</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Keep your research together.</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-[#667085]">The atlas, organization profiles, evidence, and exports remain public. Sign in only for private actions.</p>
          <ul className="mt-6 space-y-3 text-sm text-[#475467]">
            {["Save private Working Lists", "Claim or correct an organization", "Request a human-vetted introduction"].map((item) => (
              <li key={item} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[#079455]" />{item}</li>
            ))}
          </ul>
          <Link href="/" className="mt-7 inline-flex text-xs font-semibold text-[#007f98] no-underline hover:underline">Continue without signing in</Link>
        </section>

        <section className="rounded-xl border border-[#d0d5dd] bg-white p-6 shadow-[0_12px_34px_rgba(16,24,40,0.08)] sm:p-8">
          <div className="flex size-10 items-center justify-center rounded-md bg-white ring-1 ring-[#d0d5dd]" aria-hidden="true">
            <span className="text-lg font-bold text-[#4285f4]">G</span>
          </div>
          <h2 className="mt-5 text-xl font-bold tracking-[-0.02em]">Continue with Google</h2>
          <p className="mt-2 text-sm leading-6 text-[#667085]">Google provides your verified email. Ecosystem Intelligence never receives your Google password.</p>
          {params.error ? <div className="mt-5 rounded-md border border-[#fda29b] bg-[#fff6f5] px-3 py-2 text-sm text-[#b42318]">{params.error}</div> : null}
          {!configured ? <div className="mt-5 rounded-md border border-[#fedf89] bg-[#fffaeb] px-3 py-2 text-sm leading-5 text-[#7a2e0e]">Hosted sign-in is temporarily unavailable. Public browsing remains fully usable.</div> : null}
          <form action={signInWithGoogle} className="mt-6">
            <input type="hidden" name="next" value={next} />
            <button type="submit" className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-md border border-[#b8c8ce] bg-white px-4 text-sm font-semibold text-[#1d2939] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50" disabled={!configured}>
              <span className="text-base font-bold text-[#4285f4]">G</span>
              Continue with Google
            </button>
          </form>
          <p className="mt-4 text-center text-[11px] leading-5 text-[#667085]">By continuing, you agree to the <Link href="/terms" className="underline">Terms</Link> and acknowledge the <Link href="/privacy" className="underline">Privacy notice</Link>.</p>
        </section>
      </div>
    </main>
  );
}
