import { revalidateTag } from "next/cache";
import { requireAdminOwner } from "@/lib/atlas/auth";

export async function POST() {
  try {
    await requireAdminOwner();
  } catch {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  revalidateTag("atlas-public");
  return Response.json({ ok: true });
}
