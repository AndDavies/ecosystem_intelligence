export function RankExplainer({ drivers }: { drivers: string[] }) {
  return (
    <div className="text-xs leading-5 text-[var(--muted-foreground)]">
      <span className="font-semibold text-[var(--foreground)]">Ranked because: </span>
      {drivers.join(", ")}. Rank signal is relative prioritization, not a probability.
    </div>
  );
}
