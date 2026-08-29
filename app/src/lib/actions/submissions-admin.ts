"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { createClient } from "@/lib/supabase/server";

const submissionReviewSchema = z.object({
  submissionId: z.string().uuid(),
  expectedStatus: z.enum(["pending", "in_review"]),
  action: z.enum(["start_review", "return_pending", "approve", "reject"]),
  rationale: z.string().trim().min(20).max(2000)
});

export async function reviewPublicSubmission(formData: FormData) {
  await requireAtlasStaff("reviewer");
  const parsed = submissionReviewSchema.safeParse({
    submissionId: String(formData.get("submissionId") ?? ""),
    expectedStatus: String(formData.get("expectedStatus") ?? ""),
    action: String(formData.get("action") ?? ""),
    rationale: String(formData.get("rationale") ?? "")
  });
  if (!parsed.success) redirect("/admin/submissions?error=invalid");

  const supabase = await createClient({ writeCookies: true });
  const { data, error } = await supabase.rpc("review_public_submission", {
    p_submission_id: parsed.data.submissionId,
    p_expected_status: parsed.data.expectedStatus,
    p_action: parsed.data.action,
    p_rationale: parsed.data.rationale
  });
  if (error || !data) {
    const stale = /no longer|status|pending|review/i.test(error?.message ?? "");
    redirect(`/admin/submissions?error=${stale ? "stale" : "update"}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/submissions");
  revalidatePath("/admin/insights");
  revalidatePath("/account");
  redirect(`/admin/submissions?success=${encodeURIComponent(String(data))}`);
}
