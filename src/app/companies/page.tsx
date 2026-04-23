import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { CompanyBrowse } from "@/components/companies/company-browse";
import { requireProfile } from "@/lib/auth";
import { getCompaniesIndex } from "@/lib/data/repository";

export default async function CompaniesPage() {
  const profile = await requireProfile();
  const companies = await getCompaniesIndex();

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title="Companies"
        description="Browse companies directly when you already know the organization, need portfolio context, or want to compare market activity across domains."
        eyebrow="Organization-led discovery"
        breadcrumbs={[
          { label: "Home", href: "/app" },
          { label: "Companies" }
        ]}
      />
      <CompanyBrowse companies={companies} />
    </AppShell>
  );
}
