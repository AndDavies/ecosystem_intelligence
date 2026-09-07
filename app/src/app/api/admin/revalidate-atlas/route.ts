import { requireAdminOwner } from "@/lib/atlas/auth";
import { revalidatePublishedAtlas } from "@/lib/atlas/public-cache-invalidation";

export async function POST() {
  try {
    await requireAdminOwner();
  } catch {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  revalidatePublishedAtlas({
    discoveryChanged: true,
    demandChanged: true,
    organizationDossiersChanged: true
  });
  return Response.json({ ok: true });
}
