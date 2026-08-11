import { NextResponse } from "next/server";
import { getLatestPublishedSignalProof } from "@/lib/atlas/signals";

export async function GET() {
  const proof = await getLatestPublishedSignalProof();
  return NextResponse.json(
    { proof },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300" } }
  );
}
