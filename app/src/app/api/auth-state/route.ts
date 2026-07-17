import { NextResponse } from "next/server";
import { getAtlasUser } from "@/lib/atlas/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAtlasUser();
  return NextResponse.json(
    { signedIn: Boolean(user) },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
