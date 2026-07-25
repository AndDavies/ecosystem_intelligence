import { afterEach, describe, expect, it } from "vitest";
import { organizationLogoUrl, selectPublishedOrganizationLogo } from "@/lib/atlas/organization-logos";

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

afterEach(() => {
  if (originalSupabaseUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
});

describe("organization logo selection", () => {
  it("selects the newest approved, published public logo", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    const result = selectPublishedOrganizationLogo([
      { id: "old", asset_type: "logo", storage_path: "organizations/one/logos/old.webp", source_url: "https://official.example/old.svg", source_visibility: "public", attribution_text: "Old mark", approval_status: "approved", publication_status: "published", created_at: "2026-07-20T00:00:00Z" },
      { id: "new", asset_type: "logo", storage_path: "organizations/one/logos/new mark.webp", source_url: "https://official.example/new.svg", source_visibility: "public", attribution_text: "Official mark", approval_status: "approved", publication_status: "published", created_at: "2026-07-21T00:00:00Z" }
    ]);

    expect(result).toEqual({
      id: "new",
      publicUrl: "https://project.supabase.co/storage/v1/object/public/atlas-public-media/organizations/one/logos/new%20mark.webp",
      storagePath: "organizations/one/logos/new mark.webp",
      sourceUrl: "https://official.example/new.svg",
      attributionText: "Official mark"
    });
  });

  it("excludes drafts, rejected assets, internal sources, and non-logo media", () => {
    const rows = [
      { asset_type: "logo", storage_path: "draft.webp", source_visibility: "public", approval_status: "approved", publication_status: "draft" },
      { asset_type: "logo", storage_path: "rejected.webp", source_visibility: "public", approval_status: "rejected", publication_status: "published" },
      { asset_type: "logo", storage_path: "internal.webp", source_visibility: "internal", approval_status: "approved", publication_status: "published" },
      { asset_type: "product_image", storage_path: "product.webp", source_visibility: "public", approval_status: "approved", publication_status: "published" }
    ];
    expect(selectPublishedOrganizationLogo(rows)).toBeNull();
  });

  it("supports permissioned approved marks and returns the no-logo fallback state", () => {
    expect(selectPublishedOrganizationLogo([])).toBeNull();
    expect(selectPublishedOrganizationLogo([{ id: "permissioned", asset_type: "logo", storage_path: "organizations/one/logos/logo.webp", source_visibility: "permissioned", approval_status: "approved", publication_status: "published" }])?.id).toBe("permissioned");
  });

  it("constructs the public bucket URL without exposing a storage listing", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co/";
    expect(organizationLogoUrl("organizations/one/logos/logo.webp")).toBe("https://project.supabase.co/storage/v1/object/public/atlas-public-media/organizations/one/logos/logo.webp");
  });
});
