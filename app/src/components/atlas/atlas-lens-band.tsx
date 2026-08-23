"use client";

import { Building2, Check, ChevronDown, Compass, Cpu, FileText, X, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type AtlasLensKey = "mission" | "demand" | "domain" | "type";

export interface AtlasLensOption {
  value: string;
  label: string;
  count?: number;
}

export interface AtlasLens {
  key: AtlasLensKey;
  label: string;
  /** Optional shorter label shown below the sm breakpoint so triggers never mid-word truncate. */
  shortLabel?: string;
  allOptionLabel: string;
  options: AtlasLensOption[];
}

const lensIcons: Record<AtlasLensKey, LucideIcon> = {
  mission: Compass,
  demand: FileText,
  domain: Cpu,
  type: Building2
};

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Compact guided lens band for the map workspace. Four lens triggers open an
 * accessible option list: an anchored listbox popover on larger screens and a
 * focus-trapped bottom sheet dialog on small screens. Selection is delegated
 * to the existing filter/load/URL machinery through onSelect.
 */
export function AtlasLensBand({
  lenses,
  activeValues,
  disabled = false,
  onSelect,
  className
}: {
  lenses: AtlasLens[];
  activeValues: Partial<Record<AtlasLensKey, string>>;
  disabled?: boolean;
  onSelect: (key: AtlasLensKey, value: string) => void;
  className?: string;
}) {
  const baseId = useId();
  const [openLens, setOpenLens] = useState<AtlasLensKey | null>(null);
  const [isSheet, setIsSheet] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRefs = useRef(new Map<AtlasLensKey, HTMLButtonElement>());

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setIsSheet(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const close = useCallback((focusTrigger: boolean) => {
    setOpenLens((current) => {
      if (current && focusTrigger) triggerRefs.current.get(current)?.focus();
      return null;
    });
  }, []);

  useEffect(() => {
    if (!openLens) return;
    const panel = panelRef.current;
    const selectedOption = panel?.querySelector<HTMLButtonElement>('[role="option"][aria-selected="true"]');
    const firstOption = panel?.querySelector<HTMLButtonElement>('[role="option"]');
    (selectedOption ?? firstOption)?.focus();

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      close(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openLens, close]);

  useEffect(() => {
    if (!openLens || !isSheet) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [openLens, isSheet]);

  function onPanelKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
      const options = Array.from(panelRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []);
      if (!options.length) return;
      event.preventDefault();
      const currentIndex = options.indexOf(document.activeElement as HTMLButtonElement);
      const nextIndex = event.key === "Home"
        ? 0
        : event.key === "End"
          ? options.length - 1
          : event.key === "ArrowDown"
            ? (currentIndex + 1 + options.length) % options.length
            : (currentIndex - 1 + options.length) % options.length;
      options[nextIndex]?.focus();
      return;
    }
    if (event.key === "Tab") {
      if (!isSheet) {
        // The anchored popover closes when focus tabs away; the sheet traps focus.
        close(false);
        return;
      }
      const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  function selectOption(key: AtlasLensKey, value: string) {
    close(true);
    onSelect(key, value);
  }

  return (
    <div ref={rootRef} className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", className)}>
      {lenses.map((lens) => {
        const Icon = lensIcons[lens.key];
        const open = openLens === lens.key;
        const activeValue = activeValues[lens.key] ?? "";
        const activeOption = activeValue ? lens.options.find((option) => option.value === activeValue) ?? null : null;
        const triggerId = `${baseId}-${lens.key}-trigger`;
        const panelId = `${baseId}-${lens.key}-panel`;
        const labelId = `${baseId}-${lens.key}-label`;
        return (
          // Size and weight live on this wrapper because the global `button { font: inherit }` rule outranks layered utilities on the button itself.
          <div key={lens.key} className="relative min-w-0 text-xs font-bold">
            <button
              ref={(node) => {
                if (node) triggerRefs.current.set(lens.key, node);
                else triggerRefs.current.delete(lens.key);
              }}
              type="button"
              id={triggerId}
              aria-disabled={disabled || undefined}
              aria-haspopup={isSheet ? "dialog" : "listbox"}
              aria-expanded={open}
              aria-controls={open ? panelId : undefined}
              onClick={() => {
                if (disabled) return;
                setOpenLens(open ? null : lens.key);
              }}
              className={cn(
                "flex min-h-11 w-full items-center gap-1.5 rounded-[12px] px-2.5 py-2 text-left text-xs font-bold text-[var(--atlas-ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-primary)] aria-disabled:opacity-60 sm:gap-2 sm:px-3",
                activeOption
                  ? "bg-[var(--atlas-signal-soft)] shadow-[inset_0_-2px_0_0_var(--atlas-signal)]"
                  : "bg-[var(--atlas-surface-muted)] hover:bg-[var(--atlas-blue-soft)]"
              )}
            >
              <Icon className="size-3.5 shrink-0 text-[var(--atlas-evidence)] sm:size-4" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-1.5">
                  <span className="min-w-0 truncate">
                    {lens.shortLabel ? (
                      <>
                        <span className="sm:hidden">{lens.shortLabel}</span>
                        <span className="hidden sm:inline">{lens.label}</span>
                      </>
                    ) : (
                      lens.label
                    )}
                  </span>
                  <span className="shrink-0 text-[10px] font-semibold text-[var(--atlas-muted)]">{lens.options.length}<span className="sr-only"> available options</span></span>
                </span>
                {activeOption ? (
                  <span className="block truncate text-[10px] font-semibold text-[var(--atlas-ink-soft)]">{activeOption.label}</span>
                ) : null}
              </span>
              <ChevronDown className={cn("size-3.5 shrink-0 text-[var(--atlas-muted)] transition-transform", open && "rotate-180")} aria-hidden="true" />
            </button>

            {open ? (
              isSheet ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-[1200] bg-[rgba(36,40,39,0.5)]"
                    aria-label={`Close ${lens.label} options`}
                    onClick={() => close(true)}
                  />
                  <div
                    ref={panelRef}
                    id={panelId}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={labelId}
                    onKeyDown={onPanelKeyDown}
                    className="fixed inset-x-0 bottom-0 z-[1201] flex max-h-[70dvh] flex-col rounded-t-[16px] bg-white shadow-[var(--atlas-shadow-float)]"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-[var(--atlas-border)] px-4 py-3">
                      <p id={labelId} className="text-sm font-extrabold text-[var(--atlas-ink)]">{lens.label}</p>
                      <button
                        type="button"
                        onClick={() => close(true)}
                        className="flex size-11 items-center justify-center rounded-lg text-[var(--atlas-muted)] hover:bg-[var(--atlas-surface-muted)] hover:text-[var(--atlas-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-primary)]"
                        aria-label={`Close ${lens.label} options`}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div role="listbox" aria-labelledby={labelId} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 text-[13px] font-normal">
                      <LensOptionList lens={lens} activeValue={activeValue} sheet onPick={(value) => selectOption(lens.key, value)} />
                    </div>
                  </div>
                </>
              ) : (
                <div
                  ref={panelRef}
                  id={panelId}
                  role="listbox"
                  aria-labelledby={triggerId}
                  onKeyDown={onPanelKeyDown}
                  className="absolute left-0 top-[calc(100%+4px)] z-40 max-h-72 w-[min(320px,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-[12px] bg-white p-1.5 text-xs font-normal shadow-[var(--atlas-shadow-float)] ring-1 ring-[var(--atlas-border)]"
                >
                  <LensOptionList lens={lens} activeValue={activeValue} onPick={(value) => selectOption(lens.key, value)} />
                </div>
              )
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function LensOptionList({
  lens,
  activeValue,
  sheet = false,
  onPick
}: {
  lens: AtlasLens;
  activeValue: string;
  sheet?: boolean;
  onPick: (value: string) => void;
}) {
  const entries: AtlasLensOption[] = [{ value: "", label: lens.allOptionLabel }, ...lens.options];
  return (
    <>
      {entries.map((option) => {
        const selected = option.value === activeValue;
        return (
          <button
            key={option.value || "__all"}
            type="button"
            role="option"
            aria-selected={selected}
            tabIndex={-1}
            onClick={() => onPick(option.value)}
            className={cn(
              "flex w-full items-center gap-2 rounded-[8px] px-3 text-left text-[var(--atlas-ink-soft)] hover:bg-[var(--atlas-blue-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--atlas-primary)]",
              sheet ? "min-h-11 py-2.5" : "min-h-9 py-2",
              selected && "bg-[var(--atlas-signal-soft)] text-[var(--atlas-ink)]"
            )}
          >
            {/* Weight sits on the span because the global `button { font: inherit }` rule outranks utilities on the button. */}
            <span className={cn("min-w-0 flex-1 truncate", selected && "font-bold")}>{option.label}</span>
            {typeof option.count === "number" ? (
              <span className="shrink-0 text-[10px] font-semibold text-[var(--atlas-muted)]">{option.count}<span className="sr-only"> organizations</span></span>
            ) : null}
            {selected ? <Check className="size-3.5 shrink-0 text-[var(--atlas-ink)]" aria-hidden="true" /> : null}
          </button>
        );
      })}
    </>
  );
}
