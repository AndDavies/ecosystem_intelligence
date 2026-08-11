import Link from "next/link";
import { OrganizationDirectoryLoading } from "@/components/atlas/organization-directory-loading";
import { PublicPageShell } from "@/components/atlas/public-page-shell";

export default function Loading() {
  return (
    <PublicPageShell
      eyebrow="Canadian defence and dual-use directory"
      title="Find Canadian organizations worth examining."
      description="Search by capability, place or organization type. Open a profile to see what the organization offers and what supports the record."
      actions={<Link href="/map?start=need" className="atlas-primary-button min-h-11 px-5 text-sm">Describe a need</Link>}
    >
      <OrganizationDirectoryLoading />
    </PublicPageShell>
  );
}
