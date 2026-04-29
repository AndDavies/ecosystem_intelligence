import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadScriptEnv } from "./load-env";
import { loadSeedData, type SeedRow } from "./seed-utils";

loadScriptEnv();

const minimums = {
  companies: 10,
  capabilities: 12,
  topTargets: 3
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidated(record: SeedRow) {
  return record.data_stage === "validated" && ["high", "moderate"].includes(asString(record.source_confidence));
}

function isScaffold(record: SeedRow) {
  return record.data_stage === "scaffold" || /^company-\d+$|^capability-\d+$|^cuc-\d+$/.test(asString(record.id));
}

function hasExampleUrl(record: SeedRow) {
  return asString(record.website_url).includes("example.com");
}

function formatTable(headers: string[], rows: string[][]) {
  const escapeCell = (value: string) => value.replace(/\|/g, "\\|").replace(/\n/g, " ");
  return [
    `| ${headers.map(escapeCell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escapeCell).join(" | ")} |`)
  ].join("\n");
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getCitationSet(data: Awaited<ReturnType<typeof loadSeedData>>) {
  return new Set(
    data.fieldCitations.map((citation) => `${citation.entity_type}:${citation.entity_id}:${citation.field_name}`)
  );
}

async function buildReport() {
  const data = await loadSeedData();
  const citationSet = getCitationSet(data);
  const companyById = new Map(data.companies.map((company) => [company.id, company]));
  const capabilityById = new Map(data.capabilities.map((capability) => [capability.id, capability]));
  const activeUseCases = data.useCases.filter((useCase) => Boolean(useCase.active));

  const missionRows = activeUseCases.map((useCase) => {
    const mappings = data.capabilityUseCases.filter((mapping) => mapping.use_case_id === useCase.id);
    const capabilities = [...new Set(mappings.map((mapping) => mapping.capability_id))]
      .map((capabilityId) => capabilityById.get(capabilityId))
      .filter((capability): capability is SeedRow => Boolean(capability));
    const companies = [...new Set(capabilities.map((capability) => capability.company_id))]
      .map((companyId) => companyById.get(companyId))
      .filter((company): company is SeedRow => Boolean(company));
    const validatedCompanies = companies.filter((company) => isValidated(company) && !hasExampleUrl(company));
    const validatedCapabilities = capabilities.filter(isValidated);
    const validatedMappings = mappings.filter(isValidated);
    const citedValidatedMappings = validatedMappings.filter((mapping) =>
      citationSet.has(`capability_use_case:${mapping.id}:why_it_matters`)
    );
    const topTargets = validatedMappings.filter(
      (mapping) =>
        mapping.relevance_band === "high" &&
        ["high", "medium"].includes(asString(mapping.defence_relevance)) &&
        Number(mapping.evidence_strength) >= 3
    );
    const scaffoldCompanies = companies.filter((company) => isScaffold(company) || hasExampleUrl(company));
    const scaffoldCapabilities = capabilities.filter(isScaffold);
    const readiness =
      validatedCompanies.length >= minimums.companies &&
      validatedCapabilities.length >= minimums.capabilities &&
      topTargets.length >= minimums.topTargets
        ? "batch-ready"
        : validatedCompanies.length || validatedCapabilities.length
          ? "partial"
          : "scaffold-heavy";

    return {
      useCase,
      readiness,
      companies: companies.length,
      validatedCompanies: validatedCompanies.length,
      scaffoldCompanies: scaffoldCompanies.length,
      capabilities: capabilities.length,
      validatedCapabilities: validatedCapabilities.length,
      scaffoldCapabilities: scaffoldCapabilities.length,
      mappings: mappings.length,
      validatedMappings: validatedMappings.length,
      citedValidatedMappings: citedValidatedMappings.length,
      topTargets: topTargets.length
    };
  });

  const scaffoldCompanies = data.companies.filter((company) => isScaffold(company) || hasExampleUrl(company));
  const scaffoldCapabilities = data.capabilities.filter(isScaffold);
  const scaffoldMappings = data.capabilityUseCases.filter(isScaffold);
  const validatedCompanies = data.companies.filter((company) => isValidated(company) && !hasExampleUrl(company));
  const validatedCapabilities = data.capabilities.filter(isValidated);
  const validatedMappings = data.capabilityUseCases.filter(isValidated);
  const today = new Date().toISOString().slice(0, 10);

  const lines: string[] = [];
  lines.push(`# Data Readiness Report - ${today}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Active Mission Areas: ${activeUseCases.length}`);
  lines.push(`- Validated companies: ${validatedCompanies.length}/${data.companies.length}`);
  lines.push(`- Validated capabilities: ${validatedCapabilities.length}/${data.capabilities.length}`);
  lines.push(`- Validated mappings: ${validatedMappings.length}/${data.capabilityUseCases.length}`);
  lines.push(`- Scaffold companies to replace: ${scaffoldCompanies.length}`);
  lines.push(`- Scaffold capabilities to replace: ${scaffoldCapabilities.length}`);
  lines.push(`- Scaffold mappings to replace: ${scaffoldMappings.length}`);
  lines.push("");
  lines.push("## Mission Area Readiness");
  lines.push("");
  lines.push(
    formatTable(
      [
        "Mission Area",
        "Status",
        "Validated Companies",
        "Validated Capabilities",
        "Top Targets",
        "Scaffold Debt",
        "Next Batch"
      ],
      missionRows.map((row) => [
        asString(row.useCase.name),
        row.readiness,
        `${row.validatedCompanies}/${minimums.companies}`,
        `${row.validatedCapabilities}/${minimums.capabilities}`,
        `${row.topTargets}/${minimums.topTargets}`,
        `${row.scaffoldCompanies} companies / ${row.scaffoldCapabilities} capabilities`,
        row.readiness === "batch-ready" ? "refresh and broaden" : "source leads then candidate batch"
      ])
    )
  );
  lines.push("");
  lines.push("## Recommended Batch Order");
  lines.push("");
  missionRows
    .sort((left, right) => {
      const leftScore = left.validatedCompanies + left.validatedCapabilities + left.topTargets;
      const rightScore = right.validatedCompanies + right.validatedCapabilities + right.topTargets;
      return rightScore - leftScore || asString(left.useCase.name).localeCompare(asString(right.useCase.name));
    })
    .forEach((row, index) => {
      lines.push(
        `${index + 1}. ${row.useCase.name}: ${row.readiness}; ${pluralize(row.validatedCompanies, "validated company", "validated companies")}, ${pluralize(row.validatedCapabilities, "validated capability", "validated capabilities")}, ${pluralize(row.topTargets, "validated top-target mapping", "validated top-target mappings")}.`
      );
    });
  lines.push("");
  lines.push("## Operational Rule");
  lines.push("");
  lines.push(
    "Run source-lead batches before candidate batches. Candidate batches should replace scaffold records only after lead review confirms real organizations, concrete capabilities, canonical public URLs, and field-level citations."
  );

  return {
    report: `${lines.join("\n")}\n`,
    missionRows
  };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const { report, missionRows } = await buildReport();

  console.log(report);

  if (args.has("--write")) {
    const reportsDir = path.join(process.cwd(), "data", "ingestion", "reports");
    const reportPath = path.join(reportsDir, `data-readiness-${new Date().toISOString().slice(0, 10)}.md`);
    await mkdir(reportsDir, { recursive: true });
    await writeFile(reportPath, report, "utf8");
    console.log(`Wrote ${path.relative(process.cwd(), reportPath)}`);
  }

  if (args.has("--strict") && missionRows.some((row) => row.readiness !== "batch-ready")) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
