import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function RankExplainer({ drivers }: { drivers: string[] }) {
  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-1.5 text-xs leading-5 text-[var(--muted-foreground)]">
        <span>
          <span className="font-semibold text-[var(--foreground)]">Ranked because: </span>
          {drivers.join(", ")}.
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-[3px] border border-[var(--border)] bg-white/70 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--primary)]"
            >
              <Info className="size-3" />
              Rank signal
            </button>
          </TooltipTrigger>
          <TooltipContent sideOffset={6} className="max-w-72">
            Relative prioritization from current records. It is not a probability, forecast, or source-backed fact by itself.
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
