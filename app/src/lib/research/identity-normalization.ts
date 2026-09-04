export function normalizeOrganizationIdentity(value: string) {
  // Canonical-repair comparisons deliberately normalize the raw alias again:
  // an older generated database key can retain replacement whitespace at the
  // edge of punctuation-heavy names.
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
