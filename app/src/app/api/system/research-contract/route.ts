import { dossierPresentationCopyAvailable } from "@/lib/atlas/presentation-copy-support";
import { NextResponse } from "next/server";
import { researchReviewContract } from "@/lib/research/deployment-contract";

export const dynamic = "force-dynamic";

export async function GET() {
  const copyReady = await dossierPresentationCopyAvailable();
  return NextResponse.json(
    {
      ...researchReviewContract,
      candidatePresentationCopyPublication: copyReady === true ? "dossier_presentation_copy_v1" : undefined,
      deployment: process.env.VERCEL_GIT_COMMIT_SHA ?? "local"
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
