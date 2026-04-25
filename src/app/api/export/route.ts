import { NextResponse } from "next/server";
import { getUseCaseBriefingBySlug, getUseCaseBySlug } from "@/lib/data/repository";
import { buildCsv } from "@/lib/export/csv";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const useCaseSlug = searchParams.get("useCaseSlug");

  if (!useCaseSlug || (type !== "use-case-targets" && type !== "use-case-briefing")) {
    return NextResponse.json({ error: "Invalid export request." }, { status: 400 });
  }

  if (type === "use-case-briefing") {
    const briefing = await getUseCaseBriefingBySlug(useCaseSlug);

    if (!briefing) {
      return NextResponse.json({ error: "Use case not found." }, { status: 404 });
    }

    const markdown = [
      `# ${briefing.useCase.useCase.name} Briefing`,
      "",
      `## Mission Decision`,
      briefing.useCase.useCase.requiredDecision,
      "",
      `## Mission Outcome`,
      briefing.useCase.useCase.missionOutcome,
      "",
      "## Top Targets",
      ...briefing.targets.flatMap((target) => [
        "",
        `### ${target.rank}. ${target.entry.capability.name} - ${target.entry.company.name}`,
        `- Status suggestion: ${target.suggestedStatus}`,
        `- Why now: ${target.targetRead.priorityNow}`,
        `- Why not others: ${target.targetRead.whyNotOthers}`,
        `- Strength: ${target.targetRead.strength}`,
        `- Limitation: ${target.targetRead.limitation}`,
        `- Next step: ${target.targetRead.actionDirective}`,
        `- Evidence posture: ${target.evidencePosture.detail}`
      ]),
      "",
      "## Gaps And Caveats",
      ...briefing.coverageGaps.map((gap) => `- ${gap.label}: ${gap.detail}`),
      "",
      "_Derived read: current-record analysis, not a direct source quote._"
    ].join("\n");

    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${useCaseSlug}-briefing.md"`
      }
    });
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
