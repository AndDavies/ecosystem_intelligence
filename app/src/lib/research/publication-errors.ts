type PublicationRpcError = {
  code?: string | null;
  message?: string | null;
};

export function researchPublicationErrorRedirect(error: PublicationRpcError, selectedCandidateId?: string | null) {
  const message = error.message ?? "";
  const missingIssuer = message.match(/^Unknown parent demand issuer ([a-z0-9-]+)\.$/i)?.[1];
  if (missingIssuer) return `/admin/publish?error=missing-demand-issuer&issuer=${encodeURIComponent(missingIssuer)}`;

  const staleChild = message.match(/^Refresh candidate ([0-9a-f-]+) has a stale child baseline for (capability|program participation|organization relationship|funding event) ([0-9a-f-]+)\.$/i);
  if (staleChild) {
    const childType = staleChild[2].toLowerCase().replaceAll(" ", "-");
    const params = new URLSearchParams({
      error: "stale-child",
      candidate: staleChild[1],
      childType,
      child: staleChild[3]
    });
    return `/admin/publish?${params.toString()}`;
  }

  const stale = message.match(/^Refresh candidate ([0-9a-f-]+)(?: \(([^)]+)\))? has a stale baseline\.$/i);
  if (stale) {
    const params = new URLSearchParams({ error: "stale-refresh", candidate: stale[1] });
    if (stale[2]) params.set("record", stale[2]);
    return `/admin/publish?${params.toString()}`;
  }

  const precision = message.match(/^Refresh candidate ([0-9a-f-]+)(?: \(([^)]+)\))? has inconsistent timestamp precision\.$/i);
  if (precision) {
    const params = new URLSearchParams({ error: "refresh-baseline", candidate: precision[1] });
    if (precision[2]) params.set("record", precision[2]);
    return `/admin/publish?${params.toString()}`;
  }

  if (/^Published current activity and its as-of date must remain paired\.$/i.test(message)) {
    return "/admin/publish?error=activity-pair";
  }

  const programConflict = message.match(/^Existing program ([a-z0-9-]+) does not match the reviewed canonical program payload\.$/i)?.[1];
  if (programConflict) {
    const params = new URLSearchParams({ error: "canonical-program-conflict", program: programConflict });
    if (selectedCandidateId) params.set("candidate", selectedCandidateId);
    return `/admin/publish?${params.toString()}`;
  }

  return "/admin/publish?error=publication-failed";
}
