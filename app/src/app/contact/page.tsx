import { ContactForm } from "@/components/atlas/contact-form";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";

export const metadata = {
  title: "Contact",
  description: "Contact True North Map about partnerships, media, privacy, or the Canadian defence and dual-use ecosystem."
};

export default function ContactPage() {
  return (
    <PublicPageShell eyebrow="Contact" title="Start a useful conversation." description="Send a private message about partnerships, media, privacy, or the atlas. Organization additions and corrections should use the reviewed contribution workflow.">
      <div className="mx-auto max-w-3xl">
        <PublicCard title="Contact Andrew" eyebrow="Private inbox">
          <ContactForm />
          <p className="mt-5 border-t border-[var(--atlas-border)] pt-5 text-sm leading-6 text-[var(--atlas-muted)]">
            Prefer email? Write to <a href="mailto:hello@truenorthmap.ca" className="font-semibold text-[var(--atlas-primary)] underline">hello@truenorthmap.ca</a>. Privacy requests can be sent directly to <a href="mailto:privacy@truenorthmap.ca" className="font-semibold text-[var(--atlas-primary)] underline">privacy@truenorthmap.ca</a>.
          </p>
        </PublicCard>
      </div>
    </PublicPageShell>
  );
}
