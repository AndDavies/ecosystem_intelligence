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
        <Card className="rounded-[32px] border-[var(--primary)]/12 bg-[linear-gradient(180deg,rgba(31,80,51,0.08),rgba(255,255,255,0.98))]">
          <CardContent className="space-y-5 pt-6">
            <Badge tone="secondary">Internal help center</Badge>
            <div className="space-y-3">
              <div className="text-2xl font-semibold tracking-tight">
                Explore defence and dual-use capabilities through a Use Case-led workflow.
              </div>
              <p className="max-w-4xl text-sm leading-7 text-[var(--muted-foreground)]">
                This product helps internal users understand capability landscapes, identify higher-priority targets,
                inspect evidence, and maintain a defensible record through review and provenance.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="rounded-[32px]">
            <CardHeader>
              <CardTitle>What you can do here</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <p>Start from a Use Case instead of a company list.</p>
              <p>Review top targets, filters, clusters, maturity, and evidence.</p>
              <p>Open capability and company profiles for decision context.</p>
              <p>Edit records, request refresh, or review higher-impact changes when your role allows it.</p>
            </CardContent>
          </Card>
          <Card className="rounded-[32px]">
            <CardHeader>
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

        <Card className="rounded-[32px]">
          <CardHeader>
            <CardTitle>3-step quick start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Open a Use Case and read Recommended Actions plus Top Engagement Targets first.",
              "Use filters, clusters, and maturity to narrow the landscape without losing context.",
              "Open a capability, inspect evidence and signals, then open the company profile if you need broader context."
            ].map((step, index) => (
              <div key={step} className="flex items-start gap-3 rounded-3xl border border-[var(--border)] bg-white/60 px-4 py-4">
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
            description="The current MVP is designed around Use Case-led entry, drill-down, review, and admin enrichment."
            steps={[
              "Home / App",
              "Use Cases",
              "Use Case Detail",
              "Capability Detail",
              "Company Detail",
              "Review Queue",
              "Admin Enrichment"
            ]}
          />
          <Card className="rounded-[32px]">
            <CardHeader>
              <CardTitle>Core Help Topics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {helpPages.map((page) => (
                <Link
                  key={page.slug}
                  href={`/help/${page.slug}`}
                  className="block rounded-3xl border border-[var(--border)] bg-white/60 p-4 no-underline transition hover:border-[var(--primary)]/20 hover:bg-white"
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
