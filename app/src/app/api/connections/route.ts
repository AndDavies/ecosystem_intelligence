import { NextResponse } from "next/server";
import { connectionRequestSchema } from "@/lib/beta/validation";
import {
  CONNECTION_DAILY_LIMIT,
  memberWorkflowWindowStart,
  isMemberWorkflowQuotaError,
  readBoundedJson
} from "@/lib/security/bounded-json";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Sign-in is required." }, { status: 401 });

  const body = await readBoundedJson(request);
  if (!body.ok) {
    return NextResponse.json(
      { error: body.reason === "too_large" ? "The request is too large." : "Complete every required field." },
      { status: body.reason === "too_large" ? 413 : 400 }
    );
  }
  const parsed = connectionRequestSchema.safeParse(body.value);
  if (!parsed.success) return NextResponse.json({ error: "Complete every required field." }, { status: 400 });

  const { data: organization } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", parsed.data.organizationId)
    .eq("publication_status", "published")
    .maybeSingle();
  if (!organization) return NextResponse.json({ error: "That published organization could not be found." }, { status: 404 });

  const windowStart = memberWorkflowWindowStart();
  const [{ count, error: quotaError }, { count: duplicateCount, error: duplicateError }] = await Promise.all([
    supabase
    .from("connection_requests")
    .select("id", { count: "exact", head: true })
    .eq("requester_id", user.id)
    .gte("created_at", windowStart),
    supabase
      .from("connection_requests")
      .select("id", { count: "exact", head: true })
      .eq("requester_id", user.id)
      .eq("organization_id", parsed.data.organizationId)
      .gte("created_at", windowStart)
  ]);
  if (quotaError || duplicateError) return NextResponse.json({ error: "Your request could not be saved. Please try again." }, { status: 500 });
  if ((duplicateCount ?? 0) > 0) {
    return NextResponse.json({ error: "You already requested a connection to this organization today." }, { status: 409 });
  }
  if ((count ?? 0) >= CONNECTION_DAILY_LIMIT) {
    return NextResponse.json({ error: "You have reached today’s connection-request limit." }, { status: 429 });
  }

  const { data, error } = await supabase.from("connection_requests").insert({
    requester_id: user.id,
    requester_email: user.email.toLowerCase(),
    requester_name: parsed.data.requesterName,
    requester_organization: parsed.data.requesterOrganization,
    organization_id: parsed.data.organizationId,
    intent: parsed.data.intent,
    message: parsed.data.message,
    status: "new"
  }).select("id, status, created_at").single();

  if (isMemberWorkflowQuotaError(error)) {
    const duplicate = /same organization/i.test(error?.message ?? "");
    return NextResponse.json(
      { error: duplicate ? "You already requested a connection to this organization today." : "You have reached today’s connection-request limit." },
      { status: duplicate ? 409 : 429 }
    );
  }
  if (error) return NextResponse.json({ error: "Your request could not be saved. Please try again." }, { status: 500 });
  return NextResponse.json({ request: data, message: "Your request is ready for private review." }, { status: 202 });
}
