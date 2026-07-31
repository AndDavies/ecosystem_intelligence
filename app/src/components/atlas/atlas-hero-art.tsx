import Image from "next/image";
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
  imageSrc,
  imagePosition = "center",
  imageFit = "cover",
  showLabel = true,
  priority = false,
  compact = false,
  className = ""
}: {
  tone: AtlasHeroTone;
  icon: LucideIcon;
  eyebrow: string;
  label: string;
  alt: string;
  imageSrc?: string;
  imagePosition?: string;
  imageFit?: "cover" | "contain";
  showLabel?: boolean;
  priority?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const art = (
    <>
      {imageSrc ? (
        <>
          <Image
            src={imageSrc}
            alt={alt}
            fill
            priority={priority}
            sizes={compact ? "(min-width: 1280px) 30vw, (min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 52vw, 100vw"}
            className={imageFit === "contain" ? "object-contain" : "object-cover"}
            style={{ objectPosition: imagePosition }}
          />
          {imageFit === "cover" ? <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-black/10" aria-hidden="true" /> : null}
        </>
      ) : (
        <>
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:40px_40px]" />
          <div className="absolute -right-[8%] top-[9%] size-[78%] rounded-full border border-white/15" />
          <div className="absolute -right-[2%] top-[22%] size-[52%] rounded-full border border-white/15" />
          <div className="absolute bottom-[19%] left-[8%] h-px w-[72%] rotate-[-9deg] bg-gradient-to-r from-transparent via-[var(--atlas-signal)] to-transparent opacity-80" />
          <div className="absolute bottom-[23%] left-[26%] size-2.5 rounded-full bg-[var(--atlas-signal)] shadow-[0_0_24px_rgba(245,233,0,.9)]" />
        </>
      )}
      {showLabel ? (
        <div className={`absolute inset-0 flex ${compact ? "items-end p-4 sm:p-5" : "items-center justify-center p-6 sm:p-8"}`}>
          <div className={`flex items-center gap-3.5 rounded-[1.4rem] border border-white/20 bg-[rgba(24,28,27,.76)] text-white backdrop-blur-sm ${compact ? "p-3.5" : "px-6 py-5"}`}>
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--atlas-signal)] text-[var(--atlas-ink)]">
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/65">{eyebrow}</p>
              <p className="mt-1 truncate text-sm font-bold tracking-[-0.01em]">{label}</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  const background = imageSrc && imageFit === "contain" ? "bg-[#f6f5f1]" : `bg-gradient-to-br ${toneClass[tone]}`;
  const classNames = `pointer-events-none relative isolate w-full min-w-0 overflow-hidden ${background} ${compact ? "aspect-[16/9]" : "aspect-[16/7] min-h-[220px]"} ${className}`;

  if (imageSrc) {
    return <div className={classNames}>{art}</div>;
  }

  return (
    <div role="img" aria-label={alt} className={classNames}>
      {art}
    </div>
  );
}
