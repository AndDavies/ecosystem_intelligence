export function canonicalRepairPublicationErrorCode(
  error: { code?: string | null; message?: string | null } | null
) {
  const message = error?.message?.toLowerCase() ?? "";
  if (message.includes("successor") || message.includes("one-hop")) return "canonical-repair-successor";
  if (error?.code === "23505" || message.includes("collid") || message.includes("duplicate")) {
    return "canonical-repair-collision";
  }
  if (message.includes("blocked by") || message.includes("saved item") || message.includes("published editorial link")) {
    return "canonical-repair-protected";
  }
  if (["40001", "P0001"].includes(error?.code ?? "") || message.includes("changed after") || message.includes("stale")) {
    return "canonical-repair-stale";
  }
  return "canonical-repair-failed";
}
