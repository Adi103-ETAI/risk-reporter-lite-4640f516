import * as React from "react";
import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";
import type { RiskScore } from "@/lib/pdfReport";

const SCORE_META: Record<
  RiskScore,
  {
    label: string;
    score: number;
    Icon: React.ComponentType<{ className?: string }>;
    pillClass: string;
    headline: string;
    findings: Array<{ title: string; detail: string }>;
  }
> = {
  LOW: {
    label: "LOW",
    score: 22,
    Icon: ShieldCheck,
    pillClass: "bg-success text-success-foreground border-success/20",
    headline: "LOW RISK SCORE",
    findings: [{ title: "No active signatures detected", detail: "No matches in local rule set" }],
  },
  MEDIUM: {
    label: "MEDIUM",
    score: 58,
    Icon: AlertTriangle,
    pillClass: "bg-warning text-warning-foreground border-warning/20",
    headline: "ELEVATED RISK SCORE",
    findings: [
      { title: "Inconsistent DNS history", detail: "Changes observed across passive snapshots" },
      { title: "Weak security posture", detail: "Incomplete configuration signals" },
    ],
  },
  HIGH: {
    label: "CRITICAL",
    score: 85,
    Icon: ShieldAlert,
    pillClass: "bg-destructive text-destructive-foreground border-destructive/20",
    headline: "HIGH RISK SCORE",
    findings: [
      { title: "Malware signatures detected", detail: "Matched 3 known trojan patterns" },
      { title: "Blacklisted IP address", detail: "Listed in 4 threat intelligence feeds" },
    ],
  },
};

export function RiskAssessmentCard({ score }: { score: RiskScore }) {
  const meta = SCORE_META[score];
  const Icon = meta.Icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <div className="text-sm font-semibold">Risk Assessment</div>
        </div>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.pillClass}`}>
          {meta.label}
        </span>
      </div>

      <div className="grid place-items-center rounded-lg border bg-background p-6">
        <div className="text-center">
          <div className="text-5xl font-semibold tracking-tight">
            {meta.score}
            <span className="text-muted-foreground">/100</span>
          </div>
          <div className="mt-1 text-xs font-semibold tracking-[0.18em] text-destructive">{meta.headline}</div>
        </div>
      </div>

      <div className="space-y-2">
        {meta.findings.map((f) => (
          <div key={f.title} className="rounded-lg border bg-panel p-3">
            <div className="text-sm font-medium">{f.title}</div>
            <div className="text-xs text-muted-foreground">{f.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
