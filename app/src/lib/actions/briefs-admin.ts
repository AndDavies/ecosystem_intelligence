"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { createClient } from "@/lib/supabase/server";
import { defenceBriefImageBucket, defenceBriefImageUrl } from "@/lib/atlas/brief-images";

const schema = z.object({
  pageId: z.string().uuid().optional(),
  payload: z.string().min(2).max(100000),
  sourceLinks: z.string().min(2).max(100000),
  recordLinks: z.string().min(2).max(100000)
});

export async function saveDefenceBrief(formData: FormData) {
  const user = await requireAtlasStaff("admin");
  const parsed = schema.safeParse({
    pageId: String(formData.get("pageId") ?? "") || undefined,
    payload: String(formData.get("payload") ?? ""),
    sourceLinks: String(formData.get("sourceLinks") ?? ""),
    recordLinks: String(formData.get("recordLinks") ?? "")
  });
  if (!parsed.success) redirect("/admin/briefs?error=invalid");
  let payload: Record<string, unknown>;
  let sourceLinks: unknown;
  let recordLinks: unknown;
  try {
    const parsedPayload: unknown = JSON.parse(parsed.data.payload);
    if (!parsedPayload || typeof parsedPayload !== "object" || Array.isArray(parsedPayload)) throw new Error("Invalid payload");
    payload = parsedPayload as Record<string, unknown>;
    sourceLinks = JSON.parse(parsed.data.sourceLinks);
    recordLinks = JSON.parse(parsed.data.recordLinks);
  } catch {
    redirect("/admin/briefs?error=invalid");
  }
  const supabase = await createClient({ writeCookies: true });
  const heroImage = formData.get("heroImageFile");
  let uploadedImagePath: string | null = null;
  if (heroImage instanceof File && heroImage.size > 0) {
    const extensionByType: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
    const extension = extensionByType[heroImage.type];
    if (!extension || heroImage.size > 10 * 1024 * 1024) redirect("/admin/briefs?error=invalid-image");
    const slug = String(payload.slug ?? "defence-brief").replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "defence-brief";
    uploadedImagePath = `${slug}-${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from(defenceBriefImageBucket).upload(uploadedImagePath, heroImage, {
      contentType: heroImage.type,
      cacheControl: "31536000",
      upsert: false
    });
    if (uploadError) redirect("/admin/briefs?error=image-upload");
    payload.heroImagePath = supabase.storage.from(defenceBriefImageBucket).getPublicUrl(uploadedImagePath).data.publicUrl;
  }
  const selectedImagePath = String(payload.heroImagePath ?? "");
  if (!selectedImagePath.startsWith(defenceBriefImageUrl(""))) redirect("/admin/briefs?error=invalid-image");
  const { error } = await supabase.rpc("upsert_defence_brief", {
    p_page_id: parsed.data.pageId ?? null,
    p_reviewer_id: user.id,
    p_payload: payload,
    p_source_links: sourceLinks,
    p_record_links: recordLinks,
    p_rationale: null
  });
  if (error) {
    if (uploadedImagePath) await supabase.storage.from(defenceBriefImageBucket).remove([uploadedImagePath]);
    redirect("/admin/briefs?error=save");
  }
  revalidateTag("briefs-public");
  revalidatePath("/briefs");
  revalidatePath("/briefs/[slug]", "page");
  revalidatePath("/admin/briefs");
  revalidatePath("/sitemap.xml");
  redirect("/admin/briefs?success=saved");
}
