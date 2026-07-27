import { NextResponse } from "next/server";
import { getAtlasCoverageSummary } from "@/lib/atlas/repository";

export async function GET() {
  const summary = await getAtlasCoverageSummary();

  return NextResponse.json(summary, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600"
    }
  });
}
