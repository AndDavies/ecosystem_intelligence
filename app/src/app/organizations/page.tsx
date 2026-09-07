import {
  organizationsMetadata,
  OrganizationsRoute
} from "@/components/atlas/organizations-route";

// The canonical directory is cached until successful Publish invalidates it.
// The daily expiry is only a recovery backstop for out-of-band data repairs.
export const revalidate = 86400;
export const metadata = organizationsMetadata;

export default function OrganizationsPage() {
  return <OrganizationsRoute searchParams={Promise.resolve({})} />;
}
