"use client";

import { useEffect, useState } from "react";

type NavigationItem = { id: string; label: string; position: number };

export function SignalArticleNavigation({ items, label, compact = false }: { items: NavigationItem[]; label: string; compact?: boolean }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (!items.length) return;
    const fromHash = window.location.hash.slice(1);
    if (items.some((item) => item.id === fromHash)) setActiveId(fromHash);
    const sections = items.map((item) => document.getElementById(item.id)).filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible?.target.id) setActiveId(visible.target.id);
    }, { rootMargin: "-112px 0px -62% 0px", threshold: [0, 0.1, 0.5] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  const focusSection = (id: string) => {
    setActiveId(id);
    window.setTimeout(() => document.getElementById(id)?.focus({ preventScroll: true }), 0);
  };

  return <nav aria-label={label}>
    <h2 className="font-heading text-lg font-extrabold tracking-[-0.02em] text-[var(--atlas-ink)]">{label}</h2>
    <ol className={`${compact ? "mt-4" : "mt-5"} space-y-1`}>
      {items.map((item) => {
        const active = item.id === activeId;
        return <li key={item.id}>
          <a href={`#${item.id}`} aria-current={active ? "location" : undefined} onClick={() => focusSection(item.id)} className={`flex min-h-11 items-start gap-3 rounded-xl py-2 pl-3 pr-2 text-sm leading-5 no-underline transition-colors hover:no-underline ${active ? "bg-white font-bold text-[var(--atlas-ink)]" : "text-[var(--atlas-muted)] hover:bg-white/70 hover:text-[var(--atlas-primary)]"}`}>
            <span className="shrink-0 font-heading font-extrabold text-[var(--atlas-primary)]">{String(item.position).padStart(2, "0")}</span>
            <span>{item.label}</span>
          </a>
        </li>;
      })}
    </ol>
  </nav>;
}
