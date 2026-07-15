import { createClient } from "@supabase/supabase-js";
import { loadScriptEnv } from "./load-env";
import { loadSeedData } from "./seed-utils";

loadScriptEnv();

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase credentials are required for seed import.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

async function upsertTable(
  client: ReturnType<typeof getAdminClient>,
  table: string,
  rows: Record<string, unknown>[]
) {
  if (!rows.length) {
    return;
  }

  const { error } = await client.from(table).upsert(rows, {
    onConflict: "id"
  });

  if (error) {
    throw error;
  }
}

async function main() {
  const data = await loadSeedData();
  const client = getAdminClient();

  await upsertTable(client, "domains", data.domains);
  await upsertTable(client, "use_cases", data.useCases);
  await upsertTable(client, "clusters", data.clusters);
  await upsertTable(client, "companies", data.companies);
  await upsertTable(client, "contacts", data.contacts);
  await upsertTable(client, "capabilities", data.capabilities);
  await upsertTable(client, "capability_use_cases", data.capabilityUseCases);
  await upsertTable(client, "signals", data.signals);
  await upsertTable(client, "sources", data.sources);
  await upsertTable(client, "evidence_snippets", data.evidenceSnippets);
  await upsertTable(client, "field_citations", data.fieldCitations);
  await upsertTable(client, "use_case_observations", data.observations);

  console.log("Seed data imported successfully.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
