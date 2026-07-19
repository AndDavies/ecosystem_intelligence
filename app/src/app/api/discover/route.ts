import { NextResponse } from "next/server";
import { discoverAtlas } from "@/lib/atlas/repository";
import { normalizeBetaSearchQuery, requestFingerprint } from "@/lib/product-insights/server";
import { betaDiscoveryRequestSchema } from "@/lib/product-insights/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import type { AtlasDiscoveryResult } from "@/types/atlas";

async function recordPilotSearch(
  request: Request,
  input: ReturnType<typeof betaDiscoveryRequestSchema.parse>,
  discovery: AtlasDiscoveryResult
) {
  if (!hasSupabaseAdminEnv()) return null;

  const supabase = createAdminClient();
  const fingerprint = requestFingerprint(request);
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();

  // Retention is enforced opportunistically during active preview use, without
  // requiring a scheduled database job on the free development plan.
  await supabase.from("pilot_searches").delete().lte("expires_at", now.toISOString());

  const { count } = await supabase
    .from("pilot_searches")
    .select("id", { count: "exact", head: true })
    .eq("request_hash", fingerprint)
    .gte("created_at", oneMinuteAgo);

  if ((count ?? 0) >= 30) return null;

  const { data, error } = await supabase
    .from("pilot_searches")
    .insert({
      request_hash: fingerprint,
      session_id: input.sessionId,
      query_text: input.query,
      normalized_query: normalizeBetaSearchQuery(input.query),
      interpretation: discovery.interpretation,
      resolved_filters: discovery.filters,
      result_count: discovery.organizationIds.length,
      zero_result: discovery.organizationIds.length === 0,
      context_path: input.contextPath,
      cohort: input.cohort,
      expires_at: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()
    })
    .select("id")
    .single();

  return error ? null : data.id;
}

export async function POST(request: Request) {
  const parsed = betaDiscoveryRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Enter an English discovery question between 1 and 500 characters."
      },
      { status: 400 }
    );
  }

  const discovery = await discoverAtlas(parsed.data.query);
  const searchId = await recordPilotSearch(request, parsed.data, discovery);

  return NextResponse.json({ ...discovery, searchId }, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
