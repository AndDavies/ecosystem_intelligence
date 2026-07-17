import { revalidateTag } from "next/cache";
import { getAtlasUser } from "@/lib/atlas/auth";

export async function POST() {
  const user = await getAtlasUser();
  if (!user || !["reviewer", "admin"].includes(user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });
  revalidateTag("atlas-public");
  return Response.json({ ok: true });
}
