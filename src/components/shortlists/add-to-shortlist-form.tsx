import { PlusCircle } from "lucide-react";
import { addShortlistItem } from "@/lib/actions/shortlists";
import { PendingButton } from "@/components/ui/pending-button";
import type { ShortlistIndexCardView } from "@/types/view-models";
import type { ShortlistItemStatus } from "@/types/domain";

export function AddToShortlistForm({
  shortlists,
  useCaseId,
  useCaseName,
  pagePath,
  capabilityId,
  companyId,
  status,
  rationale,
  nextStep
}: {
  shortlists: ShortlistIndexCardView[];
  useCaseId: string;
  useCaseName: string;
  pagePath: string;
  capabilityId?: string;
  companyId?: string;
  status: ShortlistItemStatus;
  rationale: string;
  nextStep: string;
}) {
  const controlId = `shortlist-${capabilityId ?? companyId ?? "target"}`;

  return (
    <form
      action={addShortlistItem}
      className="rounded-[26px] border border-[var(--primary)]/18 bg-white/86 p-3 shadow-[0_14px_34px_rgba(20,34,24,0.08)]"
    >
      <input type="hidden" name="useCaseId" value={useCaseId} />
      <input type="hidden" name="useCaseName" value={useCaseName} />
      <input type="hidden" name="pagePath" value={pagePath} />
      <input type="hidden" name="capabilityId" value={capabilityId ?? ""} />
      <input type="hidden" name="companyId" value={companyId ?? ""} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="rationale" value={rationale} />
      <input type="hidden" name="nextStep" value={nextStep} />
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <label
            htmlFor={controlId}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]"
          >
            Save to working list
          </label>
          <select
            id={controlId}
            name="shortlistId"
            className="min-h-11 w-full rounded-full border border-[var(--border)] bg-white px-3 text-sm font-medium text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:shadow-[0_0_0_4px_rgba(31,80,51,0.08)]"
            defaultValue={shortlists[0]?.shortlist.id ?? ""}
          >
            {shortlists.length ? (
              shortlists.map((shortlist) => (
                <option key={shortlist.shortlist.id} value={shortlist.shortlist.id}>
                  {shortlist.shortlist.name}
                </option>
              ))
            ) : (
              <option value="">Create BD validation working list</option>
            )}
          </select>
          <p className="text-xs leading-5 text-[var(--muted-foreground)]">
            {shortlists.length
              ? "Adds this target with its suggested status, rationale, and next step."
              : "No working list exists yet, so this will create one and save the target."}
          </p>
        </div>
        <PendingButton type="submit" className="shrink-0 shadow-[0_10px_24px_rgba(31,80,51,0.18)]" pendingLabel="Adding...">
          <PlusCircle className="size-4" />
          Add to working list
        </PendingButton>
      </div>
    </form>
  );
}
