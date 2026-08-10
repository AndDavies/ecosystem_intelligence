import { revalidateTag } from "next/cache";
import { requireAdminOwner } from "@/lib/atlas/auth";
import { atlasDiscoveryCacheTag, atlasOrganizationGlobalCacheTag } from "@/lib/atlas/cache-tags";

export async function POST() {
  try {
    await requireAdminOwner();
  } catch {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  revalidateTag("atlas-public");
  revalidateTag(atlasDiscoveryCacheTag);
  revalidateTag(atlasOrganizationGlobalCacheTag);
  return Response.json({ ok: true });
}
