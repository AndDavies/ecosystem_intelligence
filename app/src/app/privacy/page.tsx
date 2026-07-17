import { Database, Eye, MailCheck, ShieldCheck } from "lucide-react";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";

export const metadata = { title: "Privacy", description: "How Ecosystem Intelligence handles accounts, contributions, connections, messages, feedback, analytics, and retention." };

export default function PrivacyPage() {
  return (
    <PublicPageShell eyebrow="Public-beta governance" title="Privacy and participation" description="Ecosystem Intelligence collects only the information needed to operate private workflows, improve discovery, and respond to voluntary contact.">
      <div className="grid gap-5 lg:grid-cols-2">
        <PublicCard title="Google sign-in and private work" eyebrow="User-controlled actions"><ShieldCheck className="mb-3 size-5 text-[#007f98]" /><p className="text-sm leading-6 text-[#475467]">Google provides a verified email and basic profile information for sign-in. The service does not receive your Google password. Saved Working Lists, contributions, and connection requests are private to you and authorized reviewers.</p></PublicCard>
        <PublicCard title="Updates and contact" eyebrow="Affirmative consent"><MailCheck className="mb-3 size-5 text-[#007f98]" /><p className="text-sm leading-6 text-[#475467]">Update signup stores your email, the consent language and version, source, and status. Contact messages store the details you enter and a one-way request fingerprint used for rate limiting. Campaigns will not begin until a verified sender and compliant unsubscribe process exist.</p></PublicCard>
        <PublicCard title="Product learning" eyebrow="Meaningful actions only"><Eye className="mb-3 size-5 text-[#007f98]" /><p className="text-sm leading-6 text-[#475467]">Vercel provides aggregate traffic and performance analytics. Private product telemetry records searches, filters, zero results, selections, profiles, sources, exports, saves, contributions, connections, subscriptions, and feedback. It does not use session replay, keystroke capture, mouse tracking, advertising profiles, or stored raw IP addresses.</p></PublicCard>
        <PublicCard title="Retention and review" eyebrow="Limited and private"><Database className="mb-3 size-5 text-[#007f98]" /><p className="text-sm leading-6 text-[#475467]">Raw search text expires after 90 days and detailed workflow events after 30 days. Feedback, contact, consent, submissions, and connection requests remain private for review, follow-up, governance, and audit until no longer needed. Published records use approved public evidence only.</p></PublicCard>
      </div>
      <PublicCard title="Your choices" eyebrow="Access, correction, and removal" className="mt-5"><p className="text-sm leading-6 text-[#475467]">You can decline Google sign-in and browse publicly, dismiss the update prompt for 30 days, submit a correction, withdraw from future updates, or request access, correction, or removal through the <a href="/contact" className="font-semibold text-[#007f98] underline">contact form</a>. Last updated July 17, 2026.</p></PublicCard>
    </PublicPageShell>
  );
}
