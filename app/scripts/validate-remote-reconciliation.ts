import { createClient } from "@supabase/supabase-js";
import { loadScriptEnv } from "./load-env";
import { loadSeedData, type SeedRow } from "./seed-utils";

loadScriptEnv();

const requiredUseCaseColumns = [
  "id",
  "slug",
  "name",
  "summary",
  "active",
  "domain_ids",
  "priority_tier",
  "use_case_kind",
  "partner_frames",
  "policy_anchors",
  "operational_owner",
  "mission_context",
  "required_decision",
  "interoperability_boundary",
  "mission_outcome",
  "procurement_pathway",
  "realism_note"
];

const reconciledTables: Array<{ table: string; localRows: SeedRow[] }> = [];

type RemoteUseCaseRow = Record<string, unknown> & {
  id: string;
  active: boolean;
};

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase service role credentials are required for remote reconciliation validation.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

function getIdSet(rows: SeedRow[]) {
  return new Set(rows.map((row) => String(row.id)));
}

function stringifyList(values: string[]) {
  return values.length ? values.join(", ") : "none";
}

async function main() {
  const seed = await loadSeedData();
  const client = createAdminClient();

  reconciledTables.push(
    { table: "use_cases", localRows: seed.useCases },
    { table: "capability_use_cases", localRows: seed.capabilityUseCases },
    { table: "sources", localRows: seed.sources },
    { table: "evidence_snippets", localRows: seed.evidenceSnippets },
    { table: "field_citations", localRows: seed.fieldCitations },
    { table: "use_case_observations", localRows: seed.observations }
  );

  const { data: useCases, error: useCaseError } = await client
    .from("use_cases")
    .select(requiredUseCaseColumns.join(", "))
    .order("id");

  if (useCaseError) {
    throw new Error(`use_cases realism schema is not reconciled: ${useCaseError.message}`);
  }

  const remoteUseCaseRows = ((useCases ?? []) as unknown[]) as RemoteUseCaseRow[];
  const remoteUseCaseIds = new Set(remoteUseCaseRows.map((row) => String(row.id)));
  const activeSeedUseCases = seed.useCases.filter((row) => Boolean(row.active));
  const activeRemoteUseCases = remoteUseCaseRows.filter((row) => Boolean(row.active));

  assert(
    activeRemoteUseCases.length === activeSeedUseCases.length,
    `Remote active use-case count is ${activeRemoteUseCases.length}; expected ${activeSeedUseCases.length}.`
  );

  activeSeedUseCases.forEach((useCase) => {
    assert(remoteUseCaseIds.has(String(useCase.id)), `Remote database is missing active use case ${useCase.id}.`);
  });

  activeRemoteUseCases.forEach((useCase) => {
    requiredUseCaseColumns
      .filter((column) => !["active", "created_at"].includes(column))
      .forEach((column) => {
        const value = useCase[column as keyof typeof useCase];
        const isEmptyArray = Array.isArray(value) && value.length === 0;
        assert(value !== null && value !== undefined && value !== "" && !isEmptyArray, `Use case ${useCase.id} needs ${column}.`);
      });
  });

  for (const { table, localRows } of reconciledTables) {
    const { data, error } = await client.from(table).select("id");

    if (error) {
      throw new Error(`${table} reconciliation check failed: ${error.message}`);
    }

    const localIds = getIdSet(localRows);
    const remoteIds = new Set((data ?? []).map((row) => String(row.id)));
    const missing = [...localIds].filter((id) => !remoteIds.has(id)).sort();

    assert(
      missing.length === 0,
      `${table} is missing ${missing.length} canonical seed rows: ${stringifyList(missing)}`
    );

    console.log(`${table}: remote has all ${localIds.size} canonical rows.`);
  }

  console.log("Remote database reconciliation validated successfully.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
