"use client";

import NextLink from "next/link";
import React, { useEffect, useState, type ComponentProps } from "react";
import { isProfilePath, publicNavigationHref, safeMapReturn } from "@/lib/seo/navigation-urls";

const storageKey = "tnm-map-return-v1";
function remember(value: string) {
  try { sessionStorage.setItem(storageKey, safeMapReturn(value)); } catch { /* Navigation works without storage. */ }
}
function readReturn() {
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const legacy = fragment.get("tnm-return");
  if (legacy) {
    const value = safeMapReturn(legacy);
    remember(value);
    return value;
  }
  try { return safeMapReturn(sessionStorage.getItem(storageKey) ?? undefined); } catch { return "/map"; }
}

/** Every rendered public href is canonical, including links built by shared data helpers. */
export default function NavigationLink({ href, onClick, onPointerDown, onContextMenu, ...props }: ComponentProps<typeof NextLink>) {
  const raw = typeof href === "string" ? href : null;
  const normalized = raw ? publicNavigationHref(raw) : href;
  const [returnHref, setReturnHref] = useState<string | null>(null);
  useEffect(() => {
    if (normalized === "/map" && isProfilePath(window.location.pathname)) setReturnHref(readReturn());
  }, [normalized]);
  const preserveContext = () => {
    if (!raw) return;
    const destination = new URL(raw, window.location.origin);
    if (destination.origin !== window.location.origin || !isProfilePath(destination.pathname)) return;
    if (window.location.pathname === "/map") remember(`${window.location.pathname}${window.location.search}${window.location.hash}`);
    else if (isProfilePath(window.location.pathname)) readReturn();
    else if (destination.searchParams.has("returnTo")) remember(destination.searchParams.get("returnTo")!);
    else readReturn();
  };
  return <NextLink {...props} href={returnHref ?? normalized}
    onPointerDown={event => { preserveContext(); onPointerDown?.(event); }}
    onContextMenu={event => { preserveContext(); onContextMenu?.(event); }}
    onClick={event => {
      preserveContext(); onClick?.(event);
      if (!event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0 && props.target !== "_blank" && typeof normalized === "string" && normalized.startsWith("/map#") && window.location.pathname === "/map") {
        event.preventDefault(); window.location.assign(normalized);
      }
    }} />;
}
