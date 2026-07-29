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
        className={`whitespace-nowrap font-extrabold uppercase leading-none tracking-[0.045em] ${compact ? "text-[10px]" : "text-[12px]"} ${inverse ? "text-white" : "text-[var(--atlas-ink)]"}`}
        aria-hidden="true"
      >
        True North Map
      </span>
      <span className="sr-only">True North Map</span>
    </span>
  );
}
