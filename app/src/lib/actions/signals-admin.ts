"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { signalTagIds } from "@/lib/signals/taxonomy";
import { createClient } from "@/lib/supabase/server";

const editionSchema = z.object({ editionId: z.string().uuid(), title: z.string().trim().min(12).max(180), executiveSummary: z.string().trim().min(400).max(1800), publicationStatus: z.enum(["published", "archived"]) });
const itemSchema = z.object({ itemId: z.string().uuid(), title: z.string().trim().min(8).max(180), bottomLine: z.string().trim().min(30).max(500), executiveSummary: z.string().trim().min(450).max(2200), tags: z.array(z.enum(signalTagIds)).min(1).max(6), sourceFact: z.string().trim().min(30).max(900), automatedRead: z.string().trim().min(30).max(900), unknowns: z.string().trim().min(20).max(600), nextStep: z.string().trim().min(20).max(500), confidence: z.enum(["high", "medium", "limited"]) });

function refreshSignals(slug?: string) {
  revalidateTag("signals-public");
  revalidatePath("/signals");
  if (slug) revalidatePath(`/signals/${slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/signals");
}

export async function updateSignalEdition(formData: FormData) {
  const user = await requireAtlasStaff("admin");
  const parsed = editionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/signals?error=invalid-edition");
  const supabase = await createClient({ writeCookies: true });
  const { data: current } = await supabase.from("signal_editions").select("slug").eq("id", parsed.data.editionId).single();
  const { error } = await supabase.from("signal_editions").update({ title: parsed.data.title, executive_summary: parsed.data.executiveSummary, publication_status: parsed.data.publicationStatus, reviewed_at: new Date().toISOString(), reviewed_by: user.id, amended_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", parsed.data.editionId);
  if (error) redirect("/admin/signals?error=save-failed");
  await supabase.from("audit_events").insert({ actor_id: user.id, actor_role: "admin", event_type: "signal_edition_updated", entity_type: "signal_edition", entity_id: parsed.data.editionId, summary: `Administrator ${parsed.data.publicationStatus === "published" ? "updated" : "archived"} an automated Signals edition.`, metadata: { publication_status: parsed.data.publicationStatus } });
  refreshSignals(current?.slug ? String(current.slug) : undefined);
  redirect("/admin/signals?success=edition-saved");
}

export async function updateSignalItem(formData: FormData) {
  const user = await requireAtlasStaff("admin");
  const parsed = itemSchema.safeParse({ ...Object.fromEntries(formData), tags: formData.getAll("tags") });
  if (!parsed.success) redirect("/admin/signals?error=invalid-item");
  const supabase = await createClient({ writeCookies: true });
  const { data: current } = await supabase.from("signal_items").select("edition_id, signal_editions(slug)").eq("id", parsed.data.itemId).single();
  const { error } = await supabase.from("signal_items").update({ title: parsed.data.title, bottom_line: parsed.data.bottomLine, executive_summary: parsed.data.executiveSummary, tags: parsed.data.tags, source_fact: parsed.data.sourceFact, automated_read: parsed.data.automatedRead, unknowns: parsed.data.unknowns, next_step: parsed.data.nextStep, confidence: parsed.data.confidence, updated_at: new Date().toISOString() }).eq("id", parsed.data.itemId);
  if (error) redirect("/admin/signals?error=save-failed");
  if (current?.edition_id) await supabase.from("signal_editions").update({ amended_at: new Date().toISOString(), reviewed_at: new Date().toISOString(), reviewed_by: user.id, updated_at: new Date().toISOString() }).eq("id", current.edition_id);
  await supabase.from("audit_events").insert({ actor_id: user.id, actor_role: "admin", event_type: "signal_item_updated", entity_type: "signal_item", entity_id: parsed.data.itemId, summary: "Administrator corrected a published automated Signals item.", metadata: {} });
  const relation = current?.signal_editions as unknown;
  const edition = Array.isArray(relation) ? relation[0] : relation;
  refreshSignals(edition && typeof edition === "object" && "slug" in edition ? String((edition as { slug: unknown }).slug) : undefined);
  redirect("/admin/signals?success=item-saved");
}
