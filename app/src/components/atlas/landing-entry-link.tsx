"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useEffect } from "react";

export type LandingEntryPath = "need" | "public_need" | "mission" | "map" | "example" | "brief" | "signals" | "north_signal";

export function recordLandingEntry(entryPath: LandingEntryPath) {
  window.dispatchEvent(new CustomEvent("tnm:landing-entry", { detail: { entryPath } }));
}

export function LandingEntryLink({ entryPath, onClick, ...props }: ComponentProps<typeof Link> & { entryPath: LandingEntryPath }) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        recordLandingEntry(entryPath);
        onClick?.(event);
      }}
    />
  );
}

export function LandingHashBridge() {
  useEffect(() => {
    if (window.location.hash !== "#ask-true-north") return;
    const params = new URLSearchParams(window.location.search);
    params.set("start", "need");
    window.location.replace(`/map?${params.toString()}#ask-true-north`);
  }, []);
  return null;
}

export function LandingNorthSignalAttribution({ children }: { children: React.ReactNode }) {
  return <div onFocusCapture={() => recordLandingEntry("north_signal")} onClickCapture={() => recordLandingEntry("north_signal")}>{children}</div>;
}
