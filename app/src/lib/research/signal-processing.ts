import { createHash } from "node:crypto";

const trackingParameters = new Set([
  "fbclid", "gclid", "mc_cid", "mc_eid", "ref", "source"
]);

export function canonicalizeSignalUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith("utm_") || trackingParameters.has(key)) url.searchParams.delete(key);
  }
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  url.pathname = url.pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
  url.searchParams.sort();
  return url.toString();
}

function normalized(value: string | null | undefined) {
  return (value ?? "").normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function signalFingerprint(input: {
  organization?: string | null;
  technology?: string | null;
  program?: string | null;
  issuer?: string | null;
  eventDate?: string | null;
  signalType: string;
  canonicalUrls?: string[];
}) {
  const canonicalUrls = (input.canonicalUrls ?? []).map(canonicalizeSignalUrl).sort();
  const stableEvent = [
    normalized(input.organization),
    normalized(input.technology),
    normalized(input.program),
    normalized(input.issuer),
    input.eventDate ?? "",
    normalized(input.signalType),
    canonicalUrls.join("|")
  ].join("::");
  return createHash("sha256").update(stableEvent).digest("hex");
}

export type CompositeSignalStory = {
  headline: string;
  body: string;
  links: string[];
};

export function splitCompositeSignalText(input: string): CompositeSignalStory[] {
  return input
    .split(/\n(?=(?:#{1,3}\s+|[A-Z][^\n]{8,120}\n[-=]{3,}))/g)
    .map((section) => section.trim())
    .filter((section) => section.length >= 30)
    .map((section) => {
      const [headline = "Untitled signal", ...bodyLines] = section.split(/\r?\n/);
      const links = [...section.matchAll(/https:\/\/[^\s)\]>]+/g)].map((match) => match[0]);
      return { headline: headline.replace(/^#{1,3}\s+/, "").trim(), body: bodyLines.join("\n").trim(), links };
    });
}

export function consolidateSignals<T extends { fingerprint: string }>(signals: T[]) {
  const grouped = new Map<string, T[]>();
  for (const signal of signals) grouped.set(signal.fingerprint, [...(grouped.get(signal.fingerprint) ?? []), signal]);
  return [...grouped.values()];
}
