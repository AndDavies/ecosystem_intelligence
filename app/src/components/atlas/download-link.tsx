"use client";

import React, { useEffect, useState, type ReactNode } from "react";

let pendingAuth: Promise<boolean> | undefined;
function signedIn() {
  if (!pendingAuth) {
    pendingAuth = fetch("/api/auth-state", { credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(5000) })
      .then(async (response) => response.ok && (await response.json()).signedIn === true)
      .catch(() => false)
      .finally(() => { pendingAuth = undefined; });
  }
  return pendingAuth;
}

/** A plain anchor never prefetches a generated file. Server authorization is final. */
export function DownloadLink({ href, children = "Download", className }: { href: string; children?: ReactNode; className?: string }) {
  const [authenticated, setAuthenticated] = useState(false);
  useEffect(() => {
    let active = true;
    const refresh = () => { void signedIn().then((value) => { if (active) setAuthenticated(value); }); };
    refresh();
    window.addEventListener("focus", refresh);
    return () => { active = false; window.removeEventListener("focus", refresh); };
  }, []);
  return <a href={authenticated ? href : `/sign-in?next=${encodeURIComponent(href)}`} className={className} data-export-download="true">
    {authenticated ? children : "Sign in to download"}
  </a>;
}
