import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const submissionSchema = z.object({
  submissionType: z.enum(["profile_claim", "correction", "new_organization"]),
  targetEntityType: z.string().trim().max(80).nullable().optional(),
  targetEntityId: z.string().uuid().nullable().optional(),
  payload: z.record(z.string(), z.unknown()).refine((value) => Object.keys(value).length > 0, {
    message: "Submission payload cannot be empty."
  })
});

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

  const parsed = submissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid submission.", details: parsed.error.flatten() },
      { status: 400 }
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
