import Image from "next/image";
import { ExternalLink } from "lucide-react";
import type { SignalVisual as Visual } from "@/lib/signals/visuals";

/** The brand mark is an intentional editorial cover when no sourced image exists. */
export function SignalVisual({ visual, priority = false, compact = false }: { visual?: Visual | null; priority?: boolean; compact?: boolean }) {
  if (!visual) return <figure className="atlas-signal-brand-visual" aria-label="Defence Signals editorial cover">
    <Image src="/brand/north-signal-mark-light.svg" alt="True North Map" width={168} height={168} priority={priority} />
    <figcaption><strong>Defence Signals</strong><span>Canadian defence · News and analysis</span></figcaption>
  </figure>;
  return <figure className={`atlas-signal-visual ${visual.kind === "logo" ? "atlas-signal-visual-logo" : ""} ${compact ? "atlas-signal-visual-compact" : ""}`}>
    <div className="atlas-signal-visual-image"><Image src={visual.url} alt={visual.alt} fill priority={priority} sizes={compact ? "160px" : "(min-width: 1024px) 600px, 100vw"} className="object-contain" /></div>
    <figcaption><span>{visual.attribution}</span> <a href={visual.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">Image source <ExternalLink className="inline size-3.5" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>{visual.context ? <span className="block mt-1">{visual.context}</span> : null}</figcaption>
  </figure>;
}
