import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Deterministic two-letter monogram for organizations without a published
 * logo. The same name always yields the same mark: the first letters of the
 * first two words, or the first two characters of a single-word name.
 */
export function organizationMonogram(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean);
  if (!words.length) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

/**
 * Resolves the best available logo URL from either a compact explorer
 * projection (logoUrl) or a full published organization record (logo).
 */
export function organizationLogoSource(organization: {
  logoUrl?: string | null;
  logo?: { publicUrl: string } | null;
}): string | null {
  return organization.logoUrl ?? organization.logo?.publicUrl ?? null;
}

const markSizes = {
  xs: { box: "size-8", text: "text-[11px]", sizes: "32px", padding: "p-1" },
  sm: { box: "size-10", text: "text-xs", sizes: "40px", padding: "p-1" },
  md: { box: "size-14", text: "text-base", sizes: "56px", padding: "p-2" }
} as const;

/**
 * Shared organization identity mark: the published logo when one exists,
 * otherwise a stable monogram. Fixed square dimensions on both branches so
 * result lists never shift while logos lazy-load. The mark is always
 * accompanied by the visible organization name, so the monogram itself stays
 * decorative for assistive technology.
 */
export function OrganizationIdentityMark({
  name,
  logoUrl,
  size = "sm",
  alt,
  className
}: {
  name: string;
  logoUrl?: string | null;
  size?: keyof typeof markSizes;
  alt?: string;
  className?: string;
}) {
  const spec = markSizes[size];
  if (logoUrl) {
    return (
      <span className={cn("relative flex shrink-0 items-center justify-center overflow-hidden bg-transparent", spec.box, className)}>
        <Image src={logoUrl} alt={alt ?? `${name} logo`} fill sizes={spec.sizes} className={cn("object-contain", spec.padding)} />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 select-none items-center justify-center bg-[var(--atlas-surface-muted)] font-[family-name:var(--font-barlow)] font-extrabold tracking-[0.02em] text-[var(--atlas-ink-soft)]",
        spec.box,
        spec.text,
        className
      )}
    >
      {organizationMonogram(name)}
    </span>
  );
}
