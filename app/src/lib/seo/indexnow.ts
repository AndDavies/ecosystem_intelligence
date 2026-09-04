import { siteUrl } from "@/lib/site";

export const indexNowEndpoint = "https://api.indexnow.org/indexnow";
export const indexNowInternalKeyHeader = "x-tnm-indexnow-key";

const indexNowKeyPattern = /^[A-Za-z0-9-]{8,128}$/;
const excludedPathPrefixes = [
  "/account",
  "/admin",
  "/api",
  "/auth",
  "/collections",
  "/connect",
  "/dev",
  "/sign-in",
  "/submit"
];

export function isValidIndexNowKey(value: string | null | undefined): value is string {
  return Boolean(value && indexNowKeyPattern.test(value));
}

export function indexNowKeyLocation(key: string) {
  if (!isValidIndexNowKey(key)) throw new Error("INDEXNOW_KEY must contain 8 to 128 letters, numbers, or dashes.");
  return `${siteUrl}/${key}.txt`;
}

export function indexNowPublicUrl(pathname: string) {
  if (!pathname.startsWith("/") || pathname.startsWith("//")) {
    throw new Error("IndexNow requires one exact site-relative public path.");
  }
  if (pathname.includes("%")) {
    throw new Error("IndexNow paths must use an unencoded canonical pathname.");
  }
  const url = new URL(pathname, siteUrl);
  if (url.origin !== new URL(siteUrl).origin || url.search || url.hash || url.pathname !== pathname) {
    throw new Error("IndexNow paths must be canonical and cannot contain a query string or fragment.");
  }
  if (pathname.length > 1 && pathname.endsWith("/")) {
    throw new Error("IndexNow paths must use the canonical no-trailing-slash form.");
  }
  if (excludedPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    throw new Error("IndexNow cannot submit private, administrative, authentication, or API paths.");
  }
  return `${siteUrl}${pathname}`;
}

export function singleUrlIndexNowPayload(key: string, pathname: string) {
  const url = indexNowPublicUrl(pathname);
  return {
    host: new URL(siteUrl).host,
    key,
    keyLocation: indexNowKeyLocation(key),
    urlList: [url]
  };
}
