import type { AiRun, CapabilityUseCase, ChangeRequest } from "@/types/domain";

const AI_REQUESTER_EMAIL = "system@ecosystem-intelligence.local";
const AI_REQUESTER_NAME = "AI Enrichment Worker";

export function isAiGeneratedRequest(
  request: Pick<ChangeRequest, "requesterEmail" | "requesterName">
) {
  return (
    request.requesterEmail === AI_REQUESTER_EMAIL ||
    request.requesterName.trim().toLowerCase() === AI_REQUESTER_NAME.toLowerCase()
  );
}

export function resolveAiRunForRequest({
  request,
  aiRuns,
  mapping
}: {
  request: Pick<ChangeRequest, "entityType" | "entityId" | "createdAt">;
  aiRuns: AiRun[];
  mapping?: Pick<CapabilityUseCase, "useCaseId"> | null;
}) {
  const candidates = aiRuns
    .filter((run) => {
      if (request.entityType === "capability_use_case" && mapping) {
        return run.entityType === "use_case" && run.entityId === mapping.useCaseId;
      }

      return run.entityType === request.entityType && run.entityId === request.entityId;
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  if (!candidates.length) {
    return null;
  }

  return (
    candidates.find(
      (run) => new Date(run.createdAt).getTime() <= new Date(request.createdAt).getTime()
    ) ?? candidates[0]
  );
}
