import Link from "next/link";
import { ArrowRight, KeyRound, Radar, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const profile = await getCurrentProfile();
  const configured = hasSupabaseEnv();

  if (profile) {
    redirect("/app");
  }

  return (
    <main className="page-shell">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 md:px-8 lg:flex-row lg:items-stretch lg:gap-6">
        <section className="flex flex-1 flex-col justify-between rounded-[40px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,250,241,0.72))] p-8 shadow-[var(--shadow-strong)] md:p-12">
          <div className="space-y-8">
            <div className="workspace-kicker">
              <Shield className="size-4" />
              Internal access only
            </div>
            <div className="space-y-5">
              <h1 className="font-display max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
                Capability-first ecosystem intelligence for business development teams.
              </h1>
              <div className="inline-flex w-fit rounded-full border border-[var(--border)] bg-white/75 px-4 py-2 text-sm font-medium shadow-[0_10px_24px_rgba(20,34,24,0.05)]">
                Explore defence and dual-use capabilities by Use Case, Domain, Company, maturity, and relevance.
              </div>
              <p className="max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">
                Move between mission-led, domain-led, and company-led discovery, identify engagement targets,
                and trace every meaningful field back to visible evidence.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <LandingFeature
                icon={<Radar className="size-5" />}
                title="Multiple entry paths"
                description="Navigate through curated Use Cases, technical Domains, or known Companies."
              />
              <LandingFeature
                icon={<KeyRound className="size-5" />}
                title="Supabase auth"
                description="Email/password access with lightweight internal account creation and role-backed sessions."
              />
              <LandingFeature
                icon={<ArrowRight className="size-5" />}
                title="Action-oriented"
                description="Surface ranked engagement targets with transparent scoring and provenance."
              />
            </div>
          </div>
          <div className="mt-10 rounded-3xl border border-[var(--border)] bg-white/60 p-5 text-sm text-[var(--muted-foreground)]">
            Public-source-only intelligence. No client-sensitive, classified, or export-controlled data
            belongs in this MVP.
          </div>
        </section>
        <section className="mt-6 flex w-full max-w-xl lg:mt-0">
          <Card variant="strong" className="w-full rounded-[36px]">
            <CardHeader className="space-y-3">
              <CardTitle className="text-2xl">Internal access</CardTitle>
              <CardDescription>
                Use dedicated sign-in and account creation routes, then go straight into the app once authenticated.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {configured ? (
                <div className="space-y-3">
                  <Button asChild className="w-full">
                    <Link href="/sign-in">Sign in</Link>
                  </Button>
                  <Button asChild variant="surface" className="w-full">
                    <Link href="/create-user">Create user</Link>
                  </Button>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Sign in to enter directly into the balanced discovery workspace.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 rounded-3xl border border-[var(--border)] bg-white/68 p-5">
                  <div className="text-sm font-medium">Development mode</div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Supabase environment variables are not configured yet, so the app will fall back to
                    the seeded mock dataset.
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/app">Enter preview workspace</Link>
                  </Button>
                </div>
              )}
              <div className="rounded-3xl bg-[var(--primary)]/6 p-5 text-sm text-[var(--muted-foreground)]">
                Viewers can explore and export. Editors can refine records. Reviewers approve high-impact
                changes. Admins maintain taxonomy and enrichment runs.
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function LandingFeature({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-white/55 p-5">
      <div className="mb-3 inline-flex rounded-2xl bg-[var(--secondary)]/22 p-3">{icon}</div>
      <div className="text-base font-semibold">{title}</div>
      <div className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{description}</div>
    </div>
  );
}
