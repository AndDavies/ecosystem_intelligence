import { NextResponse } from "next/server";
import { getUseCaseBySlug } from "@/lib/data/repository";
import { buildCsv } from "@/lib/export/csv";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const useCaseSlug = searchParams.get("useCaseSlug");

  if (type !== "use-case-targets" || !useCaseSlug) {
    return NextResponse.json({ error: "Invalid export request." }, { status: 400 });
  }

  const useCase = await getUseCaseBySlug(useCaseSlug);

  if (!useCase) {
    return NextResponse.json({ error: "Use case not found." }, { status: 404 });
  }

  const header = [
    "capability_name",
    "company_name",
    "cluster_name",
    "pathway",
    "relevance_band",
    "defence_relevance",
    "ranking_score",
    "suggested_action_type",
    "why_it_matters"
  ];
  const rows = useCase.topTargets.map((entry) => [
    entry.capability.name,
    entry.company.name,
    entry.cluster.name,
    entry.mapping.pathway,
    entry.mapping.relevanceBand,
    entry.mapping.defenceRelevance,
    String(entry.mapping.rankingScore),
    entry.mapping.suggestedActionType,
    entry.mapping.whyItMatters
  ]);
  const csv = buildCsv(header, rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${useCaseSlug}-top-targets.csv"`
    }
  });
}
