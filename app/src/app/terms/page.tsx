import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";

export const metadata = {
  title: "Terms of use",
  description: "Terms governing use of the True North Map public beta.",
  alternates: { canonical: "/terms" }
};

export default function TermsPage() {
  return (
    <PublicPageShell eyebrow="Public Beta" title="Terms of use" description="Use the ecosystem map to discover possibilities, verify important decisions independently, and contribute responsibly.">
      <div className="space-y-5">
        <PublicCard title="Independent informational resource" eyebrow="No official status"><p className="text-sm leading-6 text-[var(--atlas-muted)]">True North Map is an independent project by Andrew Davies. It is not affiliated with or endorsed by the Government of Canada, the Canadian Armed Forces, NATO, any procurement authority, or any organization shown on the map.</p></PublicCard>
        <PublicCard title="No warranty or eligibility determination" eyebrow="Use your judgment"><p className="text-sm leading-6 text-[var(--atlas-muted)]">Records are assembled from reviewed public sources and may be incomplete, stale, or disputed. They are not legal, investment, security, procurement, or due-diligence advice. Inclusion, ranking, a technology-to-demand assessment, or connection facilitation does not establish endorsement, certification, eligibility, or suitability.</p></PublicCard>
        <PublicCard title="AI-assisted discovery" eyebrow="Our assessment"><p className="text-sm leading-6 text-[var(--atlas-muted)]">Ask True North ranks only published records and links its reasoning to available public sources. Its relevance labels and summaries are generated interpretations, not source-backed facts, recommendations, procurement guidance, or due diligence. Do not submit classified, confidential, proprietary, unlawful, or personal information.</p></PublicCard>
        <PublicCard title="Contributions and connections" eyebrow="Review first"><p className="text-sm leading-6 text-[var(--atlas-muted)]">You must submit accurate information you are permitted to share. Public contributions do not update records automatically. Connection requests are private and may be declined. Introductions occur only when appropriate and do not create an agency, brokerage, or advisory relationship.</p></PublicCard>
        <PublicCard title="Acceptable use" eyebrow="Protect the ecosystem"><p className="text-sm leading-6 text-[var(--atlas-muted)]">Do not misuse the service to scrape personal information, circumvent access controls, submit unlawful or confidential material, impersonate another party, send unsolicited bulk outreach, or interfere with availability. Public CSV and PDF exports are provided for responsible research and collaboration.</p></PublicCard>
        <PublicCard title="Corrections and changes" eyebrow="Living beta"><p className="text-sm leading-6 text-[var(--atlas-muted)]">The service, coverage, and these terms may change as the beta develops. Use the correction workflow, contact form, or <a href="mailto:hello@truenorthmap.ca" className="font-semibold text-[var(--atlas-primary)] underline">hello@truenorthmap.ca</a> to report a material issue. Security concerns can be sent privately to <a href="mailto:security@truenorthmap.ca" className="font-semibold text-[var(--atlas-primary)] underline">security@truenorthmap.ca</a>. Last updated July 22, 2026.</p></PublicCard>
      </div>
    </PublicPageShell>
  );
}
