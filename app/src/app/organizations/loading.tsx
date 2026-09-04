import { OrganizationDirectoryLoading } from "@/components/atlas/organization-directory-loading";
import { PublicPageShell } from "@/components/atlas/public-page-shell";

export default function Loading() {
  return (
    <PublicPageShell
      eyebrow="Canadian defence and dual-use directory"
      title="Find Canadian organizations worth examining."
      description="Search by capability, place or organization type. Open a profile to see what the organization offers and what supports the record."
      pageHeader={(
        <header role="status" aria-busy="true" className="atlas-page-heading mt-7 border-b border-[var(--atlas-border)] pb-8">
          <p className="atlas-eyebrow">Canadian defence and dual-use directory</p>
          <p className="mt-3 font-[family-name:var(--font-barlow)] text-3xl font-extrabold leading-[1.04] tracking-[-0.052em] text-[var(--atlas-ink)] sm:text-[46px] lg:text-[52px]">Find Canadian organizations worth examining.</p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--atlas-muted)] sm:text-base sm:leading-7">Loading the published organization directory.</p>
        </header>
      )}
    >
      <OrganizationDirectoryLoading />
    </PublicPageShell>
  );
}
