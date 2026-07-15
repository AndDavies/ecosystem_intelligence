import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HelpShell } from "@/components/help/help-shell";
import { HelpDiagram } from "@/components/help/help-diagram";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { helpPages } from "@/lib/help-content";

export default async function HelpPage() {
  const profile = await requireProfile();

  return (
      <HelpShell
        profile={profile}
        title="Start Here"
        description="Use this help center to understand the product, learn the workflow, and work confidently inside the current MVP."
      >
      <div className="space-y-5">
        <Card variant="hero" className="rounded-[36px]">
          <CardContent className="space-y-5 pt-6">
            <Badge tone="outline">Internal help center</Badge>
            <div className="space-y-3">
              <div className="font-display text-3xl font-semibold tracking-tight">
                Explore defence and dual-use capabilities through Mission Areas, Technical Domains, Companies, and Working Lists.
              </div>
              <p className="max-w-4xl text-sm leading-7 text-[var(--muted-foreground)]">
                This product helps internal users understand capability landscapes, identify higher-priority targets,
                inspect evidence, and keep each Mission Area / Use Case tied to public CAF/DND, Government of Canada, and NATO
                priorities without pretending public sources are classified requirements.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card variant="strong" className="rounded-[32px]">
          <CardHeader className="space-y-3">
            <div className="workspace-kicker">Start here based on your question</div>
            <CardTitle>Four safe entry paths</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StartPathHelpCard
              title="I have a mission problem"
              body="Open Mission Areas / Use Cases for top targets, evidence posture, and gaps."
              href="/use-cases"
            />
            <StartPathHelpCard
              title="I know the technology area"
              body="Open Technical Domains to orient around the capability landscape."
              href="/domains"
            />
            <StartPathHelpCard
              title="I know the organization"
              body="Open Companies when the name, portfolio, or market actor is already known."
              href="/companies"
            />
            <StartPathHelpCard
              title="I need to brief or follow up"
              body="Open Working Lists to revisit saved targets, status, rationale, and next steps."
              href="/shortlists"
            />
          </CardContent>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card variant="strong" className="rounded-[32px]">
            <CardHeader className="space-y-3">
              <div className="workspace-kicker">What you can do</div>
              <CardTitle>What you can do here</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <p>Start from a Mission Area, Technical Domain, Company, or Working List depending on the question.</p>
              <p>Use Mission Brief and Policy Alignment to understand why a Mission Area exists.</p>
              <p>Open a briefing when you need a meeting-ready target comparison.</p>
              <p>Review top targets, filters, clusters, maturity, and evidence.</p>
              <p>Save selected targets to shared Working Lists with rationale and next steps.</p>
              <p>Open capability, domain, and company profiles for decision context.</p>
              <p>Edit records, request refresh, or review higher-impact changes when your role allows it.</p>
            </CardContent>
          </Card>
          <Card variant="strong" className="rounded-[32px]">
            <CardHeader className="space-y-3">
              <div className="workspace-kicker">Guardrails</div>
              <CardTitle>What this product is not</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <p>It is not a generic company database.</p>
              <p>It is not a CRM replacement or outreach tool.</p>
              <p>It is not a fully autonomous intelligence engine.</p>
              <p>It is not a substitute for classified planning guidance or country-specific NATO targets.</p>
              <p>It does not treat AI-derived suggestions as live truth without review.</p>
            </CardContent>
          </Card>
        </div>

        <Card variant="rail" className="rounded-[32px]">
          <CardHeader className="space-y-3">
            <div className="workspace-kicker">First walkthrough</div>
            <CardTitle>4-step quick start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Start from Start Here and choose whether you know the mission problem, technology area, organization, or follow-up list.",
              "Use table-style scans on Companies and Use Case targets before opening detailed cards or profiles.",
              "Open the briefing view to compare top targets, understand tradeoffs, and name visible gaps.",
              "Save selected targets to a Working List with status, owner, next step, due date, and rationale."
            ].map((step, index) => (
              <div key={step} className="workspace-subtle flex items-start gap-3 rounded-[26px] px-4 py-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <div className="pt-1 text-sm text-[var(--foreground)]">{step}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <HelpDiagram
            title="App Navigation Map"
            description="The current MVP supports balanced discovery across Mission Areas, Technical Domains, Companies, Working Lists, review, and admin enrichment."
            steps={[
              "Start Here",
              "Mission Areas",
              "Technical Domains",
              "Companies",
              "Working Lists",
              "Use Case Detail",
              "Use Case Briefing",
              "Capability Detail",
              "Company Detail",
              "Review Queue",
              "Admin Enrichment"
            ]}
          />
          <Card variant="strong" className="rounded-[32px]">
            <CardHeader className="space-y-3">
              <div className="workspace-kicker">Core topics</div>
              <CardTitle>Core Help Topics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {helpPages.map((page) => (
                <Link
                  key={page.slug}
                  href={`/help/${page.slug}`}
                  className="block rounded-[26px] border border-[var(--border)] bg-white/68 p-4 no-underline transition hover:border-[var(--primary)]/20 hover:bg-white"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-[var(--foreground)]">{page.title}</div>
                      <div className="mt-1 text-sm text-[var(--muted-foreground)]">{page.summary}</div>
                    </div>
                    <ArrowRight className="size-4 text-[var(--muted-foreground)]" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </HelpShell>
  );
}

function StartPathHelpCard({ title, body, href }: { title: string; body: string; href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-[24px] border border-[var(--border)] bg-white/70 p-4 no-underline transition hover:border-[var(--primary)]/20 hover:bg-white"
    >
      <div className="font-semibold text-[var(--foreground)]">{title}</div>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{body}</p>
      <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
        Open
        <ArrowRight className="size-4" />
      </div>
    </Link>
  );
}
