import { Database, Eye, MailCheck, ShieldCheck } from "lucide-react";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";

export const metadata = { title: "Privacy", description: "How True North Map handles accounts, contributions, connections, messages, feedback, analytics, and retention." };

export default function PrivacyPage() {
  return (
    <PublicPageShell eyebrow="Public-beta governance" title="Privacy and participation" description="True North Map collects only the information needed to operate private workflows, improve discovery, and respond to voluntary contact.">
      <div className="grid gap-5 lg:grid-cols-2">
        <PublicCard title="Sign-in and private work" eyebrow="User-controlled actions"><ShieldCheck className="mb-3 size-5 text-[var(--atlas-primary)]" /><p className="text-sm leading-6 text-[var(--atlas-muted)]">You can use Google or a passwordless email link. Google provides a verified email and basic profile information; the service never receives your Google or email password. Working Lists, contributions, and connection requests are private to you and the authorized administrator.</p></PublicCard>
        <PublicCard title="Updates and contact" eyebrow="Affirmative consent"><MailCheck className="mb-3 size-5 text-[var(--atlas-primary)]" /><p className="text-sm leading-6 text-[var(--atlas-muted)]">Update signup stores your email, the consent language and version, source, and status. Contact messages store the details you enter and a one-way request fingerprint used for rate limiting. Campaigns will not begin until a verified sender and compliant unsubscribe process exist.</p></PublicCard>
        <PublicCard title="Product learning" eyebrow="Meaningful actions only"><Eye className="mb-3 size-5 text-[var(--atlas-primary)]" /><p className="text-sm leading-6 text-[var(--atlas-muted)]">Vercel provides aggregate traffic and performance analytics. Private product telemetry records searches, filters, zero results, selections, profiles, sources, exports, saves, contributions, connections, subscriptions, and feedback. It does not use session replay, keystroke capture, mouse tracking, advertising profiles, or stored raw IP addresses.</p></PublicCard>
        <PublicCard title="Retention and review" eyebrow="Limited and private"><Database className="mb-3 size-5 text-[var(--atlas-primary)]" /><p className="text-sm leading-6 text-[var(--atlas-muted)]">Raw search text expires after 90 days and detailed workflow events after 30 days. Feedback, contact, consent, submissions, and connection requests remain private for review, follow-up, governance, and audit until no longer needed. Published records use approved public evidence only.</p></PublicCard>
      </div>
      <PublicCard title="Your choices" eyebrow="Access, correction, and removal" className="mt-5"><p className="text-sm leading-6 text-[var(--atlas-muted)]">You can browse without an account, manage or delete your account and owner-bound private data from <a href="/account" className="font-semibold text-[var(--atlas-primary)] underline">Your account</a>, dismiss the update prompt for 30 days, submit a correction, and unsubscribe from future updates during deletion. Published records and anonymized audit history are not removed with a member account. Use the <a href="/contact" className="font-semibold text-[var(--atlas-primary)] underline">contact form</a> for another access, correction, or privacy request. Last updated July 18, 2026.</p></PublicCard>
    </PublicPageShell>
  );
}
