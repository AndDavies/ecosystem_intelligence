import { normalizeOrganizationIdentity } from "./identity-normalization";

export type LinkabilityOrganization = {
  id: string;
  slug: string;
  name: string;
  legalName?: string | null;
  websiteUrl?: string | null;
  updatedAt?: string | null;
  aliases: string[];
};

export type LinkabilityProgram = {
  id: string;
  slug: string;
  name: string;
  programType: string;
  operatorName: string | null;
  websiteUrl: string | null;
  summary: string | null;
};

export type LinkabilityCatalog = {
  organizations: LinkabilityOrganization[];
  programs: LinkabilityProgram[];
  redirectSourceOrganizationIds?: string[];
};

export type CandidateLinkabilityAssessment = {
  errors: string[];
  warnings: string[];
};

type RelationshipReference = {
  name: string;
  slug: string | null;
  relationshipType: string;
};

type ProgramReference = {
  slug: string;
  name: string;
  programType: string;
  operatorName: string | null;
  websiteUrl: string | null;
  summary: string | null;
  participationType: string | null;
  cohortLabel: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export function normalizeLinkabilityIdentity(value: string) {
  return normalizeOrganizationIdentity(value);
}

function normalizedWebsite(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith("utm_")) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return value.trim().toLocaleLowerCase("en-CA");
  }
}

function markdownCode(value: string) {
  return `\`${value.replace(/`/g, "'")}\``;
}

function candidateSelfSlug(candidate: unknown) {
  const record = asRecord(candidate);
  if (record.candidateKind === "organization_bundle") return asString(asRecord(record.organization).slug);
  if (record.candidateKind === "organization_refresh_bundle" || record.candidateKind === "organization_canonical_repair_bundle") {
    return asString(asRecord(record.targetMatch).slug);
  }
  return null;
}

function canonicalRepairSuccessors(candidate: unknown) {
  const record = asRecord(candidate);
  if (record.candidateKind !== "organization_canonical_repair_bundle") return [];
  return asArray(record.operations).flatMap((value) => {
    const operation = asRecord(value);
    const successor = asRecord(operation.successor);
    const id = asString(successor.id);
    const slug = asString(successor.slug);
    const name = asString(successor.name);
    const baselineUpdatedAt = asString(successor.baselineUpdatedAt);
    return operation.operation === "archive_organization" && id && slug && name && baselineUpdatedAt
      ? [{ id, slug, name, baselineUpdatedAt }]
      : [];
  });
}

function canonicalRepairIdentityValues(candidate: unknown) {
  const record = asRecord(candidate);
  if (record.candidateKind !== "organization_canonical_repair_bundle") return [];
  const operations = asArray(record.operations).map(asRecord);
  const archivedAliasIds = new Set(operations.flatMap((operation) => {
    const aliasId = asString(operation.aliasId);
    return operation.operation === "archive_alias" && aliasId ? [aliasId] : [];
  }));
  const beforeRecord = asRecord(record.beforeRecord);
  const organization = asRecord(beforeRecord.organization);
  const identityOperation = operations.find((operation) => operation.operation === "set_organization_identity");
  const after = asRecord(identityOperation?.after);
  const retainedAliases = asArray(beforeRecord.activeAliases).flatMap((value) => {
    const alias = asRecord(value);
    const id = asString(alias.id);
    const name = asString(alias.alias);
    return id && name && !archivedAliasIds.has(id) ? [name] : [];
  });
  const operationValues = operations.flatMap((operation) => {
    if (operation.operation === "set_organization_identity") {
      const formerName = asString(operation.formerNameAlias);
      return formerName ? [formerName] : [];
    }
    if (operation.operation === "add_alias") {
      const alias = asString(operation.alias);
      return alias ? [alias] : [];
    }
    return [];
  });
  return [
    identityOperation ? asString(after.name) : asString(organization.name),
    identityOperation ? asString(after.legalName) : asString(organization.legalName),
    ...retainedAliases,
    ...operationValues
  ].filter((item): item is string => Boolean(item));
}

