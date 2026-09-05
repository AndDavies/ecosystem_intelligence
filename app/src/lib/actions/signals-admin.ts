"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { signalEditionEditorSchema, signalItemEditorSchema, signalEditorFormInput } from "@/lib/signals/editorial-input";
import { createClient } from "@/lib/supabase/server";

function refreshSignals(slug?: string) {
  revalidateTag("signals-public");
  revalidatePath("/signals");
  if (slug) revalidatePath(`/signals/${slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/signals/feed.xml");
  revalidatePath("/admin/signals");
}

function signalEditorPath(editionId: string, state: "success" | "error", value: string) {
  return `/admin/signals/${editionId}/edit?${state}=${value}`;
}

export async function updateSignalEdition(formData: FormData) {
  const user = await requireAtlasStaff("admin");
  const editionId = String(formData.get("editionId") ?? "");
  if (!z.string().uuid().safeParse(editionId).success) redirect("/admin/signals?error=invalid-edition");
  const supabase = await createClient({ writeCookies: true });
  const { data: current, error: readError } = await supabase.from("signal_editions").select("slug, packet_schema_version").eq("id", editionId).single();
  if (readError || !current) redirect(signalEditorPath(editionId, "error", "edition-unavailable"));
  const parsed = signalEditionEditorSchema(current.packet_schema_version).safeParse(signalEditorFormInput(formData));
  if (!parsed.success) redirect(signalEditorPath(editionId, "error", "invalid-edition"));
  const { error } = await supabase.from("signal_editions").update({ title: parsed.data.title, executive_summary: parsed.data.executiveSummary, summary_sections: parsed.data.summarySections, publication_status: parsed.data.publicationStatus, reviewed_at: new Date().toISOString(), reviewed_by: user.id, amended_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", parsed.data.editionId);
  if (error) redirect(signalEditorPath(parsed.data.editionId, "error", "save-failed"));
  await supabase.from("audit_events").insert({ actor_id: user.id, actor_role: "admin", event_type: "signal_edition_updated", entity_type: "signal_edition", entity_id: parsed.data.editionId, summary: `Administrator ${parsed.data.publicationStatus === "published" ? "updated" : "archived"} an automated Signals edition.`, metadata: { publication_status: parsed.data.publicationStatus } });
  refreshSignals(current?.slug ? String(current.slug) : undefined);
  redirect(signalEditorPath(parsed.data.editionId, "success", "edition-saved"));
}

export async function updateSignalItem(formData: FormData) {
  const user = await requireAtlasStaff("admin");
  const itemId = String(formData.get("itemId") ?? "");
  const returnEditionId = String(formData.get("editionId") ?? "");
  if (!z.string().uuid().safeParse(itemId).success || !z.string().uuid().safeParse(returnEditionId).success) redirect("/admin/signals?error=invalid-item");
  const supabase = await createClient({ writeCookies: true });
  const { data: current, error: readError } = await supabase.from("signal_items").select("edition_id, signal_editions(slug, packet_schema_version)").eq("id", itemId).eq("edition_id", returnEditionId).single();
  if (readError || !current) redirect(signalEditorPath(returnEditionId, "error", "item-unavailable"));
  const relation = current.signal_editions as unknown;
  const edition = (Array.isArray(relation) ? relation[0] : relation) as { slug?: unknown; packet_schema_version?: unknown } | null;
  const parsed = signalItemEditorSchema(edition?.packet_schema_version).safeParse(signalEditorFormInput(formData));
  if (!parsed.success) redirect(signalEditorPath(returnEditionId, "error", "invalid-item"));
  const { error } = await supabase.from("signal_items").update({ title: parsed.data.title, bottom_line: parsed.data.bottomLine, executive_summary: parsed.data.executiveSummary, tags: parsed.data.tags, source_fact: parsed.data.sourceFact, automated_read: parsed.data.automatedRead, unknowns: parsed.data.unknowns, next_step: parsed.data.nextStep, confidence: parsed.data.confidence, updated_at: new Date().toISOString() }).eq("id", parsed.data.itemId);
  if (error) redirect(signalEditorPath(returnEditionId, "error", "save-failed"));
  if (current?.edition_id) await supabase.from("signal_editions").update({ amended_at: new Date().toISOString(), reviewed_at: new Date().toISOString(), reviewed_by: user.id, updated_at: new Date().toISOString() }).eq("id", current.edition_id);
  await supabase.from("audit_events").insert({ actor_id: user.id, actor_role: "admin", event_type: "signal_item_updated", entity_type: "signal_item", entity_id: parsed.data.itemId, summary: "Administrator corrected a published automated Signals item.", metadata: {} });
  refreshSignals(edition && typeof edition === "object" && "slug" in edition ? String((edition as { slug: unknown }).slug) : undefined);
  redirect(signalEditorPath(String(current?.edition_id ?? returnEditionId), "success", "item-saved"));
}
