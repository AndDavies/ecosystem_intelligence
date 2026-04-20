import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { getCompanyById } from "@/lib/data/repository";

export default async function CompanyPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;
  const view = await getCompanyById(id);

  if (!view) {
    notFound();
  }

  return (
    <AppShell profile={profile}>
      <SectionHeading title={view.company.name} description={view.company.overview} />
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[32px]">
          <CardContent className="space-y-5 pt-6">
            <div className="flex flex-wrap gap-2">
              <Badge>{view.company.headquarters}</Badge>
              <Badge tone="secondary">{view.company.geography}</Badge>
            </div>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">
              {view.company.marketContext ?? "No additional market context yet."}
            </p>
            <div className="space-y-4">
              <div className="text-lg font-semibold">Visible capabilities</div>
              {view.capabilities.map((capability) => (
                <div key={capability.id} className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                  <Link href={`/capabilities/${capability.id}`} className="font-semibold">
                    {capability.name}
                  </Link>
                  <div className="mt-2 text-sm text-[var(--muted-foreground)]">{capability.summary}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-5">
          <Card className="rounded-[32px]">
            <CardHeader>
              <CardTitle>Public contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {view.contacts.map((contact) => (
                <div key={contact.id} className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                  <div className="font-semibold">{contact.name}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">{contact.title}</div>
                  {contact.email ? <div className="mt-2 text-sm">{contact.email}</div> : null}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="rounded-[32px]">
            <CardHeader>
              <CardTitle>Reference links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {view.company.websiteUrl ? (
                <a
                  href={view.company.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-3xl border border-[var(--border)] bg-white/60 p-4 text-sm font-medium"
                >
                  Company website
                </a>
              ) : null}
              {view.citations.length ? (
                view.citations.map((citation, index) => (
                  <a
                    key={`${citation.sourceUrl}-${index}`}
                    href={citation.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-3xl border border-[var(--border)] bg-white/60 p-4 text-sm"
                  >
                    {citation.sourceTitle}
                  </a>
                ))
              ) : (
                <div className="rounded-3xl border border-[var(--border)] bg-white/60 p-4 text-sm text-[var(--muted-foreground)]">
                  Company-level citations will appear here as records are enriched.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
