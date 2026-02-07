import { Lock, Network, ShieldCheck } from "lucide-react";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border bg-panel px-2 py-1 text-[11px] text-muted-foreground">
      {children}
    </span>
  );
}

function PortTile({ port, label, emphasis = false }: { port: string; label: string; emphasis?: boolean }) {
  return (
    <div className={"rounded-xl border p-4 " + (emphasis ? "bg-destructive/10" : "bg-panel")}
    >
      <div className={"text-center text-2xl font-semibold " + (emphasis ? "text-destructive" : "text-foreground")}>{port}</div>
      <div className="mt-1 text-center text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">{label}</div>
    </div>
  );
}

export function SecurityConfigurationCard({
  issuer = "Let's Encrypt R3",
  validity = "Valid (58 days left)",
}: {
  issuer?: string;
  validity?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4" />
        <div className="text-sm font-semibold">Security &amp; Configuration</div>
      </div>

      <div className="rounded-xl border bg-background p-4">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">SSL CERTIFICATE</div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Issuer</span>
                <span className="font-medium">{issuer}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Validity</span>
                <span className="font-medium text-success">{validity}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              <div className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">DNS RECORDS</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip>
                <span className="text-foreground">A</span>
                192.168.45.12
              </Chip>
              <Chip>
                <span className="text-foreground">MX</span>
                mail.suspicious.net
              </Chip>
              <Chip>
                <span className="text-foreground">TXT</span>
                v=spf1 include:_spf…
              </Chip>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <div className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">OPEN PORTS</div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <PortTile port="80" label="HTTP" emphasis />
            <PortTile port="443" label="HTTPS" emphasis />
            <PortTile port="22" label="SSH" />
            <PortTile port="21" label="FTP" />
          </div>
        </div>
      </div>
    </div>
  );
}
