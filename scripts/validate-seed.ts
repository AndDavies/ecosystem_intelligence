import { loadScriptEnv } from "./load-env";
import { loadSeedData } from "./seed-utils";

loadScriptEnv();

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
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
    const domainRefs = asArray(useCase["domain_ids"]);
    domainRefs.forEach((domainId) =>
      assert(domainIds.has(String(domainId)), `Use case ${useCase.id} references missing domain ${domainId}`)
    );

    if (useCase.active) {
      assert(["p1", "p2", "p3"].includes(String(useCase["priority_tier"])), `Use case ${useCase.id} has invalid priority tier`);
      assert(
        ["mission", "enabling"].includes(String(useCase["use_case_kind"])),
        `Use case ${useCase.id} has invalid kind`
      );
      assert(asArray(useCase["partner_frames"]).length > 0, `Use case ${useCase.id} needs partner frames`);
      assert(asArray(useCase["policy_anchors"]).length > 0, `Use case ${useCase.id} needs policy anchors`);
      assert(String(useCase["operational_owner"] ?? "").length > 0, `Use case ${useCase.id} needs an owner`);
      assert(String(useCase["mission_context"] ?? "").length > 0, `Use case ${useCase.id} needs mission context`);
      assert(String(useCase["required_decision"] ?? "").length > 0, `Use case ${useCase.id} needs a required decision`);
      assert(String(useCase["mission_outcome"] ?? "").length > 0, `Use case ${useCase.id} needs a mission outcome`);
      assert(
        String(useCase["procurement_pathway"] ?? "").length > 0,
        `Use case ${useCase.id} needs a procurement pathway`
      );
    }
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

  data.fieldCitations.forEach((citation) => {
    assert(
      snippetIds.has(String(citation["evidence_snippet_id"])),
      `Citation ${citation.id} references missing evidence snippet ${citation["evidence_snippet_id"]}`
    );

    const entityType = String(citation["entity_type"]);
    const entityId = String(citation["entity_id"]);
    if (entityType === "use_case") {
      assert(useCaseIds.has(entityId), `Citation ${citation.id} references missing use case ${entityId}`);
    } else if (entityType === "capability") {
      assert(capabilityIds.has(entityId), `Citation ${citation.id} references missing capability ${entityId}`);
    } else if (entityType === "company") {
      assert(companyIds.has(entityId), `Citation ${citation.id} references missing company ${entityId}`);
    } else if (entityType === "capability_use_case") {
      assert(
        data.capabilityUseCases.some((mapping) => String(mapping.id) === entityId),
        `Citation ${citation.id} references missing mapping ${entityId}`
      );
    } else if (entityType === "use_case_observation") {
      assert(
        data.observations.some((observation) => String(observation.id) === entityId),
        `Citation ${citation.id} references missing observation ${entityId}`
      );
    }
  });

  data.useCases
    .filter((useCase) => Boolean(useCase.active))
    .forEach((useCase) => {
      assert(
        data.fieldCitations.some(
          (citation) =>
            citation["entity_type"] === "use_case" &&
            citation["entity_id"] === useCase.id &&
            citation["field_name"] === "policy_anchors"
        ),
        `Use case ${useCase.id} needs a policy anchor citation`
      );
    });

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
