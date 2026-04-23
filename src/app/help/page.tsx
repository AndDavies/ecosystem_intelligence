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
                Explore defence and dual-use capabilities through use case, domain, and company entry paths.
              </div>
              <p className="max-w-4xl text-sm leading-7 text-[var(--muted-foreground)]">
                This product helps internal users understand capability landscapes, identify higher-priority targets,
                inspect evidence, and maintain a defensible record through review and provenance no matter which browse path they start from.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card variant="strong" className="rounded-[32px]">
            <CardHeader className="space-y-3">
              <div className="workspace-kicker">What you can do</div>
              <CardTitle>What you can do here</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <p>Start from a Use Case, a Domain, or a Company depending on the question.</p>
              <p>Review top targets, filters, clusters, maturity, and evidence.</p>
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
              <p>It does not treat AI-derived suggestions as live truth without review.</p>
            </CardContent>
          </Card>
        </div>

        <Card variant="rail" className="rounded-[32px]">
          <CardHeader className="space-y-3">
            <div className="workspace-kicker">First walkthrough</div>
            <CardTitle>3-step quick start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Choose a Use Case for mission-led discovery, a Domain for technical exploration, or a Company for organization-led research.",
              "Use filters, clusters, freshness, and linked pages to narrow the landscape without losing context.",
              "Open a capability, inspect evidence and signals, then move into the company or domain profile if you need broader context."
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
            description="The current MVP supports balanced discovery across Use Cases, Domains, Companies, review, and admin enrichment."
            steps={[
              "Home / App",
              "Use Cases",
              "Domains",
              "Companies",
              "Use Case Detail",
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
