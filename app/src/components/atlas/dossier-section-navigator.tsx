"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { DossierSection } from "@/lib/atlas/dossier-presentation";

export function DossierSectionNavigator({ sections }: { sections: DossierSection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const disclosureRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (!sections.length) return;

    const updateFromHash = () => {
      const hash = window.location.hash.slice(1);
      if (sections.some((section) => section.id === hash)) setActiveId(hash);
    };
    updateFromHash();

    const targets = sections
      .map((section) => document.getElementById(section.id))
      .filter((target): target is HTMLElement => Boolean(target));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];
      if (visible?.target.id) setActiveId(visible.target.id);
    }, { rootMargin: "-112px 0px -62% 0px", threshold: [0, 0.1, 0.5] });

    targets.forEach((target) => observer.observe(target));
    window.addEventListener("hashchange", updateFromHash);
    window.addEventListener("popstate", updateFromHash);
    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", updateFromHash);
      window.removeEventListener("popstate", updateFromHash);
    };
  }, [sections]);

  if (sections.length < 4) return null;

  const openSection = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    setActiveId(id);
    if (disclosureRef.current) disclosureRef.current.open = false;
    if (window.location.hash !== `#${id}`) window.history.pushState(null, "", `#${id}`);
    window.requestAnimationFrame(() => {
      target.scrollIntoView({ block: "start" });
      target.focus({ preventScroll: true });
    });
  };

  return (
    <nav aria-label="On this page" className="mt-6 w-full border-y border-[var(--atlas-border)] bg-white px-5 py-2 sm:mt-8 sm:px-8 lg:mt-9 lg:px-10">
      <details ref={disclosureRef} className="group lg:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-extrabold uppercase tracking-[0.08em] text-[var(--atlas-ink)] [&::-webkit-details-marker]:hidden">
          On this page
          <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <ul className="border-t border-[var(--atlas-border)] py-1">
          {sections.map((section) => {
            const active = section.id === activeId;
            return (
              <li key={`mobile-${section.id}`} className="border-b border-[var(--atlas-border)] last:border-b-0">
                <a
                  href={`#${section.id}`}
                  aria-current={active ? "location" : undefined}
                  data-profile-action="section_nav"
                  data-profile-target-id={section.id}
                  data-profile-target-type="section"
                  data-profile-section="navigator"
                  onClick={(event) => openSection(event, section.id)}
                  className={`flex min-h-11 items-center py-2 text-sm leading-6 underline decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-signal)] focus-visible:ring-offset-2 ${active ? "font-extrabold text-[var(--atlas-ink)] decoration-[var(--atlas-signal)]" : "font-semibold text-[var(--atlas-muted)] decoration-[var(--atlas-border-strong)] hover:text-[var(--atlas-ink)] hover:decoration-[var(--atlas-signal)]"}`}
                >
                  {section.label}
                </a>
              </li>
            );
          })}
        </ul>
      </details>

      <div className="hidden min-h-11 items-center gap-4 lg:flex xl:gap-6">
        <p className="shrink-0 text-[12px] font-extrabold uppercase tracking-[0.09em] text-[var(--atlas-ink)]">On this page</p>
        <ul className="flex min-w-0 flex-1 flex-nowrap items-center gap-x-4 xl:gap-x-6">
          {sections.map((section) => {
            const active = section.id === activeId;
            return (
              <li key={`desktop-${section.id}`} className="shrink-0">
                <a
                  href={`#${section.id}`}
                  aria-current={active ? "location" : undefined}
                  data-profile-action="section_nav"
                  data-profile-target-id={section.id}
                  data-profile-target-type="section"
                  data-profile-section="navigator"
                  onClick={(event) => openSection(event, section.id)}
                  className={`inline-flex min-h-11 items-center whitespace-nowrap px-0.5 text-[13px] leading-5 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-signal)] focus-visible:ring-offset-2 ${active ? "font-extrabold text-[var(--atlas-ink)] decoration-[var(--atlas-signal)] decoration-2" : "font-semibold text-[var(--atlas-muted)] decoration-[var(--atlas-border-strong)] hover:text-[var(--atlas-ink)] hover:decoration-[var(--atlas-signal)]"}`}
                >
                  {section.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
