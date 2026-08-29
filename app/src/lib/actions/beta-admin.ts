"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const workflowSchema = z.discriminatedUnion("workflow", [
  z.object({ workflow: z.literal("connection"), id: z.string().uuid(), status: z.enum(["new", "reviewing", "introduced", "declined", "closed"]), notes: z.string().trim().max(4000).optional() }),
  z.object({ workflow: z.literal("contact"), id: z.string().uuid(), status: z.enum(["new", "reviewing", "replied", "closed", "spam"]), notes: z.string().trim().max(4000).optional() }),
  z.object({ workflow: z.literal("feedback"), id: z.coerce.number().int().positive(), status: z.enum(["pending", "reviewed", "archived"]), notes: z.string().trim().max(4000).optional() })
]);

export async function updateBetaWorkflow(formData: FormData) {
  const reviewer = await requireAtlasStaff("editor");
  const parsed = workflowSchema.safeParse({
    workflow: String(formData.get("workflow") ?? ""),
    id: String(formData.get("id") ?? ""),
    status: String(formData.get("status") ?? ""),
    notes: String(formData.get("notes") ?? "")
  });
  if (!parsed.success) redirect("/admin/insights?error=invalid");

  const admin = createAdminClient();
  const value = parsed.data;
  let error: { message: string } | null = null;
  if (value.workflow === "connection") {
    ({ error } = await admin.from("connection_requests").update({ status: value.status, reviewer_id: reviewer.id, reviewer_notes: value.notes || null, reviewed_at: new Date().toISOString() }).eq("id", value.id));
  } else if (value.workflow === "contact") {
    ({ error } = await admin.from("contact_messages").update({ status: value.status, reviewer_id: reviewer.id, reviewer_notes: value.notes || null, reviewed_at: new Date().toISOString() }).eq("id", value.id));
  } else {
    ({ error } = await admin.from("pilot_feedback").update({ status: value.status }).eq("id", value.id));
  }
  if (error) redirect("/admin/insights?error=update");
  revalidatePath("/admin/insights");
}
