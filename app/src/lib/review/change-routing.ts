export type SupportedEntityType = "capability" | "company" | "capability_use_case" | "use_case";

export const entityConfig: Record<
  SupportedEntityType,
  {
    table: "capabilities" | "companies" | "capability_use_cases" | "use_cases";
    lowImpactFields: string[];
    highImpactFields: string[];
    nullableFields: string[];
  }
> = {
  capability: {
    table: "capabilities",
    lowImpactFields: ["summary", "company_facing_context"],
    highImpactFields: [],
    nullableFields: ["company_facing_context"]
  },
  company: {
    table: "companies",
    lowImpactFields: [
      "overview",
      "market_context",
      "website_url",
      "public_contact_email",
      "public_contact_phone"
    ],
    highImpactFields: [],
    nullableFields: ["market_context", "website_url", "public_contact_email", "public_contact_phone"]
  },
  capability_use_case: {
    table: "capability_use_cases",
    lowImpactFields: ["why_it_matters", "action_note"],
    highImpactFields: ["pathway", "relevance_band", "defence_relevance", "suggested_action_type"],
    nullableFields: ["action_note"]
  },
  use_case: {
    table: "use_cases",
    lowImpactFields: [],
    highImpactFields: [],
    nullableFields: []
  }
};

export function getEntityConfig(entityType: string) {
  if (!(entityType in entityConfig)) {
    throw new Error(`Unsupported entity type: ${entityType}`);
  }

  return entityConfig[entityType as SupportedEntityType];
}

export function normalizeFieldValue(
  entityType: SupportedEntityType,
  fieldName: string,
  rawValue: string
) {
  const config = getEntityConfig(entityType);
  const value = rawValue.trim();

  if (!value && config.nullableFields.includes(fieldName)) {
    return null;
  }

  return value;
}

export function buildImpactChanges(input: {
  entityType: SupportedEntityType;
  nextValues: Record<string, string>;
  currentValues: Record<string, string>;
}) {
  const config = getEntityConfig(input.entityType);
  const lowImpactUpdates: Record<string, string | null> = {};
  const highImpactBefore: Record<string, unknown> = {};
  const highImpactAfter: Record<string, unknown> = {};

  [...config.lowImpactFields, ...config.highImpactFields].forEach((fieldName) => {
    const nextValue = normalizeFieldValue(input.entityType, fieldName, input.nextValues[fieldName] ?? "");
    const currentValue = normalizeFieldValue(
      input.entityType,
      fieldName,
      input.currentValues[fieldName] ?? ""
    );

    if (nextValue === currentValue) {
      return;
    }

    if (config.lowImpactFields.includes(fieldName)) {
      lowImpactUpdates[fieldName] = nextValue;
      return;
    }

    highImpactBefore[fieldName] = currentValue;
    highImpactAfter[fieldName] = nextValue;
  });

  return {
    lowImpactUpdates,
    highImpactBefore,
    highImpactAfter
  };
}
