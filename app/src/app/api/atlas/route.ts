import { NextResponse } from "next/server";
import { atlasQueryFromSearchParams } from "@/lib/atlas/query-params";
import { queryAtlas } from "@/lib/atlas/repository";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = atlasQueryFromSearchParams(url.searchParams);
  const result = await queryAtlas(query);

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300"
    }
  });
}
