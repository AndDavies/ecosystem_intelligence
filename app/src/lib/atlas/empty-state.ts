export interface AtlasEmptyState {
  kind: "search" | "map_bounds";
  title: string;
  description: string;
}

export function getAtlasEmptyState(input: { totalResults: number; submittedQuery?: string | null }): AtlasEmptyState {
  const submittedQuery = input.submittedQuery?.trim();

  if (input.totalResults === 0 && submittedQuery) {
    return {
      kind: "search",
      title: `No published organizations matched “${submittedQuery}”`,
      description:
        "Try a broader geography such as Nova Scotia or Atlantic Canada, remove one filter, or tell us which organization or capability is missing."
    };
  }

  return {
    kind: "map_bounds",
    title: "No organizations are visible in this map area",
    description: "Pan or zoom out on the map. The synchronized list includes only organizations inside the visible bounds."
  };
}