function canonicalRepairWebsite(candidate: unknown) {
  const record = asRecord(candidate);
  if (record.candidateKind !== "organization_canonical_repair_bundle") return null;
  const beforeOrganization = asRecord(asRecord(record.beforeRecord).organization);
  const identityOperation = asArray(record.operations)
    .map(asRecord)
    .find((operation) => operation.operation === "set_organization_identity");
  const value = identityOperation
    ? asRecord(identityOperation.after).websiteUrl
    : beforeOrganization.websiteUrl;
  return value === null ? null : asString(value);
}

function normalizedWebsiteDomain(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function relationshipReferences(candidate: unknown): RelationshipReference[] {
  const record = asRecord(candidate);
  const references: RelationshipReference[] = [];
  if (record.candidateKind === "organization_bundle") {
    for (const value of asArray(record.relationships)) {
      const relationship = asRecord(value);
      const name = asString(relationship.relatedOrganizationName);
      const relationshipType = asString(relationship.relationshipType);
      if (name && relationshipType) {
        references.push({
          name,
          slug: asString(relationship.relatedOrganizationSlug),
          relationshipType
        });
      }
    }
  }
  if (record.candidateKind === "organization_refresh_bundle") {
    for (const value of asArray(record.operations)) {
      const operation = asRecord(value);
      if (operation.entityType !== "organization_relationship") continue;
      const relationship = asRecord(operation.operation === "add_child" ? operation.value : operation.after);
      const name = asString(relationship.relatedOrganizationName);
      const relationshipType = asString(relationship.relationshipType);
      if (name && relationshipType) {
        references.push({
          name,
          slug: asString(relationship.relatedOrganizationSlug),
          relationshipType
        });
      }
    }
  }
  return references;
}

function programReference(value: unknown): ProgramReference | null {
  const record = asRecord(value);
  const program = Object.keys(asRecord(record.program)).length ? asRecord(record.program) : record;
  const participation = asRecord(record.participation);
  const slug = asString(program.slug);
  const name = asString(program.name);
  const programType = asString(program.programType);
  if (!slug || !name || !programType) return null;
  return {
    slug,
    name,
    programType,
    operatorName: asString(program.operatorName),
    websiteUrl: asString(program.websiteUrl),
    summary: asString(program.summary),
    participationType: asString(participation.participationType),
    cohortLabel: asString(participation.cohortLabel) ?? asString(record.cohortLabel)
  };
}

function programReferences(candidate: unknown): ProgramReference[] {
  const record = asRecord(candidate);
  const references: ProgramReference[] = [];
  if (record.candidateKind === "organization_bundle") {
    const values = record.schemaVersion === "organization_bundle_v3"
      ? asArray(record.programParticipations)
      : asArray(record.programs);
    for (const value of values) {
      const reference = programReference(value);
      if (reference) references.push(reference);
    }
  }
  if (record.candidateKind === "organization_refresh_bundle") {
    for (const value of asArray(record.operations)) {
      const operation = asRecord(value);
      if (operation.operation !== "add_child" || operation.entityType !== "program_participation") continue;
      const reference = programReference(operation.value);
      if (reference) references.push(reference);
    }
  }
  return references;
}

export type OrganizationResolution =
  | { status: "canonical_exact" | "exact_alias_suggestion"; organization: LinkabilityOrganization; matchedAlias?: string }
  | { status: "ambiguous"; organizations: LinkabilityOrganization[] }
  | { status: "slug_name_mismatch"; organization: LinkabilityOrganization }
  | { status: "slug_not_found"; slug: string }
  | { status: "self_reference"; organization: LinkabilityOrganization; slug: string }
  | { status: "unresolved" };

export function resolveLinkabilityOrganization(
  reference: { name: string; slug?: string | null },
  organizations: LinkabilityOrganization[],
  selfSlug?: string | null
): OrganizationResolution {
  const normalizedName = normalizeLinkabilityIdentity(reference.name);
  const bySlug = reference.slug ? organizations.find((organization) => organization.slug === reference.slug) : undefined;
  if (reference.slug && reference.slug === selfSlug) {
    return {
      status: "self_reference",
      organization: bySlug ?? { id: `candidate:${reference.slug}`, slug: reference.slug, name: reference.name, aliases: [] },
      slug: reference.slug
    };
  }
  if (bySlug) {
    const exactNames = [bySlug.name, ...bySlug.aliases].map(normalizeLinkabilityIdentity);
    if (!exactNames.includes(normalizedName)) return { status: "slug_name_mismatch", organization: bySlug };
    const matchedAlias = bySlug.aliases.find((alias) => normalizeLinkabilityIdentity(alias) === normalizedName);
    return matchedAlias
      ? { status: "exact_alias_suggestion", organization: bySlug, matchedAlias }
      : { status: "canonical_exact", organization: bySlug };
  }
  if (reference.slug) return { status: "slug_not_found", slug: reference.slug };

  const matches = organizations.filter((organization) => [organization.name, ...organization.aliases]
    .some((value) => normalizeLinkabilityIdentity(value) === normalizedName));
  if (matches.length > 1) return { status: "ambiguous", organizations: matches.sort((left, right) => left.slug.localeCompare(right.slug)) };
  if (matches.length === 0) return { status: "unresolved" };
  const organization = matches[0];
  if (organization.slug === selfSlug) return { status: "self_reference", organization, slug: organization.slug };
  const matchedAlias = organization.aliases.find((alias) => normalizeLinkabilityIdentity(alias) === normalizedName);
  return matchedAlias
    ? { status: "exact_alias_suggestion", organization, matchedAlias }
    : { status: "canonical_exact", organization };
}

export function classifyProgramParticipationRole(value: string | null) {
  const normalized = normalizeLinkabilityIdentity(value ?? "");
  if (!normalized) return "ambiguous" as const;
  if (/\b(operator|program operator|host|administrator|program lead)\b/.test(normalized)) return "operator" as const;
  if (/\b(accelerator|incubator)\b/.test(normalized)) return "accelerator" as const;
  if (/\b(cohort company|cohort member|selected company)\b/.test(normalized)) return "cohort_company" as const;
  if (/\b(participant|participating company|member|awardee|recipient)\b/.test(normalized)) return "participant" as const;
  if (/\b(funder|funding partner|sponsor)\b/.test(normalized)) return "funder" as const;
  return "other" as const;
}

type ProgramResolution =
  | { status: "canonical_exact"; program: LinkabilityProgram }
  | { status: "canonical_conflict"; program: LinkabilityProgram; differingFields: string[] }
  | { status: "possible_duplicate"; programs: LinkabilityProgram[] }
  | { status: "new_unique" };

export function resolveLinkabilityProgram(reference: ProgramReference, programs: LinkabilityProgram[]): ProgramResolution {
  const canonical = programs.find((program) => program.slug === reference.slug);
  if (canonical) {
    const differingFields = ([
      ["name", reference.name, canonical.name],
      ["programType", reference.programType, canonical.programType],
      ["operatorName", reference.operatorName, canonical.operatorName],
      ["websiteUrl", reference.websiteUrl, canonical.websiteUrl],
      ["summary", reference.summary, canonical.summary]
    ] as const).filter(([, proposed, published]) => proposed !== published).map(([field]) => field);
    return differingFields.length
      ? { status: "canonical_conflict", program: canonical, differingFields }
      : { status: "canonical_exact", program: canonical };
  }
  const normalizedName = normalizeLinkabilityIdentity(reference.name);
  const website = normalizedWebsite(reference.websiteUrl);
  const possible = programs.filter((program) => normalizeLinkabilityIdentity(program.name) === normalizedName
    || Boolean(website && website === normalizedWebsite(program.websiteUrl)));
  return possible.length
    ? { status: "possible_duplicate", programs: possible.sort((left, right) => left.slug.localeCompare(right.slug)) }
    : { status: "new_unique" };
}

export function assessCandidateLinkability(candidate: unknown, catalog: LinkabilityCatalog): CandidateLinkabilityAssessment {
  const record = asRecord(candidate);
  const candidateId = asString(record.candidateId) ?? "unknown-candidate";
  const selfSlug = candidateSelfSlug(candidate);
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const reference of relationshipReferences(candidate)) {
    const resolution = resolveLinkabilityOrganization(reference, catalog.organizations, selfSlug);
    const label = `Candidate ${candidateId} relationship '${reference.name}'`;
    if (resolution.status === "self_reference") {
      errors.push(`${label} resolves to the candidate itself (${resolution.slug}).`);
      continue;
    }
    if (reference.slug) {
      if (resolution.status === "slug_not_found") {
        errors.push(`${label} supplies related organization slug '${resolution.slug}', but that slug is missing or unpublished.`);
      } else if (resolution.status === "slug_name_mismatch") {
        errors.push(`${label} supplies slug '${resolution.organization.slug}', but its name is neither the published canonical name nor a published alias of ${resolution.organization.name}.`);
      } else if (resolution.status === "ambiguous" || resolution.status === "unresolved") {
        errors.push(`${label} supplies slug '${reference.slug}', but the published target could not be resolved exactly.`);
      }
      continue;
    }

    if (resolution.status === "canonical_exact") {
      warnings.push(`${label} has no slug but exactly matches published organization '${resolution.organization.slug}'; keep this as a review suggestion until the canonical slug is explicitly added.`);
    } else if (resolution.status === "exact_alias_suggestion") {
      warnings.push(`${label} has no slug but exactly matches published alias '${resolution.matchedAlias ?? reference.name}' for '${resolution.organization.slug}'; keep this as a review suggestion until confirmed.`);
    } else if (resolution.status === "ambiguous") {
      warnings.push(`${label} has no slug and matches multiple published organizations (${resolution.organizations.map((organization) => organization.slug).join(", ")}); keep it unresolved.`);
    } else if (resolution.status === "unresolved") {
      warnings.push(`${label} has no exact published canonical-name or alias match; keep it unresolved.`);
    }
  }

  for (const successor of canonicalRepairSuccessors(candidate)) {
    const published = catalog.organizations.find((organization) => organization.slug === successor.slug);
    const label = `Candidate ${candidateId} successor '${successor.slug}'`;
    if (!published) {
      errors.push(`${label} is missing or unpublished.`);
    } else if (published.id !== successor.id || published.name !== successor.name) {
      errors.push(`${label} does not exactly match the published successor ID, slug, and name.`);
    } else if (published.updatedAt !== successor.baselineUpdatedAt) {
      errors.push(`${label} changed after the exact successor snapshot was recorded.`);
    } else if ((catalog.redirectSourceOrganizationIds ?? []).includes(successor.id)) {
      errors.push(`${label} is already the source of a successor redirect; canonical repair cannot create a redirect chain.`);
    } else if (successor.slug === selfSlug) {
      errors.push(`${label} resolves to the repair target itself.`);
    }
  }

  if (record.candidateKind === "organization_canonical_repair_bundle") {
    for (const proposedValue of canonicalRepairIdentityValues(candidate)) {
      const normalized = normalizeOrganizationIdentity(proposedValue);
      const collisions = catalog.organizations.filter((organization) => organization.slug !== selfSlug
        && [organization.name, organization.legalName, ...organization.aliases]
          .filter((value): value is string => Boolean(value))
          .some((value) => normalizeOrganizationIdentity(value) === normalized));
      if (collisions.length > 0) {
        errors.push(`Candidate ${candidateId} proposed identity '${proposedValue}' collides with published organization ${collisions.map((organization) => `'${organization.slug}'`).sort().join(", ")}.`);
      }
    }
    const proposedWebsiteDomain = normalizedWebsiteDomain(canonicalRepairWebsite(candidate));
    if (proposedWebsiteDomain) {
      const websiteCollisions = catalog.organizations.filter((organization) => organization.slug !== selfSlug
        && normalizedWebsiteDomain(organization.websiteUrl) === proposedWebsiteDomain);
      if (websiteCollisions.length > 0) {
        errors.push(`Candidate ${candidateId} proposed website domain '${proposedWebsiteDomain}' collides with published organization ${websiteCollisions.map((organization) => `'${organization.slug}'`).sort().join(", ")}.`);
      }
    }
  }

  for (const reference of programReferences(candidate)) {
    const resolution = resolveLinkabilityProgram(reference, catalog.programs);
    const label = `Candidate ${candidateId} program '${reference.slug}'`;
    if (resolution.status === "canonical_conflict") {
      errors.push(`${label} conflicts with its published canonical program in ${resolution.differingFields.join(", ")}; reuse the canonical definition exactly.`);
    } else if (resolution.status === "possible_duplicate") {
      warnings.push(`${label} may duplicate published program ${resolution.programs.map((program) => `'${program.slug}'`).join(", ")}; resolve it manually before treating it as a new program.`);
    }
  }

  return {
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)]
  };
}

