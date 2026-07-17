import { NextResponse } from "next/server";
import { connectionRequestSchema } from "@/lib/beta/validation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Sign-in is required." }, { status: 401 });

  const parsed = connectionRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Complete every required field." }, { status: 400 });

  const { data: organization } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", parsed.data.organizationId)
    .eq("publication_status", "published")
    .maybeSingle();
  if (!organization) return NextResponse.json({ error: "That published organization could not be found." }, { status: 404 });

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

  if (error) return NextResponse.json({ error: "Your request could not be saved. Please try again." }, { status: 500 });
  return NextResponse.json({ request: data, message: "Your request is ready for private review." }, { status: 202 });
}
