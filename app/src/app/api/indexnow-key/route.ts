import {
  indexNowInternalKeyHeader,
  isValidIndexNowKey
} from "@/lib/seo/indexnow";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const key = process.env.INDEXNOW_KEY?.trim();
  const presentedKey = request.headers.get(indexNowInternalKeyHeader);
  if (!isValidIndexNowKey(key) || presentedKey !== key) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(key, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow"
    }
  });
}
