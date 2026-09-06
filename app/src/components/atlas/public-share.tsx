"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Check, Copy, Linkedin, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { trackBetaEvent } from "@/lib/product-insights/client";
import { siteUrl } from "@/lib/site";

type ShareMethod = "native" | "linkedin" | "x" | "copy";

export function PublicShare({
  title,
  description,
  path,
  useCurrentUrl = false,
  className = ""
}: {
  title: string;
  description?: string;
  path?: string;
  useCurrentUrl?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator.share === "function");
  }, []);

  const shareUrl = () => {
    if (useCurrentUrl && typeof window !== "undefined") return window.location.href;
    return new URL(path ?? "/", siteUrl).toString();
  };

  const record = (method: ShareMethod) => trackBetaEvent("share", { method, content_title: title.slice(0, 120) });

  const nativeShare = async () => {
    const share = (navigator as Navigator & { share?: (data?: ShareData) => Promise<void> }).share;
    if (!share) return false;
    try {
      await share.call(navigator, { title, text: description, url: shareUrl() });
      record("native");
      setOpen(false);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return true;
      return false;
    }
  };

  const copy = async () => {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    record("copy");
    window.setTimeout(() => setCopied(false), 2_000);
  };

  const openWindow = (method: "linkedin" | "x") => {
    const url = shareUrl();
    const destination = method === "linkedin"
      ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
      : `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    window.open(destination, "tnm-share", "popup,width=720,height=640,noopener,noreferrer");
    record(method);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={`atlas-secondary-button h-10 gap-2 px-4 text-xs ${className}`}>
          <Share2 className="size-4" aria-hidden="true" /> Share
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1350] bg-[var(--atlas-ink)]/45 backdrop-blur-[2px]" />
        <Dialog.Content aria-describedby="share-description" className="fixed bottom-0 left-1/2 z-[1351] w-full -translate-x-1/2 rounded-t-[8px] bg-white p-5 shadow-[var(--atlas-shadow-float)] outline-none sm:bottom-auto sm:top-1/2 sm:max-w-md sm:-translate-y-1/2 sm:rounded-[8px] sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]"><Share2 className="size-5" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1"><p className="atlas-eyebrow">Share this page</p><Dialog.Title className="mt-1 text-xl font-extrabold tracking-[-0.03em] text-[var(--atlas-ink)]">Help someone find the evidence.</Dialog.Title></div>
            <Dialog.Close asChild><button type="button" aria-label="Close share options" className="flex size-11 items-center justify-center rounded-[4px] text-[var(--atlas-muted)] hover:bg-[var(--atlas-surface-muted)]"><X className="size-4" /></button></Dialog.Close>
          </div>
          <Dialog.Description id="share-description" className="mt-3 text-sm leading-6 text-[var(--atlas-muted)]">Share the current page and its public sources with your network.</Dialog.Description>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => openWindow("linkedin")} className="atlas-secondary-button h-12 gap-2 px-4 text-xs"><Linkedin className="size-4" />LinkedIn</button>
            <button type="button" onClick={() => openWindow("x")} className="atlas-secondary-button h-12 gap-2 px-4 text-xs"><span className="text-sm font-extrabold">X</span>Post</button>
            <button type="button" onClick={copy} className="atlas-secondary-button h-12 gap-2 px-4 text-xs">{copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? "Copied" : "Copy link"}</button>
            {canNativeShare ? <button type="button" onClick={() => void nativeShare()} className="atlas-secondary-button h-12 gap-2 px-4 text-xs"><Share2 className="size-4" />More options</button> : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
