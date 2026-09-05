import { boundedMap } from "../research/bounded-map";

/** Read every page in a stable caller-defined order. Never return a partial export. */
export async function collectPagedRows<T>(
  loadPage: (from: number, to: number) => PromiseLike<{data: T[] | null; error: {message?: string} | null}>,
  label: string,
  pageSize=1000
): Promise<T[]> {
  if (!Number.isInteger(pageSize) || pageSize <= 0) throw new Error(`Invalid page size for ${label}: ${pageSize}`);
  const rows: T[]=[];
  for (let from=0;;from+=pageSize) {
    const result=await loadPage(from,from+pageSize-1);
    if (result.error) throw new Error(`Unable to load ${label}: ${result.error.message ?? "unknown database error"}`);
    const page=result.data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

/** Keep ID filters below URL limits while preserving the complete requested set. */
export async function collectPagedRowsByIds<T>(
  ids: readonly string[],
  loadPage: (batch: string[], from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message?: string } | null }>,
  label: string
): Promise<T[]> {
  const uniqueIds = [...new Set(ids)];
  const batches: string[][] = [];
  for (let from = 0; from < uniqueIds.length; from += 100) batches.push(uniqueIds.slice(from, from + 100));
  return (await boundedMap(batches, 3, (batch) => collectPagedRows((from, to) => loadPage(batch, from, to), label))).flat();
}
