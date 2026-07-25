import type { LucideIcon } from "lucide-react";

export type AtlasHeroTone = "arctic" | "industrial" | "innovation" | "maritime" | "demand" | "general";

const toneClass: Record<AtlasHeroTone, string> = {
  arctic: "from-[#202827] via-[#3a4947] to-[#84918d]",
  industrial: "from-[#222625] via-[#3c413e] to-[#696e68]",
  innovation: "from-[#202827] via-[#313b35] to-[#576d61]",
  maritime: "from-[#1f2728] via-[#344246] to-[#667a80]",
  demand: "from-[#232726] via-[#373b38] to-[#62655f]",
  general: "from-[#242827] via-[#383d3a] to-[#6f746f]"
};

export function AtlasHeroArt({
  tone,
  icon: Icon,
  eyebrow,
  label,
  alt,
  compact = false,
  className = ""
}: {
  tone: AtlasHeroTone;
  icon: LucideIcon;
  eyebrow: string;
  label: string;
  alt: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`pointer-events-none relative isolate w-full min-w-0 overflow-hidden bg-gradient-to-br ${toneClass[tone]} ${compact ? "aspect-[16/9]" : "aspect-[16/7] min-h-[220px]"} ${className}`}
    >
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className="absolute -right-[8%] top-[9%] size-[78%] rounded-full border border-white/15" />
      <div className="absolute -right-[2%] top-[22%] size-[52%] rounded-full border border-white/15" />
      <div className="absolute bottom-[19%] left-[8%] h-px w-[72%] rotate-[-9deg] bg-gradient-to-r from-transparent via-[var(--atlas-signal)] to-transparent opacity-80" />
      <div className="absolute bottom-[23%] left-[26%] size-2.5 rounded-full bg-[var(--atlas-signal)] shadow-[0_0_24px_rgba(245,233,0,.9)]" />
      <div className={`absolute inset-0 flex ${compact ? "items-end p-4 sm:p-5" : "items-center justify-center p-6 sm:p-8"}`}>
        <div className={`flex items-center gap-3.5 rounded-[1.4rem] border border-white/20 bg-black/15 text-white backdrop-blur-sm ${compact ? "p-3.5" : "px-6 py-5"}`}>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--atlas-signal)] text-[var(--atlas-ink)]">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/65">{eyebrow}</p>
            <p className="mt-1 truncate text-sm font-bold tracking-[-0.01em]">{label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
