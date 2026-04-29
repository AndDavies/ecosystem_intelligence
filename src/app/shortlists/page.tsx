import Link from "next/link";
import { ArrowRight, ListChecks, PlusCircle, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { SnapshotStrip } from "@/components/workspace/workspace-primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PendingButton } from "@/components/ui/pending-button";
import { Textarea } from "@/components/ui/textarea";
import { createShortlist, deleteShortlist } from "@/lib/actions/shortlists";
import { requireProfile } from "@/lib/auth";
import { getShortlistsIndex, getUseCasesIndex } from "@/lib/data/repository";
import { formatDate, toTitleCase } from "@/lib/utils";
import type { ShortlistIndexCardView } from "@/types/view-models";

export default async function ShortlistsPage({
  searchParams
}: {
  searchParams: Promise<{ mock?: string; shortlistSetup?: string; shortlistDeleted?: string }>;
}) {
  const profile = await requireProfile();
  const [shortlists, useCases] = await Promise.all([getShortlistsIndex(), getUseCasesIndex()]);
  const params = await searchParams;
  const totalTargets = shortlists.reduce((sum, item) => sum + item.itemCount, 0);
  const activeTargets = shortlists.reduce(
    (sum, item) => sum + item.statusCounts.validate + item.statusCounts.engage,
    0
  );
  const ownerCoverage = shortlists.reduce((sum, item) => sum + item.ownerCount, 0);

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title="Working Lists"
        description="Shared engagement memory for shortlisted targets, follow-up rationale, and next steps."
        eyebrow="Working memory"
        breadcrumbs={[
          { label: "Home", href: "/app" },
          { label: "Working Lists" }
        ]}
        backHref="/app"
        backLabel="Back to Start Here"
      />

      {params.mock ? (
        <Card variant="muted" className="mb-6 rounded-[28px]">
          <CardContent className="pt-6 text-sm text-[var(--muted-foreground)]">
            Persistent working-list writes require Supabase mode. Mock mode keeps this page empty by design.
          </CardContent>
        </Card>
      ) : null}

      {params.shortlistSetup === "missing-schema" ? (
        <Card variant="muted" className="mb-6 rounded-[28px]">
          <CardContent className="pt-6 text-sm text-[var(--muted-foreground)]">
            Working-list persistence needs the latest Supabase migration. Apply `003_shortlists.sql`, then retry creating the list.
          </CardContent>
        </Card>
      ) : null}

      {params.shortlistDeleted ? (
        <NoticeCard message="Working list deleted. The list and saved targets were removed." />
      ) : null}

      <SnapshotStrip
        className="mb-6"
        items={[
          {
            label: "Working Lists",
            value: String(shortlists.length),
            detail: "Saved engagement memory across mission areas."
          },
          {
            label: "Saved Targets",
            value: String(totalTargets),
            detail: "Capabilities or companies carried forward."
          },
          {
            label: "Validate / Engage",
            value: String(activeTargets),
            detail: "Targets with an active follow-up stance."
          },
          {
            label: "Owner Coverage",
            value: `${ownerCoverage}/${totalTargets || 0}`,
            detail: "Targets with a named owner."
          }
        ]}
      />

      <Card variant="hero" className="mb-6 rounded-[34px]">
        <CardHeader className="space-y-3">
          <div className="workspace-kicker">
            <PlusCircle className="size-3.5" />
            Add new working list
          </div>
          <CardTitle>Create a working list before or during a BD conversation.</CardTitle>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            Pick the Use Case, name the list, and then add targets from the briefing cards. This stays intentionally lightweight.
          </p>
        </CardHeader>
        <CardContent>
          <form action={createShortlist} className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr_auto] lg:items-end">
            <label className="space-y-1.5 text-sm font-medium">
              <span>Mission Area / Use Case</span>
              <select
                name="useCaseId"
                defaultValue={useCases.find((useCase) => useCase.slug === "arctic-domain-awareness")?.id ?? useCases[0]?.id}
                className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 text-sm outline-none transition focus:border-[var(--primary)] focus:shadow-[0_0_0_4px_rgba(31,80,51,0.08)]"
              >
                {useCases.map((useCase) => (
                  <option key={useCase.id} value={useCase.id}>
                    {useCase.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              <span>Name</span>
              <Input name="name" placeholder="Arctic Domain Awareness BD working list" />
            </label>
            <PendingButton type="submit" pendingLabel="Creating..." className="h-11">
              <PlusCircle className="size-4" />
              Create working list
            </PendingButton>
            <label className="space-y-1.5 text-sm font-medium lg:col-span-3">
              <span>Description</span>
              <Textarea
                name="description"
                placeholder="Working list for a BD validation conversation, leadership briefing, or follow-up cycle."
              />
            </label>
          </form>
        </CardContent>
      </Card>

      {shortlists.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {shortlists.map((item) => (
            <Card key={item.shortlist.id} variant="strong" className="rounded-[32px]">
              <CardHeader className="space-y-3">
                <div className="workspace-kicker">
                  <ListChecks className="size-3.5" />
                  {item.useCase?.name ?? "Unknown Use Case"}
                </div>
                <CardTitle>{item.shortlist.name}</CardTitle>
                <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                  {item.shortlist.description ?? "No description yet."}
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="outline">{item.itemCount} targets</Badge>
                  <Badge tone="surface">{item.ownerCount}/{item.itemCount || 0} owned</Badge>
                  <Badge tone="surface">{item.nextStepCount}/{item.itemCount || 0} next steps</Badge>
                  <Badge tone="surface">{item.dueItemCount}/{item.itemCount || 0} due dates</Badge>
                  {Object.entries(item.statusCounts)
                    .filter(([, count]) => count > 0)
                    .map(([status, count]) => (
                      <Badge key={status} tone={getStatusTone(status)}>
                        {count} {toTitleCase(status)}
                      </Badge>
                    ))}
                  <Badge tone="muted">Updated {formatDate(item.updatedAt)}</Badge>
                </div>
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--card-muted)] p-4 text-sm leading-6 text-[var(--muted-foreground)]">
                  <span className="font-semibold text-[var(--foreground)]">Handoff read: </span>
                  {buildHandoffRead(item)}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild className="flex-1 justify-between">
                    <Link href={`/shortlists/${item.shortlist.id}`}>
                      Open working list
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <form action={deleteShortlist}>
                    <input type="hidden" name="shortlistId" value={item.shortlist.id} />
                    <PendingButton
                      type="submit"
                      variant="outline"
                      pendingLabel="Deleting..."
                      confirmMessage={`Delete "${item.shortlist.name}" and all saved targets?`}
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </PendingButton>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card variant="hero" className="rounded-[34px]">
          <CardHeader>
            <CardTitle>No working lists yet</CardTitle>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">
              Open a Use Case briefing, compare the top targets, and save the organizations worth carrying into follow-up.
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/use-cases/arctic-domain-awareness/briefing">
                Open Arctic briefing
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
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

function buildHandoffRead(item: ShortlistIndexCardView) {
  if (!item.itemCount) {
    return "This list is ready to receive targets from a mission-area briefing.";
  }

  const activeCount = item.statusCounts.validate + item.statusCounts.engage;
  const ownerText =
    item.ownerCount === item.itemCount
      ? "every target has an owner"
      : `${item.ownerCount} of ${item.itemCount} targets have owners`;
  const nextStepText =
    item.nextStepCount === item.itemCount
      ? "next steps are captured"
      : `${item.itemCount - item.nextStepCount} still need next steps`;

  return `${item.useCase?.name ?? "This working list"} has ${activeCount} active validation or engagement target${activeCount === 1 ? "" : "s"}; ${ownerText}, and ${nextStepText}.`;
}

function getStatusTone(status: string) {
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