function bulletGroup(lines: string[], heading: string, values: string[]) {
  lines.push(`- **${heading}:**`);
  if (!values.length) {
    lines.push("  - None.");
    return;
  }
  for (const value of values) lines.push(`  - ${value}`);
}

export function formatCandidateLinkabilityReview(candidate: unknown, catalog: LinkabilityCatalog) {
  const selfSlug = candidateSelfSlug(candidate);
  const exactTargets: string[] = [];
  const aliasSuggestions: string[] = [];
  const unresolvedNames: string[] = [];
  const reciprocalSuggestions: string[] = [];
  const programFindings: string[] = [];
  const successorFindings: string[] = [];

  for (const reference of relationshipReferences(candidate)) {
    const resolution = resolveLinkabilityOrganization(reference, catalog.organizations, selfSlug);
    const relationship = `relationship type ${markdownCode(reference.relationshipType)}`;
    if (resolution.status === "canonical_exact") {
      if (reference.slug) {
        exactTargets.push(`${markdownCode(reference.name)} resolves exactly to ${markdownCode(resolution.organization.slug)} (${relationship}).`);
        reciprocalSuggestions.push(`After human review and publication, connect this record to /organizations/${resolution.organization.slug} and render the reviewed ${markdownCode(reference.relationshipType)} context reciprocally.`);
      } else {
        aliasSuggestions.push(`${markdownCode(reference.name)} exactly matches the canonical name for ${markdownCode(resolution.organization.slug)}, but the relationship has no slug; verify and add the canonical target before publication.`);
      }
    } else if (resolution.status === "exact_alias_suggestion") {
      if (reference.slug) {
        exactTargets.push(`${markdownCode(reference.name)} is a published alias of the supplied canonical target ${markdownCode(resolution.organization.slug)} (${relationship}).`);
        reciprocalSuggestions.push(`After human review and publication, connect this record to /organizations/${resolution.organization.slug} using the reviewed ${markdownCode(reference.relationshipType)} context.`);
      } else {
        aliasSuggestions.push(`${markdownCode(reference.name)} is an exact published alias of ${markdownCode(resolution.organization.name)} (${markdownCode(resolution.organization.slug)}); verify that canonical target before staging.`);
      }
    } else if (resolution.status === "ambiguous") {
      unresolvedNames.push(`${markdownCode(reference.name)} matches more than one canonical name or published alias: ${resolution.organizations.map((item) => markdownCode(item.slug)).join(", ")}. Do not link until resolved.`);
    } else if (resolution.status === "slug_name_mismatch") {
      unresolvedNames.push(`${markdownCode(reference.slug ?? "no-slug")} resolves to ${markdownCode(resolution.organization.name)}, but the supplied name ${markdownCode(reference.name)} is not its canonical name or a published alias.`);
    } else if (resolution.status === "slug_not_found") {
      unresolvedNames.push(`Supplied slug ${markdownCode(resolution.slug)} is not a published organization. Do not fall back to the name ${markdownCode(reference.name)}; resolve the conflict before staging.`);
    } else if (resolution.status === "self_reference") {
      unresolvedNames.push(`${markdownCode(reference.name)} resolves to the candidate itself; remove the self-relationship unless the evidence and data model explicitly require it.`);
    } else {
      unresolvedNames.push(`${markdownCode(reference.name)} has no exact canonical-name or published-alias resolution. Keep it private and unresolved; do not publish a runtime name match.`);
    }
  }

  for (const reference of programReferences(candidate)) {
    const resolution = resolveLinkabilityProgram(reference, catalog.programs);
    const role = classifyProgramParticipationRole(reference.participationType);
    const cohort = reference.cohortLabel ? `; cohort ${markdownCode(reference.cohortLabel)}` : "";
    if (resolution.status === "canonical_exact") {
      programFindings.push(`${markdownCode(reference.slug)} reuses the exact canonical program definition; preserve participation type ${markdownCode(reference.participationType ?? "not supplied")} (review bucket ${markdownCode(role)}${cohort}).`);
      reciprocalSuggestions.push(`After Review and Publish, expose the organization-to-program path for ${markdownCode(reference.slug)} using the exact participation role; do not apply it to every capability.`);
    } else if (resolution.status === "canonical_conflict") {
      programFindings.push(`${markdownCode(reference.slug)} conflicts with its published canonical definition in ${resolution.differingFields.map(markdownCode).join(", ")}. Reuse the published fields exactly before staging.`);
    } else if (resolution.status === "possible_duplicate") {
      programFindings.push(`${markdownCode(reference.slug)} may duplicate ${resolution.programs.map((program) => markdownCode(program.slug)).join(", ")} by exact normalized name or canonical website. Resolve manually; do not create an organization-specific variant.`);
    } else {
      const annualCohortWarning = /(?:19|20)\d{2}/.test(`${reference.slug} ${reference.name}`) && !reference.cohortLabel
        ? " The year appears in the program identity without a cohort label; verify whether this is an annual cohort of an existing program family."
        : "";
      programFindings.push(`${markdownCode(reference.slug)} has no exact canonical slug, name, or website match and remains a proposed new program.${annualCohortWarning} Participation type is ${markdownCode(reference.participationType ?? "not supplied")} (review bucket ${markdownCode(role)}${cohort}).`);
    }
  }

  for (const successor of canonicalRepairSuccessors(candidate)) {
    const published = catalog.organizations.find((organization) => organization.slug === successor.slug);
    if (published && published.id === successor.id && published.name === successor.name
        && published.updatedAt === successor.baselineUpdatedAt
        && !(catalog.redirectSourceOrganizationIds ?? []).includes(successor.id)
        && successor.slug !== selfSlug) {
      successorFindings.push(`${markdownCode(successor.slug)} resolves exactly to published organization ${markdownCode(successor.name)}; publication may add a one-hop predecessor redirect without merging records.`);
    } else {
      successorFindings.push(`${markdownCode(successor.slug)} is not an exact, distinct published successor. Keep this repair blocked.`);
    }
  }

  const lines = [
    "#### Linkability review",
    "",
    "Private deterministic review aid only. It uses exact canonical slugs, names, and published aliases; it neither mutates the candidate nor creates a public relationship.",
    ""
  ];
  bulletGroup(lines, "Exact canonical relationship targets", exactTargets);
  bulletGroup(lines, "Possible alias resolutions", aliasSuggestions);
  bulletGroup(lines, "Unresolved organization names", unresolvedNames);
  bulletGroup(lines, "Program and cohort checks", programFindings);
  bulletGroup(lines, "Canonical successor checks", successorFindings);
  bulletGroup(lines, "Suggested reciprocal links", reciprocalSuggestions);
  lines.push(
    "- **Capability-to-program boundary:** No capability-to-program link is created from organization participation. Such a claim requires a durable leaf source that explicitly names both the capability and the program, followed by the existing human Review and Publish checkpoints.",
    ""
  );
  return lines;
}
