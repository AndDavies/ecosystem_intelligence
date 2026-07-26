import { NextResponse } from "next/server";
import { getPublishedAtlasSlugs } from "@/lib/atlas/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    const records = await getPublishedAtlasSlugs();
    return NextResponse.json({
      status: "ok",
      checks: {
        publicDatabase: "ok",
        organizationsAvailable: records.organizations.length > 0,
        capabilitiesAvailable: records.capabilities.length > 0,
        publicNeedsAvailable: records.demands.length > 0
      },
      durationMs: Date.now() - startedAt
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { status: "degraded", checks: { publicDatabase: "unavailable" } },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
