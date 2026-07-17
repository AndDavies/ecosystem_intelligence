import "server-only";

import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { isAtlasAdminOwner } from "@/lib/atlas/admin-owner";

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

export async function requireAdminOwner() {
  const user = await requireAtlasUser("/admin");
  if (!isAtlasAdminOwner(user)) notFound();
  return user;
}

export async function requireAtlasStaff(_minimum: Exclude<AtlasRole, "member"> = "editor") {
  return requireAdminOwner();
}

export { ATLAS_ADMIN_OWNER_EMAIL, ATLAS_ADMIN_OWNER_ID, isAtlasAdminOwner } from "@/lib/atlas/admin-owner";
