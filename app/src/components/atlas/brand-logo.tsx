import Image from "next/image";

export function BrandLogo({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5" data-brand-logo>
      <Image
        src={inverse ? "/brand/north-signal-mark-light.svg" : "/brand/north-signal-mark.svg"}
        width={compact ? 32 : 40}
        height={compact ? 32 : 40}
        alt=""
        priority
        className="shrink-0"
      />
      <span
        className={`font-extrabold uppercase leading-[0.82] tracking-[0.065em] ${compact ? "text-[10px]" : "text-[12px]"} ${inverse ? "text-white" : "text-[var(--atlas-ink)]"}`}
        aria-hidden="true"
      >
        <span className="block">True North</span>
        <span className="mt-1 block">Map</span>
      </span>
      <span className="sr-only">True North Map</span>
    </span>
  );
}
