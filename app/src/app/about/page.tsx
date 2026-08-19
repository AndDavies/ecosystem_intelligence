import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Binoculars,
  Compass,
  Link2,
  Network,
  ShieldCheck,
  Sparkles,
  Waves
} from "lucide-react";
import { PublicPageShell } from "@/components/atlas/public-page-shell";
import { brandCopy } from "@/lib/brand-copy";
import { socialMetadata } from "@/lib/seo/social";

export const metadata = {
  title: "About True North Map",
  description:
    "Learn why True North Map was created and how the independent project makes Canadian defence and dual-use capability easier to find, understand, and connect.",
  alternates: { canonical: "/about" },
  ...socialMetadata({ title: brandCopy.founderThesis, description: "The story behind an independent project built to make Canadian defence and dual-use capability easier to find, understand, and connect.", path: "/about", eyebrow: "Why True North Map exists" })
};

const story = [
  {
    number: "01",
    eyebrow: "The call",
    title: "Experience became responsibility.",
    icon: Compass,
    body: "I am a veteran and former Combat Systems Engineering Officer whose career has spanned military service and the civilian sector. As global events sharpened the importance of security, resilience, and sovereign capability, I felt a responsibility to focus my effort in Canada, in industries where that experience could be useful."
  },
  {
    number: "02",
    eyebrow: "The spark",
    title: "Canada was already answering.",
    icon: Sparkles,
    body: "Working in defence brought me into conversations with operators, engineers, subject-matter experts, founders, program teams, and industry leaders. I found extraordinary talent, creativity, experience, and drive coalescing around the same ambition: build more in Canada and contribute to the work ahead."
  },
  {
    number: "03",
    eyebrow: "The gap",
    title: "The capability was here. The shared picture was not.",
    icon: Binoculars,
    body: "What remained difficult was seeing the country as one connected ecosystem. Who is building? What can their technology do? Where could it fit? What evidence supports it? Who should be brought into the next conversation? Without that shared view, strong teams and useful opportunities can remain invisible to one another."
  }
];

const outcomes = [
  {
    eyebrow: "Find",
    title: "See who can help",
    icon: Binoculars,
    body: "Move from a region, technology, or real operational need to the Canadian organizations worth understanding next."
  },
  {
    eyebrow: "Understand",
    title: "Understand why they matter",
    icon: ShieldCheck,
    body: "Compare possible fit, separate facts from assessment, and see both what may matter and where the public record stops."
  },
  {
    eyebrow: "Connect",
    title: "Start the right conversation",
    icon: Link2,
    body: "Turn discovery into a Working List, a stronger brief, a profile contribution, or a thoughtful introduction."
  }
];

