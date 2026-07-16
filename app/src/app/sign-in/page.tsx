import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, LockKeyhole, Mail } from "lucide-react";
import { PublicAtlasHeader } from "@/components/atlas/public-atlas-header";
import { sendMagicLink } from "@/lib/actions/auth";
import { getAtlasUser } from "@/lib/atlas/auth";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

function safeNext(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/collections";
  return value;
}

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; success?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const user = await getAtlasUser();
  if (user) redirect(next);
  const configured = hasSupabasePublicEnv();

  return (
    <main className="atlas-page min-h-screen bg-[#f7f9fc] text-[#101828]">
      <PublicAtlasHeader />
      <div className="mx-auto grid min-h-[calc(100vh-62px)] max-w-5xl items-center gap-6 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="p-3 sm:p-8">
          <span className="flex size-11 items-center justify-center rounded-lg bg-[#e7f8fa] text-[#007f98]"><LockKeyhole className="size-5" /></span>
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.13em] text-[#007f98]">Optional public account</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Save work without gating the atlas.</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-[#667085]">Browsing, searching, dossiers, PDF generation, and CSV exports remain public. Sign in only to save collections, claim a profile, or suggest a correction.</p>
          <ul className="mt-6 space-y-3 text-sm text-[#475467]">
            {["No password to remember", "Collections are private by default", "Submissions always enter editorial review"].map((item) => (
              <li key={item} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[#079455]" />{item}</li>
            ))}
          </ul>
          <Link href="/" className="mt-7 inline-flex text-xs font-semibold text-[#007f98] no-underline hover:underline">Continue browsing without signing in</Link>
        </section>

        <section className="rounded-xl border border-[#d0d5dd] bg-white p-6 shadow-[0_12px_34px_rgba(16,24,40,0.08)] sm:p-8">
          <div className="flex size-10 items-center justify-center rounded-md bg-[#007f98] text-white"><Mail className="size-5" /></div>
          <h2 className="mt-5 text-xl font-bold tracking-[-0.02em]">Email magic link</h2>
          <p className="mt-2 text-sm leading-6 text-[#667085]">We will send a one-time secure link to your inbox.</p>

          {params.error ? <div className="mt-5 rounded-md border border-[#fda29b] bg-[#fff6f5] px-3 py-2 text-sm text-[#b42318]">{params.error}</div> : null}
          {params.success ? <div className="mt-5 rounded-md border border-[#abefc6] bg-[#ecfdf3] px-3 py-2 text-sm text-[#067647]">{params.success}</div> : null}
          {!configured ? <div className="mt-5 rounded-md border border-[#fedf89] bg-[#fffaeb] px-3 py-2 text-sm leading-5 text-[#7a2e0e]">Hosted authentication will activate after the new Supabase project is created and connected. The public atlas remains fully usable.</div> : null}

          <form action={sendMagicLink} className="mt-6 space-y-4">
            <input type="hidden" name="next" value={next} />
            <label className="grid gap-1.5 text-xs font-semibold text-[#344054]" htmlFor="email">
              Email address
              <input id="email" name="email" type="email" required placeholder="you@organization.ca" className="h-11 rounded-md border border-[#d0d5dd] px-3 text-sm font-normal outline-none placeholder:text-[#98a2b3] focus:border-[#007f98] focus:ring-4 focus:ring-[#007f98]/10" disabled={!configured} />
            </label>
            <button type="submit" className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#007f98] px-4 text-sm font-semibold text-white hover:bg-[#00677d] disabled:cursor-not-allowed disabled:opacity-50" disabled={!configured}>
              Email me a sign-in link
            </button>
          </form>
          <p className="mt-4 text-center text-[11px] leading-5 text-[#667085]">By continuing, you agree that submissions may be reviewed and audited before any public record changes.</p>
        </section>
      </div>
    </main>
  );
}
