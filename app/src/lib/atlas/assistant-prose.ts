/** Remove only the observed orphan schema key, never citation-related prose. */
export function normalizeAssistantLimitation(value: string) {
  const text = value.trim().replace(/\s+/g, " ");
  if (text === "citationIds") return "";
  return text.replace(/([.!?])\s+citationIds$/, "$1");
}

export function hasOrphanCitationKey(value: string) {
  const text = value.trim().replace(/\s+/g, " ");
  return normalizeAssistantLimitation(text) !== text;
}
