import { loadScriptEnv } from "./load-env";
import { loadSeedData } from "./seed-utils";

loadScriptEnv();

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const data = await loadSeedData();

  const domainIds = new Set(data.domains.map((item) => String(item.id)));
  const useCaseIds = new Set(data.useCases.map((item) => String(item.id)));
  const clusterIds = new Set(data.clusters.map((item) => String(item.id)));
  const companyIds = new Set(data.companies.map((item) => String(item.id)));
  const capabilityIds = new Set(data.capabilities.map((item) => String(item.id)));
  const sourceIds = new Set(data.sources.map((item) => String(item.id)));
  const snippetIds = new Set(data.evidenceSnippets.map((item) => String(item.id)));

  data.useCases.forEach((useCase) => {
    const domainRefs = (useCase["domain_ids"] as string[]) ?? [];
    domainRefs.forEach((domainId) =>
      assert(domainIds.has(domainId), `Use case ${useCase.id} references missing domain ${domainId}`)
    );
  });

  data.clusters.forEach((cluster) =>
    assert(
      domainIds.has(String(cluster["domain_id"])),
      `Cluster ${cluster.id} references missing domain ${cluster["domain_id"]}`
    )
  );

  data.contacts.forEach((contact) =>
    assert(
      companyIds.has(String(contact["company_id"])),
      `Contact ${contact.id} references missing company ${contact["company_id"]}`
    )
  );

  data.capabilities.forEach((capability) =>
    assert(
      companyIds.has(String(capability["company_id"])),
      `Capability ${capability.id} references missing company ${capability["company_id"]}`
    )
  );

  data.capabilityUseCases.forEach((mapping) => {
    assert(
      capabilityIds.has(String(mapping["capability_id"])),
      `Mapping ${mapping.id} references missing capability ${mapping["capability_id"]}`
    );
    assert(
      useCaseIds.has(String(mapping["use_case_id"])),
      `Mapping ${mapping.id} references missing use case ${mapping["use_case_id"]}`
    );
    assert(
      clusterIds.has(String(mapping["cluster_id"])),
      `Mapping ${mapping.id} references missing cluster ${mapping["cluster_id"]}`
    );
  });

  data.signals.forEach((signal) =>
    assert(
      capabilityIds.has(String(signal["capability_id"])),
      `Signal ${signal.id} references missing capability ${signal["capability_id"]}`
    )
  );

  data.evidenceSnippets.forEach((snippet) => {
    assert(
      sourceIds.has(String(snippet["source_id"])),
      `Evidence snippet ${snippet.id} references missing source ${snippet["source_id"]}`
    );
    if (snippet["capability_id"]) {
      assert(
        capabilityIds.has(String(snippet["capability_id"])),
        `Evidence snippet ${snippet.id} references missing capability ${snippet["capability_id"]}`
      );
    }
  });

  data.fieldCitations.forEach((citation) =>
    assert(
      snippetIds.has(String(citation["evidence_snippet_id"])),
      `Citation ${citation.id} references missing evidence snippet ${citation["evidence_snippet_id"]}`
    )
  );

  data.observations.forEach((observation) =>
    assert(
      useCaseIds.has(String(observation["use_case_id"])),
      `Observation ${observation.id} references missing use case ${observation["use_case_id"]}`
    )
  );

  console.log("Seed data validated successfully.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
