"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAtlasUser } from "@/lib/atlas/auth";
import { createClient } from "@/lib/supabase/server";

const collectionSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional()
});

const itemSchema = z.object({
  collectionId: z.string().uuid(),
  entityType: z.enum(["organization", "capability"]),
  entityId: z.string().uuid(),
  note: z.string().trim().max(500).optional(),
  returnTo: z.string().trim().optional()
});

function safeReturn(value: string | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

export async function createSavedCollection(formData: FormData) {
  const user = await requireAtlasUser("/collections");
  const parsed = collectionSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? "") || undefined
  });
  if (!parsed.success) redirect("/collections?error=invalid-collection");

  const supabase = await createClient({ writeCookies: true });
  const { data, error } = await supabase
    .from("saved_collections")
    .insert({ owner_id: user.id, name: parsed.data.name, description: parsed.data.description ?? null, is_private: true })
    .select("id")
    .single();

  if (error || !data) redirect("/collections?error=create-failed");
  revalidatePath("/collections");
  redirect(`/collections/${data.id}`);
}

export async function addSavedCollectionItem(formData: FormData) {
  await requireAtlasUser("/collections");
  const parsed = itemSchema.safeParse({
    collectionId: String(formData.get("collectionId") ?? ""),
    entityType: String(formData.get("entityType") ?? ""),
    entityId: String(formData.get("entityId") ?? ""),
    note: String(formData.get("note") ?? "") || undefined,
    returnTo: String(formData.get("returnTo") ?? "") || undefined
  });
  if (!parsed.success) redirect("/collections?error=invalid-item");

  const supabase = await createClient({ writeCookies: true });
  const { error } = await supabase.from("saved_collection_items").upsert(
    {
      collection_id: parsed.data.collectionId,
      entity_type: parsed.data.entityType,
      entity_id: parsed.data.entityId,
      note: parsed.data.note ?? null
    },
    { onConflict: "collection_id,entity_type,entity_id" }
  );
  if (error) redirect(`/collections/${parsed.data.collectionId}?error=save-failed`);
  revalidatePath("/collections");
  revalidatePath(`/collections/${parsed.data.collectionId}`);
  redirect(safeReturn(parsed.data.returnTo, `/collections/${parsed.data.collectionId}`));
}

export async function removeSavedCollectionItem(collectionId: string, itemId: string) {
  await requireAtlasUser(`/collections/${collectionId}`);
  const parsed = z.object({ collectionId: z.string().uuid(), itemId: z.string().uuid() }).safeParse({ collectionId, itemId });
  if (!parsed.success) redirect("/collections?error=invalid-item");
  const supabase = await createClient({ writeCookies: true });
  await supabase.from("saved_collection_items").delete().eq("id", parsed.data.itemId).eq("collection_id", parsed.data.collectionId);
  revalidatePath(`/collections/${parsed.data.collectionId}`);
}
