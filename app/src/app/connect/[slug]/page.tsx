import { notFound } from "next/navigation";
import { ConnectionForm } from "@/components/atlas/connection-form";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { requireAtlasUser } from "@/lib/atlas/auth";
import { getAtlasOrganizationBySlug } from "@/lib/atlas/repository";

export const metadata = { title: "Request a connection", robots: { index: false, follow: false } };

export default async function ConnectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const returnTo = `/connect/${slug}`;
  const [user, organization] = await Promise.all([requireAtlasUser(returnTo), getAtlasOrganizationBySlug(slug)]);
  if (!organization) notFound();
  const defaultName = user.email.split("@")[0]?.replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) ?? "";

  return (
    <PublicPageShell eyebrow="Private connection request" title={`Connect with ${organization.name}`} description="Share the purpose of the conversation. Andrew reviews each request and may coordinate an introduction when it appears useful to both sides." backHref={`/organizations/${organization.slug}`} backLabel="Back to organization profile">
      <div className="mx-auto max-w-3xl"><PublicCard title="Connection context" eyebrow="Human-vetted introduction"><ConnectionForm organizationId={organization.id} organizationName={organization.name} defaultName={defaultName} /></PublicCard></div>
    </PublicPageShell>
  );
}
