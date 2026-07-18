import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";

export const metadata = { title: "Terms of use", description: "Terms governing use of the Ecosystem Intelligence public beta." };

export default function TermsPage() {
  return (
    <PublicPageShell eyebrow="Public Beta" title="Terms of use" description="Use the atlas as a discovery aid, verify important decisions independently, and contribute responsibly.">
      <div className="space-y-5">
        <PublicCard title="Independent informational resource" eyebrow="No official status"><p className="text-sm leading-6 text-[var(--atlas-muted)]">Ecosystem Intelligence is an independent project by Andrew Davies. It is not affiliated with or endorsed by the Government of Canada, the Canadian Armed Forces, NATO, any procurement authority, or any organization listed in the atlas.</p></PublicCard>
        <PublicCard title="No warranty or eligibility determination" eyebrow="Use your judgment"><p className="text-sm leading-6 text-[var(--atlas-muted)]">Records are assembled from reviewed public sources and may be incomplete, stale, or disputed. They are not legal, investment, security, procurement, or due-diligence advice. Inclusion, ranking, demand relevance, or connection facilitation does not establish endorsement, certification, eligibility, or suitability.</p></PublicCard>
        <PublicCard title="Contributions and connections" eyebrow="Review first"><p className="text-sm leading-6 text-[var(--atlas-muted)]">You must submit accurate information you are permitted to share. Public contributions do not update records automatically. Connection requests are private and may be declined. Introductions occur only when appropriate and do not create an agency, brokerage, or advisory relationship.</p></PublicCard>
        <PublicCard title="Acceptable use" eyebrow="Protect the ecosystem"><p className="text-sm leading-6 text-[var(--atlas-muted)]">Do not misuse the service to scrape personal information, circumvent access controls, submit unlawful or confidential material, impersonate another party, send unsolicited bulk outreach, or interfere with availability. Public CSV and PDF exports are provided for responsible research and collaboration.</p></PublicCard>
        <PublicCard title="Corrections and changes" eyebrow="Living beta"><p className="text-sm leading-6 text-[var(--atlas-muted)]">The service, coverage, and these terms may change as the beta develops. Use the correction workflow or contact form to report a material issue. Last updated July 17, 2026.</p></PublicCard>
      </div>
    </PublicPageShell>
  );
}
