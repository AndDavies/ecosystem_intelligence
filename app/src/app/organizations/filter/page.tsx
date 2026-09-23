import {
  organizationDirectoryMetadata,
  OrganizationsRoute,
  type OrganizationSearchParams
} from "@/components/atlas/organizations-route";

// Only query-bearing directory requests reach this internal renderer. The
// browser-visible URL remains /organizations?... through the middleware rewrite.
export const dynamic = "force-dynamic";
export async function generateMetadata({ searchParams }: { searchParams: OrganizationSearchParams }) {
  return organizationDirectoryMetadata(searchParams);
}

export default function FilteredOrganizationsPage({ searchParams }: { searchParams: OrganizationSearchParams }) {
  return <OrganizationsRoute searchParams={searchParams} />;
}
