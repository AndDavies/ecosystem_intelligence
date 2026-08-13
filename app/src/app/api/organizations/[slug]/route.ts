import { NextResponse } from "next/server";
import {
  authorizeAtlasOrganizationReleaseProbe,
  getAtlasOrganizationBySlug,
  getAtlasOrganizationBySlugForReleaseProbe
} from "@/lib/atlas/repository";
import { dossierReleaseProbeHeader } from "@/lib/launch/dossier-release-gate";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const deployment = new URL(request.url).searchParams.get("cold_dossier_gate");
  const probeToken = request.headers.get(dossierReleaseProbeHeader) ?? "";
  const probeAuthorization = deployment
    ? authorizeAtlasOrganizationReleaseProbe(slug, deployment, probeToken)
    : null;
  if (deployment && !probeAuthorization) {
    return NextResponse.json(
      { error: "Dossier release probe authorization failed." },
      { status: 403, headers: { "Cache-Control": "private, no-store" } }
    );
  }
  const organization = deployment && probeAuthorization
    ? await getAtlasOrganizationBySlugForReleaseProbe(slug, deployment, probeAuthorization)
    : await getAtlasOrganizationBySlug(slug);

  if (!organization) {
    return NextResponse.json({ error: "Published organization not found." }, { status: 404 });
  }

  return NextResponse.json(organization, {
    headers: {
      "Cache-Control": deployment ? "private, no-store" : "public, max-age=60, stale-while-revalidate=300"
    }
  });
}
