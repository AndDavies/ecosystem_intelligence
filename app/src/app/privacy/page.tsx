import { Database, Eye, MailCheck, ShieldCheck } from "lucide-react";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";

export const metadata = {
  title: "Preview privacy",
  description: "How the Ecosystem Intelligence design-partner preview handles signup, feedback, and product-learning data."
};

export default function PrivacyPage() {
  return (
    <PublicPageShell
      eyebrow="Preview governance"
      title="Privacy and participation"
      description="This invitation-only preview collects only the information needed to operate the pilot, understand product use, and respond to voluntary feedback."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <PublicCard title="Update signup" eyebrow="Affirmative consent">
          <div className="flex items-start gap-3"><MailCheck className="mt-0.5 size-5 shrink-0 text-[#007f98]" /><p className="text-sm leading-6 text-[#475467]">If you opt in, the preview stores your email address, the consent language and version you accepted, the signup source, and the invitation cohort. Updates will identify the sender and include a simple unsubscribe mechanism.</p></div>
        </PublicCard>
        <PublicCard title="Design-partner feedback" eyebrow="Voluntary contribution">
          <div className="flex items-start gap-3"><Database className="mt-0.5 size-5 shrink-0 text-[#007f98]" /><p className="text-sm leading-6 text-[#475467]">The feedback form stores what you were trying to do, what worked, what was missing, the page you were viewing, and an optional follow-up email. Feedback is private and does not update published ecosystem records.</p></div>
        </PublicCard>
        <PublicCard title="Product learning" eyebrow="Privacy-light measurement">
          <div className="flex items-start gap-3"><Eye className="mt-0.5 size-5 shrink-0 text-[#007f98]" /><p className="text-sm leading-6 text-[#475467]">The pilot records submitted search terms and a small set of meaningful workflow events, including page views, filters, result or marker selection, dossier opening, evidence viewing, exports, signup, and feedback. It does not record keystrokes, mouse movement, arbitrary form contents, or session replay. A random per-tab identifier connects these steps without identifying a person. Raw IP addresses are not stored; a server-side one-way request fingerprint is used only for rate limiting and aggregate pilot analysis. Vercel Web Analytics and Speed Insights provide aggregate traffic and performance information.</p></div>
        </PublicCard>
        <PublicCard title="Trust boundary" eyebrow="What this preview is not">
          <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#007f98]" /><p className="text-sm leading-6 text-[#475467]">This preview is being tested with COVE design partners. It is not a complete directory, a COVE endorsement, a procurement service, or a representation of classified demand. Public records remain evidence-backed and editorially reviewed.</p></div>
        </PublicCard>
      </div>
      <PublicCard title="Retention and removal" eyebrow="Pilot controls" className="mt-5">
        <p className="text-sm leading-6 text-[#475467]">Submitted search terms are marked to expire after 90 days and are purged during active preview use. Other pilot records are retained for the duration of design-partner testing and product follow-up. You can request correction or removal through the feedback control. Update emails will provide direct sender contact information and an unsubscribe link.</p>
      </PublicCard>
    </PublicPageShell>
  );
}
