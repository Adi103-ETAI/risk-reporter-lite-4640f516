import * as React from "react";
import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";

export type ScanStatus = "Safe" | "Suspicious" | "Dangerous";

function statusMeta(status: ScanStatus) {
  switch (status) {
    case "Safe":
      return {
        label: "SAFE",
        Icon: ShieldCheck,
        pillClass: "bg-success text-success-foreground border-success/20",
        headlineClass: "text-success",
      } as const;
    case "Suspicious":
      return {
        label: "SUSPICIOUS",
        Icon: AlertTriangle,
        pillClass: "bg-warning text-warning-foreground border-warning/20",
        headlineClass: "text-warning",
      } as const;
    case "Dangerous":
      return {
        label: "DANGEROUS",
        Icon: ShieldAlert,
        pillClass: "bg-destructive text-destructive-foreground border-destructive/20",
        headlineClass: "text-destructive",
      } as const;
  }
}

export function ScanRiskSummary({
  score,
  status,
}: {
  score?: number;
  status?: ScanStatus;
}) {
  if (typeof score !== "number" || !status) {
    return (
      <div className="space-y-3">
        <div className="text-sm font-semibold">Risk Assessment</div>
        <div className="rounded-xl border bg-panel p-6 text-left">
          <div className="text-sm font-medium">Awaiting scan</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Submit a URL to retrieve backend risk scoring and server location.
          </div>
        </div>
      </div>
    );
  }

  const meta = statusMeta(status);
  const Icon = meta.Icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <div className="text-sm font-semibold">Risk Assessment</div>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.pillClass}`}
        >
          {meta.label}
        </span>
      </div>

      <div className="grid place-items-center rounded-lg border bg-background p-6">
        <div className="text-center">
          <div className="text-5xl font-semibold tracking-tight">
            {Math.round(score)}
            <span className="text-muted-foreground">/100</span>
          </div>
          <div className={`mt-1 text-xs font-semibold tracking-[0.18em] ${meta.headlineClass}`}>
            {status.toUpperCase()} RISK
          </div>
        </div>
      </div>
    </div>
  );
}
