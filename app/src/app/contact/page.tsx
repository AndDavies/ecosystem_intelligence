import { ContactForm } from "@/components/atlas/contact-form";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";

export const metadata = {
  title: "Contact",
  description: "Contact Ecosystem Intelligence about partnerships, media, privacy, or the Canadian defence and dual-use ecosystem."
};

export default function ContactPage() {
  return (
    <PublicPageShell eyebrow="Contact" title="Start a useful conversation." description="Send a private message about partnerships, media, privacy, or the atlas. Organization additions and corrections should use the reviewed contribution workflow.">
      <div className="mx-auto max-w-3xl">
        <PublicCard title="Contact Andrew" eyebrow="Private inbox"><ContactForm /></PublicCard>
      </div>
    </PublicPageShell>
  );
}
