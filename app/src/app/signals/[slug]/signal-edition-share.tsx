"use client";

import { Linkedin, Twitter } from "lucide-react";
import { trackBetaEvent } from "@/lib/product-insights/client";
import { siteUrl } from "@/lib/site";

export function SignalEditionShare({ title, path }: { title: string; path: string }) {
  const openShare = (method: "linkedin" | "x") => {
    const url = new URL(path, siteUrl).toString();
    const shareText = `A signal worth watching from True North Map: ${title}`;
    const destination = method === "linkedin"
      ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
      : `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`;
    window.open(destination, "tnm-signal-share", "popup,width=720,height=640,noopener,noreferrer");
    trackBetaEvent("share", { method, content_title: title.slice(0, 120) });
  };

  return <div className="flex flex-wrap items-center gap-2" aria-label="Share this signal">
    <span className="w-full text-sm font-semibold text-[var(--atlas-muted)] sm:mr-1 sm:w-auto">Share this signal</span>
    <button type="button" onClick={() => openShare("linkedin")} className="atlas-pill atlas-pill-blue min-h-11 gap-2 px-4 text-sm font-bold">
      <Linkedin className="size-4" aria-hidden="true" /> LinkedIn
    </button>
    <button type="button" onClick={() => openShare("x")} className="atlas-pill atlas-pill-muted min-h-11 gap-2 px-4 text-sm font-bold hover:bg-[var(--atlas-ink)] hover:text-white">
      <Twitter className="size-4" aria-hidden="true" /> X
    </button>
  </div>;
}
