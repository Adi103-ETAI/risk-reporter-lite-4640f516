import * as React from "react";
import { Crosshair, Globe2, Loader2 } from "lucide-react";
import { InteractiveGeoMap } from "@/components/InteractiveGeoMap";
import { RiskSignalsList } from "@/components/RiskSignalsList";
import { supabase } from "@/integrations/supabase/client";
import { getRiskRuleLabel } from "@/lib/riskRuleLabels";

type HostingGeoPanelProps = {
  targetUrl?: string;
  flyTo?: boolean;
};

function formatCoords(lat?: number, lon?: number) {
  if (typeof lat !== "number" || typeof lon !== "number") return "—";
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}°${ns}, ${Math.abs(lon).toFixed(4)}°${ew}`;
}

function safeLocalTime(tz?: string) {
  if (!tz) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return "—";
  }
}

type HostingNode = {
  id: string;
  ip?: string;
  location?: string;
  asn?: string;
  org?: string;
  isp?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  riskScore?: number;
  classification?: "Safe" | "Suspicious" | "Dangerous";
  triggeredRules?: string[];
  breakdown?: Array<{ rule: string; points: number; detail: string }>;
};

function sortBreakdownByImpact(items?: Array<{ rule: string; points: number; detail: string }>) {
  if (!items || items.length === 0) return items;
  return [...items].sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
}

function normalizeScanResponse(payload: any): HostingNode[] {
  if (!payload) return [];

  const fromArray = Array.isArray(payload.locations)
    ? payload.locations
    : Array.isArray(payload.hosting)
      ? payload.hosting
      : Array.isArray(payload.results)
        ? payload.results
        : null;

  const items: any[] = fromArray ?? [payload];

  return items
    .map((x) => {
      const lat = typeof x.latitude === "number" ? x.latitude : typeof x.lat === "number" ? x.lat : null;
      const lon =
        typeof x.longitude === "number" ? x.longitude : typeof x.lon === "number" ? x.lon : typeof x.lng === "number" ? x.lng : null;
      if (typeof lat !== "number" || typeof lon !== "number") return null;

      const riskBlock = x.urlRisk ?? x.risk ?? x.riskResult ?? x;
      const rawBreakdown = Array.isArray(riskBlock?.breakdown)
        ? riskBlock.breakdown
        : Array.isArray(x.breakdown)
          ? x.breakdown
          : undefined;

      const triggeredRules =
        Array.isArray(riskBlock?.triggeredRules)
          ? riskBlock.triggeredRules
          : Array.isArray(x.triggeredRules)
            ? x.triggeredRules
            : undefined;

      const breakdown = sortBreakdownByImpact(rawBreakdown);

      return {
        id: String(x.id ?? x.ip ?? `${lat},${lon}`),
        ip: x.ip,
        location: x.location ?? x.city_country ?? x.city ?? x.country,
        asn: x.asn,
        org: x.org ?? x.organization,
        isp: x.isp,
        latitude: lat,
        longitude: lon,
        timezone: x.timezone,
        riskScore: typeof x.riskScore === "number" ? x.riskScore : typeof x.score === "number" ? x.score : riskBlock?.score,
        classification: x.classification ?? riskBlock?.classification,
        triggeredRules,
        breakdown,
      } satisfies HostingNode;
    })
    .filter(Boolean) as HostingNode[];
}

export function HostingGeoPanel({ targetUrl, flyTo = false }: HostingGeoPanelProps) {
  const [nodes, setNodes] = React.useState<HostingNode[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const cleaned = (targetUrl ?? "").trim();
    if (!cleaned) {
      setNodes([]);
      setSelectedId(null);
      setLoadError(null);
      return;
    }

    let cancelled = false;

    async function run() {
      setLoading(true);
      setLoadError(null);

      const { data, error } = await supabase.functions.invoke("scan-url", {
        body: { url: cleaned },
      });

      if (cancelled) return;

      if (error) {
        console.error("scan-url failed", error);
        setLoadError("Unable to load hosting locations for this target.");
        setNodes([]);
        setSelectedId(null);
      } else {
        const normalized = normalizeScanResponse(data);
        setNodes(normalized);
        setSelectedId(normalized[0]?.id ?? null);
      }

      setLoading(false);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [targetUrl]);

  const selected = React.useMemo(() => {
    if (!nodes.length) return null;
    return nodes.find((n) => n.id === selectedId) ?? nodes[0];
  }, [nodes, selectedId]);

  const coords = React.useMemo(() => formatCoords(selected?.latitude, selected?.longitude), [selected?.latitude, selected?.longitude]);
  const localTime = React.useMemo(() => safeLocalTime(selected?.timezone), [selected?.timezone]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Globe2 className="h-4 w-4" />
          <div className="text-sm font-semibold">Hosting &amp; Geo-Location</div>
        </div>
        <div className="text-xs text-muted-foreground">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Fetching…
            </span>
          ) : loadError ? (
            "Lookup failed"
          ) : selected?.ip ? (
            <>IP: {selected.ip}</>
          ) : nodes.length ? (
            <>{nodes.length} location(s)</>
          ) : (
            "—"
          )}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border bg-background h-[400px] sm:h-[480px] md:h-[520px]">
        <InteractiveGeoMap
          markers={nodes.map((n) => {
            const topSignals = (n.breakdown ?? []).slice(0, 3);
            return {
              id: n.id,
              latitude: n.latitude,
              longitude: n.longitude,
              title: n.location || n.ip || "Hosting node",
              subtitle: n.ip,
              metaLines: [
                n.asn ? `ASN: ${n.asn}` : "",
                n.org ? `Org: ${n.org}` : "",
                typeof n.riskScore === "number" ? `Risk: ${n.riskScore}/100` : "",
                n.classification ? `Class: ${n.classification}` : "",
                n.triggeredRules?.length ? `Rules: ${n.triggeredRules.map(getRiskRuleLabel).join(", ")}` : "",
                ...topSignals.map((b) => `${b.points > 0 ? "+" : ""}${b.points} ${getRiskRuleLabel(b.rule)}`),
              ].filter(Boolean),
            };
          })}
          flyTo={flyTo}
          latitude={selected?.latitude}
          longitude={selected?.longitude}
          location={selected?.location}
          onMarkerSelect={(m) => setSelectedId(m.id)}
        />

        {/* Meta strip (stacks below the map on mobile) */}
        <div className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-panel/90 px-3 py-2 backdrop-blur sm:absolute sm:left-4 sm:top-4 sm:right-4 sm:mx-0 sm:mt-0 z-[1000]">
          <div className="flex items-center gap-2 text-xs">
            <Crosshair className="h-4 w-4 text-muted-foreground" />
            <div className="font-medium">{coords}</div>
            <span className="text-muted-foreground">•</span>
            <div className="text-muted-foreground">TZ</div>
            <div className="font-medium">{selected?.timezone || "—"}</div>
          </div>

          <div className="text-xs text-muted-foreground">
            Local time: <span className="font-medium text-foreground">{localTime}</span>
          </div>
        </div>

        {/* Facts card (stacks below the map on mobile) */}
        <div className="mx-4 mt-3 w-auto max-w-none rounded-xl border bg-panel/90 p-4 backdrop-blur sm:absolute sm:bottom-4 sm:right-4 sm:mx-0 sm:mt-0 sm:w-[320px] sm:max-w-[calc(100%-2rem)] z-[1000]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">HOSTING NODE</div>
              <div className="mt-1 text-sm font-semibold">{selected?.location || "—"}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{selected?.ip || ""}</div>
            </div>
            <div className="rounded-md border bg-background/60 px-2 py-1 text-[11px] font-semibold text-muted-foreground">
              {typeof selected?.riskScore === "number" ? `${selected.riskScore}/100` : "—"}
            </div>
          </div>

          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground">ASN</div>
                <div className="font-medium">{selected?.asn || "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">ORGANIZATION</div>
                <div className="font-medium">{selected?.org || "—"}</div>
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground">ISP NAME</div>
                <div className="font-medium text-brand">{selected?.isp || "—"}</div>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">RISK BREAKDOWN</div>
              <div className="mt-2">
                <RiskSignalsList
                  breakdown={selected?.breakdown}
                  ruleLabel={getRiskRuleLabel}
                  emptyLabel="No breakdown returned for this node."
                />
              </div>
            </div>

            {loadError ? <div className="text-xs text-muted-foreground">{loadError}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

