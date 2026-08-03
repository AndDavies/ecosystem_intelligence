import { ExternalLink } from "lucide-react";
import type { SignalEdition } from "@/lib/atlas/signals";

export function SignalHeroImage({ image, priority = false, className = "" }: { image: NonNullable<SignalEdition["heroImage"]>; priority?: boolean; className?: string }) {
  return <figure className={`relative overflow-hidden bg-[var(--atlas-ink)] ${className}`}>
    {/* Production images are normalized into the existing public media bucket. The raw URL path is retained only for a local editorial preview before publication. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={image.url} alt={image.alt} width={1600} height={900} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover" />
    <figcaption className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 p-3 text-[10px] font-semibold text-white/85">
      <span className="rounded-full bg-black/65 px-3 py-1.5 backdrop-blur-sm">{image.attribution}</span>
      <a href={image.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-black/65 px-3 py-1.5 text-white/85 no-underline backdrop-blur-sm hover:bg-black/80 hover:text-white hover:underline">Image source <ExternalLink className="size-3" /></a>
    </figcaption>
  </figure>;
}
