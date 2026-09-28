"use client";

import { useEffect, useRef, useState } from "react";
import type { DossierSection } from "@/lib/atlas/dossier-presentation";
import styles from "./dossier-section-navigator.module.css";

export function DossierSectionNavigator({ sections }: { sections: DossierSection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    const frame = nav?.closest<HTMLElement>(".atlas-shell-content");
    const header = document.querySelector<HTMLElement>(".atlas-header");
    const measure = () => {
      if (header && frame) frame.style.setProperty("--dossier-header-height", `${header.getBoundingClientRect().height}px`);
      if (nav && frame) frame.style.setProperty("--dossier-anchor-offset", `${(header?.getBoundingClientRect().height ?? 78) + nav.getBoundingClientRect().height + 16}px`);
    };
    measure();
    const resize = new ResizeObserver(measure);
    if (header) resize.observe(header);
    if (nav) resize.observe(nav);
    const revealHash = () => {
      let id: string;
      try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      const target = document.getElementById(id);
      if (!target) return;
      // Claim anchors remain reachable inside both levels of source disclosure.
      let parent: HTMLElement | null = target.parentElement;
      while (parent) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
        parent = parent.parentElement;
      }
      if (sections.some(section => section.id === id)) setActiveId(id);
      if (id) window.requestAnimationFrame(() => {
        target.scrollIntoView({ block: "start" });
        target.focus({ preventScroll: true });
      });
    };
    revealHash();
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible?.target.id) setActiveId(visible.target.id);
    }, { rootMargin: "-144px 0px -60% 0px", threshold: [0, 0.1] });
    sections.forEach(section => { const target = document.getElementById(section.id); if (target) observer.observe(target); });
    // Above the reading sections none may intersect the observer's reading band.
    // Returning to the opening must not retain a lower section's old highlight.
    const resetAtOpening = () => {
      const first = document.getElementById(sections[0]?.id ?? "");
      const offset = (header?.getBoundingClientRect().height ?? 78) + (nav?.getBoundingClientRect().height ?? 0) + 16;
      if (first && first.getBoundingClientRect().top > offset) setActiveId(sections[0].id);
    };
    window.addEventListener("scroll", resetAtOpening, { passive: true });
    window.addEventListener("hashchange", revealHash);
    window.addEventListener("popstate", revealHash);
    return () => { resize.disconnect(); observer.disconnect(); window.removeEventListener("scroll", resetAtOpening); window.removeEventListener("hashchange", revealHash); window.removeEventListener("popstate", revealHash); };
  }, [sections]);

  if (!sections.length) return null;
  return <nav ref={navRef} aria-label="On this page" className={styles.navigation}>
    <div className={styles.scroller}>
      <p className={styles.label}>On this page</p>
      <ul>{sections.map(section => <li key={section.id}><a href={`#${section.id}`} aria-current={activeId === section.id ? "location" : undefined} data-profile-action="section_nav" data-profile-target-id={section.id} data-profile-target-type="section" data-profile-section="navigator" onClick={() => setActiveId(section.id)}>{section.label}</a></li>)}</ul>
    </div>
  </nav>;
}
