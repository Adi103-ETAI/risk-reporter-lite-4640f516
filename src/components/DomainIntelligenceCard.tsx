import { BadgeCheck, CalendarClock, LockKeyhole, Shield } from "lucide-react";

export function DomainIntelligenceCard({
  registrar = "NameCheap, Inc.",
  created = "2023-11-15",
  expires = "2024-11-15",
  privacy = "Enabled (Redacted)",
  status = "clientTransferProhibited",
}: {
  registrar?: string;
  created?: string;
  expires?: string;
  privacy?: string;
  status?: string;
}) {
  const rows: Array<{ label: string; value: string; highlight?: boolean }> = [
    { label: "Registrar Name", value: registrar },
    { label: "Creation Date", value: created },
    { label: "Expiry Date", value: expires },
    { label: "Whois Privacy", value: privacy, highlight: true },
    { label: "Status", value: status },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4" />
        <div className="text-sm font-semibold">Domain Intelligence</div>
      </div>

      <div className="rounded-xl border bg-background">
        <dl className="divide-y">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-4 p-4">
              <dt className="text-xs text-muted-foreground">{r.label}</dt>
              <dd className={"text-xs font-medium " + (r.highlight ? "text-brand" : "text-foreground")}>{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
