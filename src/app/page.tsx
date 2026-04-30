import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  DatabaseZap,
  Layers3,
  Radar,
  Search,
  ShieldCheck,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";

const heroImage = "/imagery/landing-arctic-intelligence.png";
const systemHeroImage = "/imagery/system-of-systems-hero.png";

export default async function LandingPage() {
  const profile = await getCurrentProfile();
  const configured = hasSupabaseEnv();
  const primaryHref = configured ? "/sign-in" : "/app";
  const primaryLabel = configured ? "Enter workspace" : "Enter preview workspace";

  if (profile) {
    redirect("/app");
  }

  return (
    <main className="page-shell min-h-screen text-[var(--foreground)]">
      <section className="px-4 py-4 md:px-6 xl:px-8">
        <div className="mx-auto max-w-[1640px]">
          <header className="flex items-center justify-between gap-4 border border-[var(--border)] bg-white/88 px-4 py-3 shadow-[0_18px_48px_rgba(5,22,27,0.08)] backdrop-blur-xl md:px-5">
            <Link href="/" className="flex min-w-0 items-center gap-3 no-underline">
              <span className="flex size-10 shrink-0 items-center justify-center border border-[#05161b]/15 bg-[#05161b] text-white">
                <ShieldCheck className="size-4" />
              </span>
              <span>
                <span className="block font-display text-sm font-extrabold uppercase tracking-[0.08em] text-[#061214]">
                  Ecosystem Intelligence
                </span>
                <span className="hidden text-xs text-[var(--muted-foreground)] sm:block">BD intelligence workspace</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-7 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted-foreground)] lg:flex">
              <Link href="/use-cases" className="no-underline hover:text-[var(--foreground)]">Mission Areas</Link>
              <Link href="/domains" className="no-underline hover:text-[var(--foreground)]">Technical Domains</Link>
              <Link href="/companies" className="no-underline hover:text-[var(--foreground)]">Companies</Link>
              <Link href="/help/concepts" className="no-underline hover:text-[var(--foreground)]">Evidence Model</Link>
            </nav>
            <Button asChild className="shrink-0">
              <Link href={primaryHref}>{primaryLabel}</Link>
            </Button>
          </header>

          <div className="grid gap-5 py-5 lg:grid-cols-[0.86fr_1.14fr] lg:py-7">
            <section className="glass-panel flex min-h-[620px] flex-col justify-between p-6 md:p-10 xl:p-12">
              <div>
                <div className="workspace-kicker">Mission-led business intelligence</div>
                <h1 className="mt-7 max-w-4xl font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-[0.035em] text-[#061214] md:text-7xl xl:text-8xl">
                  Intelligence that drives advantage.
                </h1>
                <div className="mt-7 h-1 w-16 bg-[#2393b7]" />
                <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted-foreground)] md:text-xl">
                  Connect mission areas, technologies, companies, and evidence into one defensible workspace for deciding who to engage, why now, and what to do next.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="h-12 px-7">
                    <Link href={primaryHref}>
                      {primaryLabel}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-12 bg-white px-7">
                    <Link href="/use-cases">View mission areas</Link>
                  </Button>
                </div>
              </div>

              <div className="mt-12 grid gap-px border border-[var(--border)] bg-[var(--border)] md:grid-cols-3">
                <Metric label="Entry point" value="Mission-led" />
                <Metric label="Trust posture" value="Public-source" />
                <Metric label="Output" value="Working lists" />
              </div>
            </section>

            <SystemOfSystemsVisual />
          </div>
        </div>
      </section>

      <WorkflowBand />

      <section className="px-4 py-8 md:px-6 xl:px-8">
        <div className="mx-auto grid max-w-[1640px] gap-5 lg:grid-cols-[0.42fr_1fr]">
          <div className="glass-panel p-6 md:p-8">
            <div className="workspace-kicker">Choose the right door</div>
            <h2 className="mt-5 font-display text-3xl font-extrabold uppercase leading-tight tracking-[0.06em] text-[#061214] md:text-5xl">
              Three ways in. One connected view.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-[var(--muted-foreground)]">
              Start from the question you actually have. Every path leads back to evidence, rank signal, gaps, and a saved engagement memory.
            </p>
            <Link href="/app" className="mt-7 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--primary)] no-underline">
              Open the workspace
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-px border border-[var(--border)] bg-[var(--border)] md:grid-cols-3">
            <EntryPath
              icon={<Target className="size-6" />}
              title="Mission Areas"
              body="Use this when the question starts with an operational problem or engagement decision."
              href="/use-cases"
            />
            <EntryPath
              icon={<Layers3 className="size-6" />}
              title="Technical Domains"
              body="Use this when the question starts with a technology landscape, cluster, or capability area."
              href="/domains"
            />
            <EntryPath
              icon={<Building2 className="size-6" />}
              title="Companies"
              body="Use this when a known organization needs portfolio context, evidence, and mission fit."
              href="/companies"
            />
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 md:px-6 xl:px-8">
        <div className="mx-auto grid max-w-[1640px] gap-px border border-[var(--border)] bg-[var(--border)] lg:grid-cols-[0.55fr_1fr]">
          <div className="bg-[#05161b] p-8 text-white md:p-10">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#77c2ec]">Trust model</div>
            <h2 className="mt-5 font-display text-3xl font-extrabold uppercase leading-tight tracking-[0.06em] md:text-5xl">
              Built for defensible decisions.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/68">
              The app keeps source-backed facts separate from derived reads, then turns current records into a practical engagement shortlist.
            </p>
          </div>
          <div className="grid gap-px bg-[var(--border)] md:grid-cols-2">
            <Capability
              icon={<Search className="size-7" />}
              title="Evidence-backed reads"
              body="Trace important fields to citations, snippets, freshness, and confidence posture."
            />
            <Capability
              icon={<Radar className="size-7" />}
              title="Rank signal explanations"
              body="Explain target priority through fit, recency, evidence strength, geography, and actionability."
            />
            <Capability
              icon={<CheckCircle2 className="size-7" />}
              title="Review workflow"
              body="Stage, review, promote, and audit high-impact changes before they become trusted data."
            />
            <Capability
              icon={<DatabaseZap className="size-7" />}
              title="Research batch ready"
              body="Prepare staged real-world research batches without becoming a generic market database."
            />
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 md:px-6 xl:px-8">
        <div className="mx-auto overflow-hidden border border-[var(--border)] bg-white shadow-[0_24px_70px_rgba(5,22,27,0.1)] max-w-[1640px]">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.45fr]">
            <div className="p-7 md:p-10">
              <div className="workspace-kicker">Ready for validation</div>
              <h2 className="mt-5 max-w-4xl font-display text-3xl font-extrabold uppercase tracking-[0.06em] text-[#061214] md:text-5xl">
                Move from mission question to defensible follow-up.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
                Sign in to turn mission intelligence into target comparison, evidence review, and working-list handoff.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-12 px-8">
                  <Link href={primaryHref}>{primaryLabel}</Link>
                </Button>
                {configured ? (
                  <Button asChild variant="outline" className="h-12 bg-white px-8">
                    <Link href="/create-user">Create user</Link>
                  </Button>
                ) : null}
              </div>
            </div>
            <div
              className="min-h-72 border-t border-[var(--border)] bg-[#05161b] bg-cover bg-center lg:border-l lg:border-t-0"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(5,22,27,0.18), rgba(5,22,27,0.8)), url(${heroImage})`
              }}
              aria-hidden="true"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function SystemOfSystemsVisual() {
  return (
    <section className="glass-panel overflow-hidden bg-white p-3 md:p-4">
      <div className="relative h-full min-h-[620px] overflow-hidden border border-[var(--border)] bg-[#05161b]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${systemHeroImage})`
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,22,27,0.12),rgba(5,22,27,0)_42%,rgba(5,22,27,0.3)),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(5,22,27,0.4))]" />

        <div className="absolute left-4 right-4 top-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="border border-white/24 bg-[#05161b]/82 p-4 text-white shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-md">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#77c2ec]">
              System-of-systems view
            </div>
            <div className="mt-3 max-w-xs font-display text-2xl font-extrabold uppercase leading-tight tracking-[0.06em]">
              Integrated mission network
            </div>
          </div>
          <Button asChild variant="outline" className="border-white/40 bg-white/92 text-[#061214] hover:bg-white">
            <Link href="/use-cases/arctic-domain-awareness/briefing">Open briefing</Link>
          </Button>
        </div>

        <SystemCallout className="left-5 top-[37%] hidden xl:block" title="USV layer" detail="Surface patrol and relay." />
        <SystemCallout className="right-5 top-[31%] hidden xl:block" title="Land station" detail="Radar, edge processing, comms." />
        <SystemCallout className="bottom-[30%] left-[19%] hidden lg:block" title="Buoy sensors" detail="Local detection grid." />
        <SystemCallout className="bottom-[19%] right-[10%] hidden lg:block" title="UUV layer" detail="Underwater ISR layer." />

        <div className="absolute bottom-4 left-4 right-4 grid gap-px border border-white/20 bg-white/20 sm:grid-cols-3">
          <SystemStat label="Air" value="UAVs + satellite" />
          <SystemStat label="Maritime" value="USVs + UUVs" />
          <SystemStat label="Shore" value="Radar + stations" />
        </div>
      </div>
    </section>
  );
}

