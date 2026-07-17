import { getAtlasUser } from "@/lib/atlas/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET() {
  const user = await getAtlasUser();
  if (!user || !["editor", "reviewer", "admin"].includes(user.role)) return new Response("Forbidden", { status: 403 });
  const { data, error } = await createAdminClient().from("pilot_update_signups").select("email, status, consent_version, consent_text, source, cohort, landing_path, created_at, updated_at").order("created_at", { ascending: false });
  if (error) return new Response("Export unavailable", { status: 500 });
  const headers = ["email", "status", "consent_version", "consent_text", "source", "cohort", "landing_path", "created_at", "updated_at"];
  const csv = [headers.join(","), ...(data ?? []).map((row) => headers.map((key) => csvCell(row[key as keyof typeof row])).join(","))].join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=ecosystem-intelligence-subscribers.csv", "Cache-Control": "private, no-store" } });
}
