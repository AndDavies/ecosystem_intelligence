import { redirect } from "next/navigation";
import type { Role } from "@/types/domain";
import { mockProfile } from "@/lib/mock-data";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const roleOrder: Role[] = ["viewer", "editor", "reviewer", "admin"];

export function roleMeetsRequirement(actual: Role, minimum: Role) {
  return roleOrder.indexOf(actual) >= roleOrder.indexOf(minimum);
}

export async function getCurrentProfile() {
  if (!hasSupabaseEnv()) {
    return mockProfile;
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return {
      id: user.id,
      email: user.email ?? "",
      fullName: user.user_metadata.full_name ?? null,
      role: "viewer" as const
    };
  }

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role as Role
  };
}

export async function requireProfile(minimumRole: Role = "viewer") {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/sign-in");
  }

  if (!roleMeetsRequirement(profile.role, minimumRole)) {
    redirect("/app?forbidden=1");
  }

  return profile;
}