function WorkflowBand() {
  const steps = [
    ["01", "Mission Areas", "Define the problem and context."],
    ["02", "Top Targets", "Surface relevant companies and capabilities."],
    ["03", "Evidence", "Evaluate signal quality and confidence."],
    ["04", "Gaps", "Understand alternatives and tradeoffs."],
    ["05", "Working List", "Carry decisions into follow-up."]
  ];

  return (
    <section className="px-4 py-3 md:px-6 xl:px-8">
      <div className="mx-auto grid max-w-[1640px] gap-px border border-[var(--border)] bg-[var(--border)] lg:grid-cols-5">
        {steps.map(([number, title, detail]) => (
          <div key={number} className="bg-white p-5 md:p-6">
            <div className="text-xs font-extrabold text-[var(--primary)]">{number}</div>
            <div className="mt-3 text-sm font-extrabold uppercase tracking-[0.1em] text-[#061214]">{title}</div>
            <div className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{detail}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4">
      <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{label}</div>
      <div className="mt-2 text-sm font-extrabold uppercase tracking-[0.08em] text-[#061214]">{value}</div>
    </div>
  );
}

function EntryPath({
  icon,
  title,
  body,
  href
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link href={href} className="group bg-white p-6 text-[#061214] no-underline transition hover:bg-[#f9fbfb] md:p-8">
      <div className="text-[var(--primary)]">{icon}</div>
      <div className="mt-10 font-display text-2xl font-extrabold uppercase tracking-[0.06em]">{title}</div>
      <p className="mt-4 min-h-24 text-sm leading-7 text-[var(--muted-foreground)]">{body}</p>
      <span className="mt-8 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--primary)]">
        Explore
        <ArrowRight className="size-4 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

function Capability({
  icon,
  title,
  body
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-white p-6 md:p-8">
      <div className="text-[var(--primary)]">{icon}</div>
      <div className="mt-8 text-sm font-extrabold uppercase tracking-[0.12em] text-[#061214]">{title}</div>
      <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">{body}</p>
    </div>
  );
}

function SystemCallout({ className, title, detail }: { className: string; title: string; detail: string }) {
  return (
    <div className={`absolute max-w-44 border border-white/24 bg-[#05161b]/76 p-3 text-white shadow-[0_14px_40px_rgba(0,0,0,0.28)] backdrop-blur-md ${className}`}>
      <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#77c2ec]">{title}</div>
      <div className="mt-1 text-xs leading-5 text-white/72">{detail}</div>
    </div>
  );
}

function SystemStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#05161b]/82 p-4 text-white backdrop-blur-md">
      <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/50">{label}</div>
      <div className="mt-2 text-xs font-extrabold uppercase tracking-[0.08em] text-white">{value}</div>
    </div>
  );
}
