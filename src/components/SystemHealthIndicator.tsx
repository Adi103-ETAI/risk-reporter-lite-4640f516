import { Activity } from "lucide-react";

export type SystemHealthState = "operational" | "degraded" | "down";

const HEALTH_COPY: Record<SystemHealthState, { label: string; hint: string }> = {
  operational: { label: "Operational", hint: "All critical systems responding" },
  degraded: { label: "Degraded", hint: "Some services are slow or intermittent" },
  down: { label: "Outage", hint: "Core systems unavailable" },
};

export function SystemHealthIndicator({ state = "operational" }: { state?: SystemHealthState }) {
  const cfg = HEALTH_COPY[state];

  const dotClass =
    state === "operational"
      ? "bg-success"
      : state === "degraded"
        ? "bg-warning"
        : "bg-destructive";

  return (
    <div className="flex items-center gap-2" aria-live="polite">
      <span className="relative inline-flex h-2.5 w-2.5">
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${dotClass} motion-safe:animate-pulse-soft`}
          aria-hidden="true"
        />
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dotClass}`} aria-hidden="true" />
      </span>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Activity className="h-4 w-4" />
        <span className="font-medium text-foreground">System</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-foreground">{cfg.label}</span>
        <span className="sr-only">{cfg.hint}</span>
      </div>
    </div>
  );
}
