import type { AtlasRole } from "@/lib/atlas/auth";

export const ATLAS_ADMIN_OWNER_ID = "b443c433-2a78-4ca7-8a19-a8f40b140049";
export const ATLAS_ADMIN_OWNER_EMAIL = "m.andrew.davies@gmail.com";

export function isAtlasAdminOwner(user: { id: string; email: string; role: AtlasRole } | null | undefined) {
  return Boolean(
    user
      && user.id === ATLAS_ADMIN_OWNER_ID
      && user.email.toLowerCase() === ATLAS_ADMIN_OWNER_EMAIL
      && user.role === "admin"
  );
}