export default function AboutPage() {
  return (
    <PublicPageShell
      eyebrow="About True North Map"
      title={brandCopy.founderThesis}
      description="True North Map is an independent project created to make Canada’s defence and dual-use capability easier to find, understand and bring into the right conversation."
      backHref="/"
      backLabel="Home"
      actions={
        <Link href="/map" className="atlas-primary-button h-11 px-5 text-sm no-underline hover:no-underline">
          Explore the map <ArrowRight className="size-4" />
        </Link>
      }
    >
      <section className="relative mt-8 overflow-hidden rounded-[18px] bg-white shadow-[var(--atlas-shadow-soft)]">
        <div className="relative aspect-[16/9] min-h-[220px] sm:aspect-[2/1] lg:aspect-[16/7]">
          <Image
            src="/imagery/about-canada-defence-network.jpg"
            alt="Illustration of a fighter aircraft and drone network above a connected map of Canada."
            fill
            priority
            sizes="(min-width: 1280px) 1200px, 100vw"
            className="object-cover object-[68%_center] sm:object-center"
          />
        </div>
        <div className="p-5 sm:absolute sm:inset-y-6 sm:left-6 sm:flex sm:w-[48%] sm:items-center sm:p-0 lg:inset-y-8 lg:left-8 lg:w-[44%]">
          <div className="rounded-2xl border border-white/70 bg-[rgba(250,250,248,0.94)] p-6 shadow-[var(--atlas-shadow-soft)] backdrop-blur-sm sm:p-7 lg:p-8">
            <div className="border-l-4 border-[var(--atlas-signal)] pl-4 sm:pl-5">
              <p className="atlas-eyebrow">Why I built this</p>
              <h2 className="mt-4 max-w-3xl text-3xl font-extrabold leading-[1.05] tracking-[-0.05em] text-[var(--atlas-ink)] sm:text-[34px] lg:text-[40px]">{brandCopy.headline}</h2>
            </div>
            <p className="mt-6 text-sm leading-7 text-[var(--atlas-ink-soft)] sm:text-[15px]">
              I did not start True North Map because Canada lacked capability. I started it because remarkable capability was too often scattered across regions, programs, companies, and conversations that did not yet connect.
            </p>
            <p className="mt-5 text-sm font-bold leading-6 text-[var(--atlas-primary)]">
              The opportunity is to make what Canada can do easier to find, easier to understand, and easier to bring together.
            </p>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--atlas-muted)]">Created by Andrew Davies, a veteran and former Combat Systems Engineering Officer.</p>
          </div>
        </div>
      </section>

      <section className="mt-16 sm:mt-20">
        <div className="max-w-3xl">
          <p className="atlas-eyebrow">The path here</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-[var(--atlas-ink)] sm:text-4xl">A personal calling met a national opportunity.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--atlas-muted)] sm:text-base">The project grew from service, experience, and a close view of the people choosing to answer Canada&apos;s defence and sovereign industry ambitions.</p>
        </div>

        <div className="mt-9 divide-y divide-[var(--atlas-border)] border-y border-[var(--atlas-border)]">
          {story.map((item) => (
            <article key={item.number} className="grid gap-5 py-8 sm:grid-cols-[72px_0.72fr_1.28fr] sm:gap-8 sm:py-10 lg:grid-cols-[90px_0.72fr_1.28fr] lg:gap-12">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] text-sm font-extrabold text-[var(--atlas-primary)]">
                {item.number}
              </div>
              <div>
                <item.icon className="size-5 text-[var(--atlas-primary)]" />
                <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--atlas-muted)]">{item.eyebrow}</p>
                <h3 className="mt-2 text-xl font-extrabold leading-tight tracking-[-0.035em] text-[var(--atlas-ink)] sm:text-2xl">{item.title}</h3>
              </div>
              <p className="text-sm leading-7 text-[var(--atlas-muted)] sm:text-base sm:leading-8">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative mt-16 overflow-hidden rounded-[18px] bg-[var(--atlas-ink)] px-6 py-10 text-white sm:mt-20 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
              <Waves className="size-6 text-[var(--atlas-signal)]" />
            </div>
            <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--atlas-signal)]">The North Star</p>
            <h2 className="mt-3 max-w-4xl text-3xl font-extrabold leading-[1.08] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
              Map what Canada can build. Connect the people ready to build it. Help the whole ecosystem move together.
            </h2>
          </div>
          <div className="border-t border-white/15 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="text-sm leading-7 text-white/70 sm:text-base">
              No single company, program, region, or person can meet the scale of the challenge alone. Shared visibility helps us combine strengths, expose gaps, and act with greater purpose.
            </p>
            <p className="mt-5 text-base font-bold leading-7 text-white">
              Rising tides lift all boats. Canada moves further when the people ready to contribute can find one another.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-16 sm:mt-20">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-14">
          <div>
            <p className="atlas-eyebrow">What this makes possible</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-[var(--atlas-ink)] sm:text-4xl">From scattered knowledge to shared momentum.</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--atlas-muted)] sm:text-base">True North Map is not valuable because it contains records. It is valuable when someone sees an opportunity sooner, finds a stronger partner, or brings the right Canadian capability into the room.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {outcomes.map((outcome) => (
              <article key={outcome.eyebrow} className="group rounded-[18px] bg-white p-6 shadow-[var(--atlas-shadow-soft)]">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--atlas-signal-soft)] text-[var(--atlas-primary)]">
                  <outcome.icon className="size-5" />
                </div>
                <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--atlas-primary)]">{outcome.eyebrow}</p>
                <h3 className="mt-2 text-xl font-extrabold tracking-[-0.035em] text-[var(--atlas-ink)]">{outcome.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--atlas-muted)]">{outcome.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-16 grid overflow-hidden rounded-[18px] bg-white shadow-[var(--atlas-shadow-soft)] sm:mt-20 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="bg-[var(--atlas-signal-soft)] p-7 sm:p-9 lg:p-11">
          <Network className="size-7 text-[var(--atlas-primary)]" />
          <p className="mt-8 atlas-eyebrow">My contribution</p>
          <h2 className="mt-3 text-2xl font-extrabold leading-tight tracking-[-0.04em] text-[var(--atlas-ink)] sm:text-3xl">Create the shared picture and help turn discovery into the right conversation.</h2>
        </div>
        <div className="p-7 sm:p-9 lg:p-11">
          <p className="text-base leading-8 text-[var(--atlas-ink-soft)]">This is a long-term project. The map will never become useful by pretending every gap is filled or every possible fit is certain. It becomes useful through reviewed evidence, honest limits, contributions from the ecosystem, and a steady commitment to making Canadian capability easier to see.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/map" className="atlas-primary-button h-11 px-5 text-sm no-underline hover:no-underline">Explore the map <ArrowRight className="size-4" /></Link>
            <Link href="/submit" className="atlas-secondary-button h-11 px-5 text-sm no-underline hover:no-underline">Add what Canada is building</Link>
            <a href="mailto:andrew@truenorthmap.ca" className="atlas-secondary-button h-11 px-5 text-sm no-underline hover:no-underline">Contact Andrew</a>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[18px] bg-[var(--atlas-surface-muted)] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-[var(--atlas-primary)] shadow-[var(--atlas-shadow-soft)]">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-[var(--atlas-ink)]">Independent, public-source, and built to improve.</p>
            <p className="mt-2 max-w-4xl text-xs leading-6 text-[var(--atlas-muted)] sm:text-sm">True North Map is not an official government, military, procurement, or industry-association directory. Profiles and assessments use reviewed public evidence. They do not indicate eligibility, endorsement, classified demand, or a formal opportunity.</p>
          </div>
          <div className="flex flex-wrap gap-4"><Link href="/how-it-works" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--atlas-primary)] underline">See how it works <ArrowRight className="size-4" /></Link><Link href="/methodology" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--atlas-primary)] underline">See how review works <ArrowRight className="size-4" /></Link></div>
        </div>
      </section>
    </PublicPageShell>
  );
}
