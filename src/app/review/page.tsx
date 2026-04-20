import { Check, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { getReviewQueue } from "@/lib/data/repository";
import { reviewChangeRequest } from "@/lib/actions/review";
import { formatDate } from "@/lib/utils";

export default async function ReviewPage() {
  const profile = await requireProfile("reviewer");
  const queue = await getReviewQueue();

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title="Review Queue"
        description="High-impact changes route here before they become live in the validated dataset."
      />
      <div className="space-y-4">
        {queue.pending.map((request) => (
          <Card key={request.id} className="rounded-[32px]">
            <CardContent className="space-y-5 pt-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-lg font-semibold">{request.entityType}</div>
                  <div className="mt-2 text-sm text-[var(--muted-foreground)]">
                    Requested by {request.requesterName} on {formatDate(request.createdAt)}
                  </div>
                </div>
                <Badge tone="secondary">{request.status}</Badge>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                  <div className="mb-3 text-sm font-semibold">Before</div>
                  <pre className="whitespace-pre-wrap text-xs text-[var(--muted-foreground)]">
                    {JSON.stringify(request.beforeValue, null, 2)}
                  </pre>
                </div>
                <div className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                  <div className="mb-3 text-sm font-semibold">After</div>
                  <pre className="whitespace-pre-wrap text-xs text-[var(--muted-foreground)]">
                    {JSON.stringify(request.afterValue, null, 2)}
                  </pre>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <form action={reviewChangeRequest.bind(null, request.id, "approved")}>
                  <Button type="submit">
                    <Check className="mr-2 size-4" />
                    Approve
                  </Button>
                </form>
                <form action={reviewChangeRequest.bind(null, request.id, "rejected")}>
                  <Button type="submit" variant="outline">
                    <X className="mr-2 size-4" />
                    Reject
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}
        {!queue.pending.length ? (
          <Card className="rounded-[32px]">
            <CardContent className="pt-6 text-sm text-[var(--muted-foreground)]">
              No pending requests right now.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
