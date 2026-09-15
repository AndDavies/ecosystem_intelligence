import { NextResponse } from "next/server";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { createClient } from "@/lib/supabase/server";
import { candidateLogoPrivateBucket, preparedCandidateLogo } from "@/lib/research/candidate-logo-storage";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAtlasStaff("reviewer");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new NextResponse(null, { status: 404 });
  const client = await createClient();
  const { data: candidate, error } = await client.from("candidate_changes").select("proposed_record").eq("id", id).maybeSingle();
  if (error || !candidate) return new NextResponse(null, { status: 404 });
  const logo = preparedCandidateLogo(candidate.proposed_record);
  if (!logo) return new NextResponse(null, { status: 404 });
  const { data, error: imageError } = await client.storage.from(candidateLogoPrivateBucket).download(logo.storagePath);
  if (imageError || !data) return new NextResponse(null, { status: 404 });
  return new NextResponse(await data.arrayBuffer(), { headers: {
    "Content-Type": "image/webp", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow"
  } });
}
