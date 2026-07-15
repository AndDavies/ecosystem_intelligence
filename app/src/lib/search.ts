export interface SearchField<T> {
  label: string;
  weight?: number;
  value: (item: T) => string | null | undefined;
}

export interface RankedSearchResult<T> {
  item: T;
  score: number;
  matchContext: string;
}

function normalizeSearchText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function scoreTextMatch(query: string, value: string | null | undefined) {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedValue = normalizeSearchText(value);

  if (!normalizedQuery || !normalizedValue.includes(normalizedQuery)) {
    return 0;
  }

  if (normalizedValue === normalizedQuery) {
    return 120;
  }

  if (normalizedValue.startsWith(normalizedQuery)) {
    return 90;
  }

  const words = normalizedValue.split(/[^a-z0-9]+/).filter(Boolean);
  if (words.includes(normalizedQuery)) {
    return 70;
  }

  return 45;
}

export function rankSearchResults<T extends { name: string }>(
  items: T[],
  query: string,
  fields: SearchField<T>[]
) {
  return items
    .map((item) => {
      let bestScore = 0;
      let bestLabel = "Match";
      let totalScore = 0;

      fields.forEach((field) => {
        const fieldScore = scoreTextMatch(query, field.value(item));

        if (!fieldScore) {
          return;
        }

        const weightedScore = fieldScore * (field.weight ?? 1);
        totalScore += weightedScore;

        if (weightedScore > bestScore) {
          bestScore = weightedScore;
          bestLabel = field.label;
        }
      });

      if (!totalScore) {
        return null;
      }

      return {
        item,
        score: totalScore,
        matchContext: `Matched ${bestLabel.toLowerCase()}`
      } satisfies RankedSearchResult<T>;
    })
    .filter((value): value is RankedSearchResult<T> => Boolean(value))
    .sort((left, right) => right.score - left.score || left.item.name.localeCompare(right.item.name));
}

export function mergeUniqueById<T extends { id: string }>(...groups: T[][]) {
  const merged = new Map<string, T>();

  groups.flat().forEach((item) => {
    if (!merged.has(item.id)) {
      merged.set(item.id, item);
    }
  });

  return Array.from(merged.values());
}
