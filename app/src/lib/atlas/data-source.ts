export type AtlasDataSource = "supabase" | "validated_seed";

export function resolveAtlasDataSource(value: string | undefined): AtlasDataSource {
  const normalized = value?.trim().toLowerCase() || "validated_seed";

  if (normalized !== "supabase" && normalized !== "validated_seed") {
    throw new Error(`Unsupported atlas data source: ${JSON.stringify(value)}`);
  }

  return normalized;
}
