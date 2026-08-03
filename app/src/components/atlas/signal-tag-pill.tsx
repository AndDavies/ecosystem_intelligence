import type { SignalTag } from "@/lib/signals/taxonomy";
import { getSignalTagLabel, getSignalTagTone } from "@/lib/signals/taxonomy";

export function SignalTagPill({ tag, active = false, asButton = false, onClick, surface = "paper" }: { tag: SignalTag; active?: boolean; asButton?: boolean; onClick?: () => void; surface?: "paper" | "signal" }) {
  const className = `atlas-pill atlas-pill-tag min-h-8 px-3 py-1 text-[11px] font-extrabold tracking-[0.01em] transition-colors ${active ? "bg-[var(--atlas-ink)] text-white" : getSignalTagTone(tag, surface)}`;
  if (asButton) return <button type="button" aria-pressed={active} onClick={onClick} className={`${className} hover:bg-[var(--atlas-ink)] hover:text-white`}>{getSignalTagLabel(tag)}</button>;
  return <span className={className}>{getSignalTagLabel(tag)}</span>;
}
