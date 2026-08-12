export const researchSourceFamilyMaxLength = 120;

function stableHash(value: string) {
  let hash = 14695981039346656037n;
  for (const character of value) {
    hash ^= BigInt(character.codePointAt(0) ?? 0);
    hash = BigInt.asUintN(64, hash * 1099511628211n);
  }
  return hash.toString(36).padStart(13, "0");
}

/**
 * Produce a stable, portable source-family key without allowing long labels
 * with the same prefix to collapse onto the same truncated value.
 */
export function buildResearchSourceFamily(value: string, maxLength = researchSourceFamilyMaxLength) {
  if (!Number.isInteger(maxLength) || maxLength < 32) {
    throw new Error("A source-family key requires an integer maximum length of at least 32 characters.");
  }

  const slug = value
    .trim()
    .normalize("NFKD")
    .toLocaleLowerCase("en-CA")
    .replace(/\p{M}+/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const normalized = slug || `source-${stableHash(value.trim())}`;
  if (normalized.length <= maxLength) return normalized;

  const suffix = stableHash(normalized);
  const prefix = normalized
    .slice(0, maxLength - suffix.length - 1)
    .replace(/-+$/g, "");
  return `${prefix}-${suffix}`;
}
