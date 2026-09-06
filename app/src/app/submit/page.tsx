import { ContributionForm } from "@/components/atlas/contribution-form";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { requireAtlasUser } from "@/lib/atlas/auth";
import { safeLocalReturnPath } from "@/lib/safe-return";

function safeReturn(value: string | undefined) {
  return safeLocalReturnPath(value, "/");
}

export default async function SubmitContributionPage({
  searchParams
}: {
  searchParams: Promise<{ submissionType?: string; targetType?: string; targetId?: string; returnTo?: string }>;
}) {
  const params = await searchParams;
  const returnTo = safeReturn(params.returnTo);
  const submissionType = ["profile_claim", "correction", "new_organization"].includes(params.submissionType ?? "")
    ? (params.submissionType as "profile_claim" | "correction" | "new_organization")
    : "correction";
  await requireAtlasUser(`/submit?${new URLSearchParams({ submissionType, ...(params.targetType ? { targetType: params.targetType } : {}), ...(params.targetId ? { targetId: params.targetId } : {}), returnTo }).toString()}`);
  const targetEntityId = /^[0-9a-f-]{36}$/i.test(params.targetId ?? "") ? params.targetId ?? null : null;
  const title = submissionType === "profile_claim" ? "Claim an organization profile" : submissionType === "new_organization" ? "Suggest an organization" : "Suggest a correction";

  return (
    <PublicPageShell variant="form" eyebrow="Know something missing? Improve the public record." title={title} description="Suggest an organization, correct a profile, or add a public source. Every change is reviewed before publication." backHref={returnTo} backLabel="Back to published record">
      <div className="mx-auto max-w-3xl">
        <PublicCard title="Evidence-backed submission" eyebrow="Editorial review required">
          <ContributionForm submissionType={submissionType} targetEntityType={params.targetType ?? null} targetEntityId={targetEntityId} returnTo={returnTo} />
        </PublicCard>
      </div>
    </PublicPageShell>
  );
}
