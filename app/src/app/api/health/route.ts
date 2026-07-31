import { NextResponse } from "next/server";
import { getAtlasCoverageSummary } from "@/lib/atlas/repository";
import { loadAtlasPublicHealthSnapshotFromSupabase } from "@/lib/atlas/supabase-repository";
import { withPublicReadRetry } from "@/lib/supabase/public-read";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    const [database, coverage] = await Promise.all([
      withPublicReadRetry(loadAtlasPublicHealthSnapshotFromSupabase),
      getAtlasCoverageSummary()
    ]);
    const catalogueConsistent =
      coverage.organizations === database.organizations
      && coverage.capabilities === database.capabilities;
    const status = catalogueConsistent ? "ok" : "degraded";
    return NextResponse.json({
      status,
      checks: {
        publicDatabase: "ok",
        catalogueConsistent,
        organizationsAvailable: database.organizations > 0,
        capabilitiesAvailable: database.capabilities > 0,
        publicNeedsAvailable: database.publicNeeds > 0,
        missionsAvailable: database.missions > 0
      },
      durationMs: Date.now() - startedAt
    }, { status: catalogueConsistent ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { status: "degraded", checks: { publicDatabase: "unavailable" } },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
