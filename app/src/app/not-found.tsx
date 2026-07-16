import Link from "next/link";
import { SearchX } from "lucide-react";
import { PublicAtlasHeader } from "@/components/atlas/public-atlas-header";

export default function NotFound() {
  return (
    <main className="atlas-page min-h-screen bg-[#eef7f8] text-[#101828]">
      <PublicAtlasHeader />
      <div className="atlas-frame flex min-h-[62vh] items-center justify-center py-12">
        <section className="w-full max-w-xl rounded-xl border border-[#c9dce0] bg-white p-8 text-center shadow-[0_18px_50px_rgba(5,5,43,0.08)]">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#e7f8fa] text-[#007f98]"><SearchX className="size-6" /></span>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#007f98]">Preview route not found</p>
          <h1 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#05052b]">This page is not part of the current preview.</h1>
          <p className="mt-3 text-sm leading-6 text-[#667085]">Return to the atlas to explore the published organizations, capabilities, and public evidence.</p>
          <Link href="/" className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#007f98] px-5 text-sm font-semibold text-white no-underline hover:bg-[#00677d] hover:no-underline">Return to atlas</Link>
        </section>
      </div>
    </main>
  );
}

