import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

export type AtlasRole = "member" | "editor" | "reviewer" | "admin";

export async function getAtlasUser() {
  if (!hasSupabasePublicEnv()) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const rawRole = user.app_metadata?.role;
  const role: AtlasRole = ["editor", "reviewer", "admin"].includes(rawRole) ? rawRole : "member";
  return {
    id: user.id,
    email: user.email ?? "",
    role
  };
}

export async function requireAtlasUser(next = "/collections") {
  const user = await getAtlasUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAtlasStaff(minimum: Exclude<AtlasRole, "member"> = "editor") {
  const user = await requireAtlasUser("/admin");
  const order: AtlasRole[] = ["member", "editor", "reviewer", "admin"];
  if (order.indexOf(user.role) < order.indexOf(minimum)) redirect("/?forbidden=staff");
  return user;
}
