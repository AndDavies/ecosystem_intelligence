import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, ShieldAlert } from "lucide-react";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { getAtlasSnapshot } from "@/lib/atlas/repository";

export const metadata: Metadata = {
  title: "Public Demand Signals",
  description: "Review public NATO demand statements, mapped capabilities, evidence, and explicit coverage gaps."
};

export default async function DemandIndexPage() {
  const snapshot = await getAtlasSnapshot();

  return (
    <PublicPageShell
      eyebrow="Demand overlays"
      title="Public demand signals"
      description="Public problem statements are separated from procurement opportunities. Capability matches appear only after evidence and editorial review."
    >
      <div className="mb-5 flex items-start gap-3 rounded-lg border border-[#fedf89] bg-[#fffaeb] px-4 py-3 text-xs leading-5 text-[#7a2e0e]">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        <p>NATO mappings are public-source alignment only. They are not procurement eligibility, endorsement, classified demand, or a formal opportunity.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {snapshot.demandRequirements.map((demand) => (
          <PublicCard key={demand.id} className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-4">
              <span className="flex size-10 items-center justify-center rounded-md bg-[#eaf2ff] text-[#0756d9]"><FileText className="size-5" /></span>
              <span className="rounded bg-[#f2f4f7] px-2 py-1 text-[10px] font-semibold text-[#475467]">{demand.matches.length} reviewed matches</span>
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#667085]">Problem family {String(demand.displayOrder).padStart(2, "0")}</p>
            <h2 className="mt-1 text-lg font-bold tracking-[-0.02em] text-[#101828]">{demand.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[#475467]">{demand.problemStatement}</p>
            <div className="mt-auto pt-5">
              <Link href={`/demand/${demand.slug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[#0756d9] no-underline hover:underline">Open demand page <ArrowRight className="size-3.5" /></Link>
            </div>
          </PublicCard>
        ))}
      </div>
    </PublicPageShell>
  );
}
