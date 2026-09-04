import { siteName } from "@/lib/site";

export const searchTitleMaximumLength = 70;
export const searchTitleSuffix = ` | ${siteName}`;

function compact(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncateAtWord(value: string, maximumLength: number) {
  if (value.length <= maximumLength) return value;
  if (maximumLength <= 1) return value.slice(0, maximumLength);
  const clipped = value.slice(0, maximumLength - 1);
  const boundary = clipped.lastIndexOf(" ");
  const stem = boundary >= Math.floor(maximumLength * 0.6) ? clipped.slice(0, boundary) : clipped;
  return `${stem.replace(/[\s—–,:;.!?-]+$/, "")}…`;
}

export function boundedMetadataTitle(subject: string, descriptors: Array<string | null | undefined>) {
  const cleanSubject = compact(subject);
  const maximumPageTitleLength = searchTitleMaximumLength - searchTitleSuffix.length;
  const cleanDescriptors = [...new Set(descriptors.map((value) => value ? compact(value) : "").filter(Boolean))];

  for (const descriptor of cleanDescriptors) {
    const candidate = `${cleanSubject} — ${descriptor}`;
    if (candidate.length <= maximumPageTitleLength) return candidate;
  }

  return truncateAtWord(cleanSubject, maximumPageTitleLength);
}
