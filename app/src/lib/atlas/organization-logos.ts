import type { AtlasOrganizationLogo } from "@/types/atlas";

export const organizationLogoBucket = "atlas-public-media";

export type OrganizationLogoRow = {
  id?: unknown;
  asset_type?: unknown;
  storage_path?: unknown;
  source_url?: unknown;
  source_visibility?: unknown;
  attribution_text?: unknown;
  approval_status?: unknown;
  publication_status?: unknown;
  created_at?: unknown;
};

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function organizationLogoUrl(storagePath: string) {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://facoactpdckkhciamflk.supabase.co").replace(/\/$/, "");
  const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${organizationLogoBucket}/${encodedPath}`;
}

export function selectPublishedOrganizationLogo(rows: OrganizationLogoRow[]): AtlasOrganizationLogo | null {
  const candidates = rows
    .filter((row) =>
      row.asset_type === "logo" &&
      row.approval_status === "approved" &&
      row.publication_status === "published" &&
      (row.source_visibility === "public" || row.source_visibility === "permissioned") &&
      optionalString(row.storage_path)
    )
    .sort((left, right) => String(right.created_at ?? "").localeCompare(String(left.created_at ?? "")));
  const selected = candidates[0];
  const storagePath = optionalString(selected?.storage_path);
  if (!selected || !storagePath) return null;

  return {
    id: optionalString(selected.id) ?? "",
    publicUrl: organizationLogoUrl(storagePath),
    storagePath,
    sourceUrl: optionalString(selected.source_url),
    attributionText: optionalString(selected.attribution_text)
  };
}
