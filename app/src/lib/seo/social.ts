import { absoluteUrl } from "@/lib/site";

export function socialImageUrl({ title, eyebrow, detail, logoUrl, location }: { title: string; eyebrow: string; detail?: string | null; logoUrl?: string | null; location?: string | null }) {
  const params = new URLSearchParams({ title: title.slice(0, 120), eyebrow: eyebrow.slice(0, 60) });
  if (detail) params.set("detail", detail.slice(0, 140));
  if (logoUrl) params.set("logo", logoUrl.slice(0, 500));
  if (location) params.set("location", location.slice(0, 100));
  return absoluteUrl(`/api/og?${params.toString()}`);
}

export function socialMetadata({ title, description, path, eyebrow, detail, logoUrl, location }: { title: string; description: string; path: string; eyebrow: string; detail?: string | null; logoUrl?: string | null; location?: string | null }) {
  const image = socialImageUrl({ title, eyebrow, detail, logoUrl, location });
  return {
    openGraph: {
      title,
      description,
      url: path,
      siteName: "True North Map",
      locale: "en_CA",
      images: [{ url: image, width: 1200, height: 630, alt: `${title} on True North Map` }]
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [{ url: image, alt: `${title} on True North Map` }]
    }
  };
}
