"use client";

export function SkipLink() {
  return (
    <a
      href="#main-content"
      onClick={(event) => {
        event.preventDefault();
        const mainContent = document.getElementById("main-content");
        mainContent?.focus();
        mainContent?.scrollIntoView({ block: "start" });
      }}
      className="fixed left-4 top-4 z-[2000] -translate-y-24 rounded-md bg-[var(--atlas-ink)] px-4 py-2 text-sm font-bold text-white shadow-[var(--atlas-shadow-float)] transition-transform focus:translate-y-0 focus:outline-none focus:ring-4 focus:ring-[var(--atlas-signal)]"
    >
      Skip to main content
    </a>
  );
}
