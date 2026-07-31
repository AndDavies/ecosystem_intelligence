import { NextResponse } from "next/server";
import { publicSubmissionSchema } from "@/lib/beta/validation";
import {
  SUBMISSION_DAILY_LIMIT,
  memberWorkflowWindowStart,
  isMemberWorkflowQuotaError,
  readBoundedJson
} from "@/lib/security/bounded-json";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.json(
      { error: "Profile claims and corrections require the hosted authentication service." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await readBoundedJson(request);
  if (!body.ok) {
    return NextResponse.json(
      { error: body.reason === "too_large" ? "The submission is too large." : "Invalid submission." },
      { status: body.reason === "too_large" ? 413 : 400 }
    );
  }

  const parsed = publicSubmissionSchema.safeParse(body.value);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid submission.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { count, error: quotaError } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .gte("created_at", memberWorkflowWindowStart());
  if (quotaError) {
    return NextResponse.json({ error: "The submission could not be staged for review." }, { status: 500 });
  }
  if ((count ?? 0) >= SUBMISSION_DAILY_LIMIT) {
    return NextResponse.json(
      { error: "You have reached today’s contribution limit. Please try again later." },
      { status: 429 }
    );
  }

  const { data, error } = await supabase
    .from("submissions")
    .insert({
      owner_id: user.id,
      submission_type: parsed.data.submissionType,
      target_entity_type: parsed.data.targetEntityType ?? null,
      target_entity_id: parsed.data.targetEntityId ?? null,
      submitted_payload: parsed.data.payload,
      status: "pending"
    })
    .select("id, status, created_at")
    .single();

  if (isMemberWorkflowQuotaError(error)) {
    return NextResponse.json(
      { error: "You have reached today’s contribution limit. Please try again later." },
      { status: 429 }
    );
  }
  if (error) {
    return NextResponse.json({ error: "The submission could not be staged for review." }, { status: 500 });
  }

  return NextResponse.json(
    {
      submission: data,
      message: "Submitted for editorial review. Public records were not changed."
    },
    { status: 202 }
  );
}
