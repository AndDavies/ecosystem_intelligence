"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  pageId: z.string().uuid().optional(),
  payload: z.string().min(2).max(100000),
  sourceLinks: z.string().min(2).max(100000),
  recordLinks: z.string().min(2).max(100000),
  rationale: z.string().trim().min(20).max(2000)
});

export async function saveDefenceBrief(formData: FormData) {
  const user = await requireAtlasStaff("admin");
  const parsed = schema.safeParse({
    pageId: String(formData.get("pageId") ?? "") || undefined,
    payload: String(formData.get("payload") ?? ""),
    sourceLinks: String(formData.get("sourceLinks") ?? ""),
    recordLinks: String(formData.get("recordLinks") ?? ""),
    rationale: String(formData.get("rationale") ?? "")
  });
  if (!parsed.success) redirect("/admin/briefs?error=invalid");
  let payload: unknown;
  let sourceLinks: unknown;
  let recordLinks: unknown;
  try {
    payload = JSON.parse(parsed.data.payload);
    sourceLinks = JSON.parse(parsed.data.sourceLinks);
    recordLinks = JSON.parse(parsed.data.recordLinks);
  } catch {
    redirect("/admin/briefs?error=invalid");
  }
  const supabase = await createClient({ writeCookies: true });
  const { error } = await supabase.rpc("upsert_defence_brief", {
    p_page_id: parsed.data.pageId ?? null,
    p_reviewer_id: user.id,
    p_payload: payload,
    p_source_links: sourceLinks,
    p_record_links: recordLinks,
    p_rationale: parsed.data.rationale
  });
  if (error) redirect("/admin/briefs?error=save");
  revalidateTag("briefs-public");
  revalidatePath("/briefs");
  revalidatePath("/briefs/[slug]", "page");
  revalidatePath("/admin/briefs");
  revalidatePath("/sitemap.xml");
  redirect("/admin/briefs?success=saved");
}
