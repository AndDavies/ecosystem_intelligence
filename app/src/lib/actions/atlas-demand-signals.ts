"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { createClient } from "@/lib/supabase/server";

const demandRequirementEditSchema = z.object({
  id: z.string().uuid().or(z.literal("")),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(8).max(300),
  problemStatement: z.string().trim().min(40).max(5000),
  desiredEndState: z.string().trim().min(40).max(5000),
  publicCaveat: z.string().trim().min(20).max(2000),
  displayOrder: z.coerce.number().int().min(0).max(1000)
});

const demandSignalEditSchema = z.object({
  demandSourceId: z.string().uuid().or(z.literal("")),
  rationale: z.string().trim().min(20).max(2000),
  payload: z.object({
    issuerId: z.string().uuid(),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().trim().min(8).max(500),
    publisher: z.string().trim().min(2).max(240),
    canonicalUrl: z.string().url().startsWith("https://"),
    publishedOn: z.string().date().or(z.literal("")),
    summary: z.string().trim().min(40).max(5000),
    sourceKind: z.enum(["strategic_policy", "capability_plan", "innovation_challenge", "funding_program", "procurement_notice", "award_or_contract", "official_problem_statement"]),
    commitmentLevel: z.enum(["directional", "programmatic", "procurement"]),
    sourceLocator: z.string().trim().min(3).max(500),
    sourceExcerpt: z.string().trim().min(40).max(2000),
    sourceVerified: z.literal(true),
    requirements: z.array(demandRequirementEditSchema).min(1).max(50)
  })
});

export async function upsertPublishedDemandSignal(formData: FormData) {
  const user = await requireAtlasStaff("admin");
  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    redirect("/admin/demand-signals?error=invalid-payload");
  }
  const parsed = demandSignalEditSchema.safeParse({
    demandSourceId: String(formData.get("demandSourceId") ?? ""),
    rationale: String(formData.get("rationale") ?? ""),
    payload
  });
  if (!parsed.success) redirect("/admin/demand-signals?error=invalid-payload");

  const supabase = await createClient({ writeCookies: true });
  const { data: demandSourceId, error } = await supabase.rpc("upsert_published_demand_signal", {
    p_demand_source_id: parsed.data.demandSourceId || null,
    p_reviewer_id: user.id,
    p_payload: parsed.data.payload,
    p_rationale: parsed.data.rationale
  });
  if (error || typeof demandSourceId !== "string") redirect("/admin/demand-signals?error=update-failed");

  revalidateTag("atlas-public");
  revalidatePath("/");
  revalidatePath("/demand");
  revalidatePath("/demand/[slug]", "page");
  revalidatePath("/organizations/[slug]", "page");
  revalidatePath("/capabilities/[slug]", "page");
  revalidatePath("/admin");
  revalidatePath("/admin/demand-signals");
  revalidatePath("/admin/demand-matches");
  redirect(`/admin/demand-signals?success=${parsed.data.demandSourceId ? "updated" : "created"}`);
}
