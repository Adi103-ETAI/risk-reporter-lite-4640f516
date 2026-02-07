import { ShieldAlert, ShieldCheck, ShieldHalf } from "lucide-react";
import type { RiskScore } from "@/lib/pdfReport";

const RISK_META: Record<
  RiskScore,
  {
    label: string;
    className: string;
    Icon: React.ComponentType<{ className?: string }>;
    description: string;
  }
> = {
  LOW: {
    label: "LOW",
    className: "bg-success text-success-foreground border-success/20",
    Icon: ShieldCheck,
    description: "No known indicators of compromise in this snapshot.",
  },
  MEDIUM: {
    label: "MEDIUM",
    className: "bg-warning text-warning-foreground border-warning/20",
    Icon: ShieldHalf,
    description: "Some anomalous indicators or weak posture detected.",
  },
  HIGH: {
    label: "HIGH",
    className: "bg-destructive text-destructive-foreground border-destructive/20",
    Icon: ShieldAlert,
    description: "Multiple high-confidence indicators or risky infrastructure.",
  },
};

export function RiskScorePill({ score }: { score: RiskScore }) {
  const meta = RISK_META[score];
  const Icon = meta.Icon;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-panel px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>
          <Icon className="h-4 w-4" />
          {meta.label}
        </span>
        <div className="text-sm">
          <div className="font-medium">Risk Score</div>
          <div className="text-muted-foreground">{meta.description}</div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">Updated: {new Date().toLocaleTimeString()}</div>
    </div>
  );
}
