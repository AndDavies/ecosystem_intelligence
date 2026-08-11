import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ResearchQueueCandidate, ResearchQueueRun } from "@/lib/atlas/research-run-queue";

type AtlasDatabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function loadResearchQueueMetadata(database: AtlasDatabaseClient, status: "pending" | "approved") {
  const rows: ResearchQueueCandidate[] = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await database
      .from("candidate_changes")
      .select("id, research_run_id, candidate_kind, schema_version, duplicate_check, reviewer_rationale, created_at")
      .eq("status", status)
      .order("created_at")
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(`Unable to load the ${status} research queue.`);
    const page = (data ?? []) as ResearchQueueCandidate[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  const runIds = [...new Set(rows.flatMap((row) => row.research_run_id ? [row.research_run_id] : []))];
  const runs: ResearchQueueRun[] = [];
  for (let offset = 0; offset < runIds.length; offset += 100) {
    const { data, error } = await database
      .from("research_runs")
      .select("id, run_type, scope, status, completed_at, resume_token")
      .in("id", runIds.slice(offset, offset + 100));
    if (error) throw new Error("Unable to load research-run queue lineage.");
    runs.push(...((data ?? []) as ResearchQueueRun[]));
  }
  return { candidates: rows, runs };
}
