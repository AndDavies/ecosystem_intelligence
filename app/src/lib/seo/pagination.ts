import type { Metadata } from "next";

export function paginationMetadata(base: Metadata, pathname: string, page: number): Metadata {
  const canonical = page > 1 ? `${pathname}?page=${page}` : pathname;
  return { ...base, alternates: { ...base.alternates, canonical }, openGraph: { ...base.openGraph, url: canonical } };
}

export function paginationRedirect(url: URL): string | null {
  if (!(url.pathname === "/organizations" || url.pathname === "/demand" || /^\/(missions|regions)\/[^/]+$/.test(url.pathname)) || !url.searchParams.has("page")) return null;
  const raw = url.searchParams.get("page")!;
  const page = /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw)) && Number(raw) > 1 ? String(Number(raw)) : null;
  const next = new URL(url);
  next.searchParams.delete("page");
  if (page) next.searchParams.set("page", page);
  return next.search !== url.search ? `${next.pathname}${next.search}` : null;
}
