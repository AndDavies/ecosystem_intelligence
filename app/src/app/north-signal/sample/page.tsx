import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPageShell } from "@/components/atlas/public-page-shell";
import { getApprovedNorthSignalSample } from "@/lib/north-signal/public-sample";

export const metadata = {
  title: "A North Signal weekly briefing",
  alternates: { canonical: "/north-signal/sample" },
  robots: { index: false, follow: true }
};

export default function NorthSignalSamplePage() {
  const sample = getApprovedNorthSignalSample();
  if (!sample) notFound();
  return <PublicPageShell eyebrow="North Signal · Sample weekly email" title={sample.title} description={`A weekly briefing from True North Map. Issue date: ${sample.issueDate}.`} breadcrumbs={[{label:"Home",href:"/"},{label:"North Signal",href:"/north-signal"},{label:"Sample briefing"}]} actions={<Link href="/north-signal#north-signal-signup" className="atlas-signal-button min-h-11 px-5">Get the free weekly briefing</Link>}>
    <article className="mx-auto max-w-3xl py-8">{sample.sections.map((section) => <section key={section.heading} className="mb-8"><h2 className="text-2xl font-extrabold">{section.heading}</h2>{section.paragraphs.map((paragraph,index) => <p key={index} className="mt-4 text-base leading-8">{paragraph}</p>)}</section>)}<nav aria-label="Sources and next steps"><ul className="space-y-3">{sample.links.map((link) => <li key={link.href}><Link href={link.href} className="underline underline-offset-4">{link.label}</Link></li>)}</ul></nav></article>
  </PublicPageShell>;
}
