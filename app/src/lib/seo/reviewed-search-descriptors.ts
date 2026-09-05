/** Bounded search-result experiments derived from the published record.
 * These labels add no canonical facts. Remove the override if its supporting
 * public description changes; then let the ordinary metadata fallback apply. */
export function reviewedSearchDescriptor(slug: string, description: string | null | undefined) {
  if (slug === "logistik-unicorp" && /managed uniform/i.test(description ?? "") && /soldier.system/i.test(description ?? "")) {
    return "Uniforms and soldier systems";
  }
  return undefined;
}
