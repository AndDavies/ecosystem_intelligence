import { NextResponse } from "next/server";
import { getAtlasOrganizationBySlug } from "@/lib/atlas/repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const organization = await getAtlasOrganizationBySlug(slug);

  if (!organization) {
    return NextResponse.json({ error: "Published organization not found." }, { status: 404 });
  }

  return NextResponse.json(organization, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300"
    }
  });
}
