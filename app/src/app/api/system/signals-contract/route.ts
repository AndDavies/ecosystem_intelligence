import { NextResponse } from "next/server";
import { dailySignalsRuntimeContract } from "@/lib/signals/deployment-contract";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ...dailySignalsRuntimeContract,
      deployment: process.env.VERCEL_GIT_COMMIT_SHA ?? "local"
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
