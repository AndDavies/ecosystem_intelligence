import type { SignalTag } from "@/lib/signals/taxonomy";
import { getSignalTagLabel, getSignalTagTone } from "@/lib/signals/taxonomy";

export function SignalTagPill({ tag, active = false, asButton = false, onClick }: { tag: SignalTag; active?: boolean; asButton?: boolean; onClick?: () => void }) {
  const className = `inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[11px] font-extrabold tracking-[0.01em] transition-colors ${active ? "border-[var(--atlas-ink)] bg-[var(--atlas-ink)] text-white" : getSignalTagTone(tag)}`;
  if (asButton) return <button type="button" aria-pressed={active} onClick={onClick} className={`${className} hover:border-[var(--atlas-ink)]`}>{getSignalTagLabel(tag)}</button>;
  return <span className={className}>{getSignalTagLabel(tag)}</span>;
}
