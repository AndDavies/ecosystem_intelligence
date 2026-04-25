import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PendingButton } from "@/components/ui/pending-button";
import { deleteShortlist, removeShortlistItem, updateShortlistItem } from "@/lib/actions/shortlists";
import { requireProfile } from "@/lib/auth";
import { getShortlistById } from "@/lib/data/repository";
import { formatDate, toTitleCase } from "@/lib/utils";
import type { ShortlistItemStatus } from "@/types/domain";

const statuses: ShortlistItemStatus[] = ["watch", "validate", "engage", "hold"];

export default async function ShortlistDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mock?: string; shortlistCreated?: string; shortlistItem?: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;
  const view = await getShortlistById(id);
  const query = await searchParams;

  if (!view) {
    notFound();
  }

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title={view.shortlist.name}
        description={view.shortlist.description ?? "Shared BD validation working list."}
        eyebrow="Shortlist"
        breadcrumbs={[
          { label: "Home", href: "/app" },
          { label: "Shortlists", href: "/shortlists" },
          { label: view.shortlist.name }
        ]}
        backHref="/shortlists"
        backLabel="Back to Shortlists"
        meta={
          <>
            {view.useCase ? <Badge tone="outline">{view.useCase.name}</Badge> : null}
            <Badge tone="muted">Updated {formatDate(view.shortlist.updatedAt)}</Badge>
            <Badge tone="surface">{view.items.length} targets</Badge>
          </>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {view.useCase ? (
              <Button asChild>
                <Link href={`/use-cases/${view.useCase.slug}/briefing`}>
                  Open briefing
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : null}
            <form action={deleteShortlist}>
              <input type="hidden" name="shortlistId" value={view.shortlist.id} />
              <PendingButton
                type="submit"
                variant="outline"
                pendingLabel="Deleting..."
                confirmMessage={`Delete "${view.shortlist.name}" and all saved targets?`}
              >
                <Trash2 className="size-4" />
                Delete shortlist
              </PendingButton>
            </form>
          </div>
        }
      />

      {query.mock ? (
        <Card variant="muted" className="mb-6 rounded-[28px]">
          <CardContent className="pt-6 text-sm text-[var(--muted-foreground)]">
            Persistent shortlist writes require Supabase mode. Mock mode does not save item edits.
          </CardContent>
        </Card>
      ) : null}

      {query.shortlistCreated ? (
        <NoticeCard message="Shortlist created. Add targets from the briefing page, or update follow-up details here." />
      ) : null}

      {query.shortlistItem ? (
        <NoticeCard message={getShortlistItemNotice(query.shortlistItem)} />
      ) : null}

      <div className="grid gap-5">
        {view.items.length ? (
          view.items.map(({ item, capability, company, domain, mappings }) => (
            <Card key={item.id} variant="strong" className="rounded-[32px]">
              <CardContent className="space-y-5 pt-7">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={getStatusTone(item.status)}>{toTitleCase(item.status)}</Badge>
                      {domain ? <Badge tone="outline">{domain.name}</Badge> : null}
                      {mappings[0] ? <Badge tone="surface">{toTitleCase(mappings[0].pathway)}</Badge> : null}
                    </div>
                    {capability ? (
                      <Link
                        href={`/capabilities/${capability.id}${view.useCase ? `?fromUseCase=${view.useCase.slug}` : ""}`}
                        className="block text-2xl font-bold tracking-tight no-underline"
                      >
                        {capability.name}
                      </Link>
                    ) : (
                      <div className="text-2xl font-bold tracking-tight">{company?.name ?? "Unknown target"}</div>
                    )}
                    {company ? (
                      <Link
                        href={`/companies/${company.id}${view.useCase ? `?fromUseCase=${view.useCase.slug}` : ""}`}
                        className="text-sm font-medium text-[var(--muted-foreground)] no-underline hover:text-[var(--primary)]"
                      >
                        {company.name} · {company.headquarters}
                      </Link>
                    ) : null}
                  </div>
                  <form action={removeShortlistItem}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="shortlistId" value={view.shortlist.id} />
                    <input type="hidden" name="pagePath" value={`/shortlists/${view.shortlist.id}`} />
                    <PendingButton type="submit" variant="outline" pendingLabel="Removing...">
                      <Trash2 className="size-4" />
                      Remove
                    </PendingButton>
                  </form>
                </div>

                {capability ? (
                  <p className="text-sm leading-6 text-[var(--muted-foreground)]">{capability.summary}</p>
                ) : null}

                <form action={updateShortlistItem} className="grid gap-3 lg:grid-cols-2">
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="shortlistId" value={view.shortlist.id} />
                  <input type="hidden" name="pagePath" value={`/shortlists/${view.shortlist.id}`} />
                  <label className="space-y-1 text-sm font-medium">
                    <span>Status</span>
                    <select
                      name="status"
                      defaultValue={item.status}
                      className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {toTitleCase(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm font-medium">
                    <span>Owner</span>
                    <input
                      name="owner"
                      defaultValue={item.owner ?? ""}
                      className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                    />
                  </label>
                  <label className="space-y-1 text-sm font-medium">
                    <span>Due date</span>
                    <input
                      type="date"
                      name="dueDate"
                      defaultValue={item.dueDate ?? ""}
                      className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                    />
                  </label>
                  <label className="space-y-1 text-sm font-medium lg:col-span-2">
                    <span>Next step</span>
                    <textarea
                      name="nextStep"
                      defaultValue={item.nextStep ?? ""}
                      className="min-h-24 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                    />
                  </label>
                  <label className="space-y-1 text-sm font-medium lg:col-span-2">
                    <span>Rationale</span>
                    <textarea
                      name="rationale"
                      defaultValue={item.rationale ?? ""}
                      className="min-h-24 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                    />
                  </label>
                  <div className="lg:col-span-2">
                    <PendingButton type="submit" pendingLabel="Saving...">Save item</PendingButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card variant="hero" className="rounded-[34px]">
            <CardHeader>
              <CardTitle>No targets saved yet</CardTitle>
              <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                Open the briefing for this Use Case and add the targets worth validating with BD users.
              </p>
            </CardHeader>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function NoticeCard({ message }: { message: string }) {
  return (
    <Card variant="muted" className="mb-6 rounded-[28px] border-[var(--primary)]/18">
      <CardContent className="pt-6 text-sm font-medium text-[var(--foreground)]">{message}</CardContent>
    </Card>
  );
}

function getShortlistItemNotice(value: string) {
  if (value === "saved") {
    return "Shortlist item saved. Status, owner, next step, due date, and rationale are up to date.";
  }

  if (value === "removed") {
    return "Target removed from this shortlist.";
  }

  if (value === "updated") {
    return "Target was already on this shortlist, so its rationale and next step were updated.";
  }

  return "Target added to the shortlist.";
}

function getStatusTone(status: ShortlistItemStatus) {
  if (status === "engage") {
    return "success";
  }

  if (status === "validate") {
    return "info";
  }

  if (status === "hold") {
    return "muted";
  }

  return "surface";
}
