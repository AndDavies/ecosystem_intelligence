import Image from "next/image";
import { Factory, Lightbulb, RadioTower, Ship, Snowflake, Target } from "lucide-react";
import type { DefenceBriefPresentation } from "@/lib/atlas/brief-presentation";

const iconByTone = {
  arctic: Snowflake,
  industrial: Factory,
  innovation: Lightbulb,
  maritime: Ship,
  demand: Target,
  general: RadioTower
};

const toneClass = {
  arctic: "from-[#202827] via-[#3a4947] to-[#84918d]",
  industrial: "from-[#222625] via-[#3c413e] to-[#696e68]",
  innovation: "from-[#202827] via-[#313b35] to-[#576d61]",
  maritime: "from-[#1f2728] via-[#344246] to-[#667a80]",
  demand: "from-[#232726] via-[#373b38] to-[#62655f]",
  general: "from-[#242827] via-[#383d3a] to-[#6f746f]"
};

export function BriefHero({
  presentation,
  title,
  priority = false,
  compact = false,
  className = ""
}: {
  presentation: DefenceBriefPresentation;
  title: string;
  priority?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const Icon = iconByTone[presentation.tone];
  const imageSrc = compact ? presentation.cardImageSrc ?? presentation.imageSrc : presentation.imageSrc;
  const imageAlt = compact ? presentation.cardImageAlt ?? presentation.imageAlt : presentation.imageAlt;

  if (imageSrc) {
    return (
      <div className={`pointer-events-none relative overflow-hidden bg-[var(--atlas-ink)] ${compact ? "aspect-[16/9]" : "aspect-[16/7] min-h-[250px]"} ${className}`}>
        <Image src={imageSrc} alt={imageAlt ?? ""} fill priority={priority} sizes={compact ? "(min-width: 1024px) 34vw, 100vw" : "(min-width: 1280px) 1200px, 100vw"} className="object-cover" />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`Editorial artwork for ${title}`}
      className={`pointer-events-none relative isolate overflow-hidden bg-gradient-to-br ${toneClass[presentation.tone]} ${compact ? "aspect-[16/9]" : "aspect-[16/7] min-h-[250px]"} ${className}`}
    >
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className="absolute -right-[8%] top-[9%] size-[78%] rounded-full border border-white/15" />
      <div className="absolute -right-[2%] top-[22%] size-[52%] rounded-full border border-white/15" />
      <div className="absolute bottom-[19%] left-[8%] h-px w-[72%] rotate-[-9deg] bg-gradient-to-r from-transparent via-[var(--atlas-signal)] to-transparent opacity-80" />
      <div className="absolute bottom-[23%] left-[26%] size-2.5 rounded-full bg-[var(--atlas-signal)] shadow-[0_0_24px_rgba(245,233,0,.9)]" />
      <div className={`absolute inset-0 flex ${compact ? "items-end p-5" : "items-center justify-center p-8"}`}>
        <div className={`flex items-center gap-4 rounded-[1.4rem] border border-white/20 bg-black/15 text-white backdrop-blur-sm ${compact ? "p-4" : "px-6 py-5"}`}>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--atlas-signal)] text-[var(--atlas-ink)]">
            <Icon className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/65">True North Map Brief</p>
            <p className="mt-1 text-sm font-bold tracking-[-0.01em]">{presentation.topic}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
