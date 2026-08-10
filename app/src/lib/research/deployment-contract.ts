import { currentResearchPipelineVersion } from "@/lib/research/pipeline-schema";

export const researchReviewContractVersion = "tnm-review-publication-v3" as const;

export const supportedResearchCandidateSchemas = {
  organization_bundle: ["organization_bundle_v1", "organization_bundle_v2", "organization_bundle_v3"],
  demand_signal_bundle: ["demand_signal_bundle_v1"],
  organization_refresh_bundle: ["organization_refresh_bundle_v1", "organization_refresh_bundle_v2"],
  demand_refresh_bundle: ["demand_refresh_bundle_v1"]
} as const;

export type SupportedResearchCandidateKind = keyof typeof supportedResearchCandidateSchemas;

export type ResearchCandidateContractInput = {
  candidate_kind?: unknown;
  schema_version?: unknown;
};

export type ResearchReviewContract = {
  contractVersion: typeof researchReviewContractVersion;
  pipelineVersion: string;
  candidateSchemas: Record<SupportedResearchCandidateKind, readonly string[]>;
};

export const researchReviewContract: ResearchReviewContract = {
  contractVersion: researchReviewContractVersion,
  pipelineVersion: currentResearchPipelineVersion,
  candidateSchemas: supportedResearchCandidateSchemas
};

function pipelineVersionAtLeast(deployed: string, required: string) {
  const parse = (value: string) => value.match(/^tnm-research-pipeline\/(\d+)\.(\d+)\.(\d+)$/)?.slice(1).map(Number) ?? null;
  const deployedParts = parse(deployed);
  const requiredParts = parse(required);
  if (!deployedParts || !requiredParts) return false;
  for (let index = 0; index < requiredParts.length; index += 1) {
    if (deployedParts[index] > requiredParts[index]) return true;
    if (deployedParts[index] < requiredParts[index]) return false;
  }
  return true;
}

export function isSupportedResearchCandidateKind(value: string): value is SupportedResearchCandidateKind {
  return Object.prototype.hasOwnProperty.call(supportedResearchCandidateSchemas, value);
}

export function researchCandidateContractIssues(
  candidates: ResearchCandidateContractInput[],
  contract: Pick<ResearchReviewContract, "contractVersion" | "pipelineVersion" | "candidateSchemas"> = researchReviewContract,
  requiredPipelineVersion: string = currentResearchPipelineVersion
) {
  const issues: string[] = [];
  if (contract.contractVersion !== researchReviewContractVersion) {
    issues.push(`deployed review contract '${contract.contractVersion}' does not match required '${researchReviewContractVersion}'`);
  }
  if (!pipelineVersionAtLeast(contract.pipelineVersion, requiredPipelineVersion)) {
    issues.push(`deployed research pipeline '${contract.pipelineVersion || "missing"}' is older than required '${requiredPipelineVersion}'`);
  }

  candidates.forEach((candidate, index) => {
    const kind = typeof candidate.candidate_kind === "string" ? candidate.candidate_kind : "";
    const schema = typeof candidate.schema_version === "string" ? candidate.schema_version : "";
    if (!isSupportedResearchCandidateKind(kind)) {
      issues.push(`candidate ${index + 1} uses unsupported kind '${kind || "missing"}'`);
      return;
    }
    const deployedSchemas = contract.candidateSchemas[kind] ?? [];
    if (!schema || !(deployedSchemas as readonly string[]).includes(schema)) {
      issues.push(`candidate ${index + 1} uses unsupported schema '${schema || "missing"}' for '${kind}'`);
    }
  });

  return issues;
}

export async function assertDeployedResearchReviewContract(
  candidates: ResearchCandidateContractInput[],
  options: { baseUrl?: string; fetchImpl?: typeof fetch; timeoutMs?: number; requiredPipelineVersion?: string } = {}
) {
  const baseUrl = (options.baseUrl ?? "https://truenorthmap.ca").replace(/\/$/, "");
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 8000);

  try {
    const response = await fetchImpl(`${baseUrl}/api/system/research-contract`, {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`deployed review contract returned HTTP ${response.status}`);
    }
    const contract = await response.json() as ResearchReviewContract;
    const issues = researchCandidateContractIssues(candidates, contract, options.requiredPipelineVersion ?? currentResearchPipelineVersion);
    if (issues.length) throw new Error(issues.join("; "));
    return contract;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Research intake stopped before database staging because the deployed Admin Review and Publication contract is not compatible: ${detail}`);
  } finally {
    clearTimeout(timeout);
  }
}
