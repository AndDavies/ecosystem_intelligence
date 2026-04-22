import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HelpDiagram({
  title,
  description,
  steps
}: {
  title: string;
  description: string;
  steps: string[];
}) {
  return (
    <Card className="rounded-[32px] border-[var(--primary)]/12 bg-[linear-gradient(180deg,rgba(31,80,51,0.08),rgba(255,255,255,0.98))]">
      <CardHeader className="space-y-2">
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {steps.map((step, index) => (
            <div key={`${title}-${step}`} className="flex items-center gap-3">
              <div className="flex min-h-12 flex-1 items-center rounded-[24px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-medium">
                {step}
              </div>
              {index < steps.length - 1 ? (
                <ArrowRight className="hidden size-4 text-[var(--muted-foreground)] md:block" />
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
