import * as React from "react";

export type RiskBreakdownItem = {
  rule: string;
  points: number;
  detail: string;
};

export function RiskSignalsList({
  breakdown,
  emptyLabel = "No risk signals returned.",
  ruleLabel,
}: {
  breakdown?: RiskBreakdownItem[];
  emptyLabel?: string;
  ruleLabel?: (ruleId: string) => string;
}) {
  if (!breakdown || breakdown.length === 0) {
    return <div className="text-xs text-muted-foreground">{emptyLabel}</div>;
  }

  const labelFor = ruleLabel ?? ((id: string) => id);

  return (
    <div className="space-y-2">
      {breakdown.map((b, idx) => (
        <div key={`${b.rule}-${idx}`} className="rounded-lg border bg-background/50 p-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-xs font-medium">{labelFor(b.rule)}</div>
              <div className="mt-0.5 text-[10px] font-mono text-muted-foreground">{b.rule}</div>
              <div className="mt-1 text-[11px] leading-snug text-muted-foreground">{b.detail}</div>
            </div>
            <div className="shrink-0 rounded-md border bg-background px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {b.points > 0 ? `+${b.points}` : String(b.points)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

