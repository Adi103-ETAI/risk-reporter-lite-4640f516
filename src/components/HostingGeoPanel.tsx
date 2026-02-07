import * as React from "react";
import { Crosshair, Globe2, MapPin } from "lucide-react";
import geoMap from "@/assets/geo-map.jpg";

type HostingGeoPanelProps = {
  ip?: string;
  location?: string;
  asn?: string;
  org?: string;
  isp?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
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

export function HostingGeoPanel({
  ip = "192.168.45.12",
  location = "Moscow, RU",
  asn = "AS12345",
  org = "BadActor Net Ltd.",
  isp = "Secure Hosting Solutions LLC",
  latitude = 55.7558,
  longitude = 37.6173,
  timezone = "Europe/Moscow",
}: HostingGeoPanelProps) {
  const coords = React.useMemo(() => formatCoords(latitude, longitude), [latitude, longitude]);
  const localTime = React.useMemo(() => safeLocalTime(timezone), [timezone]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Globe2 className="h-4 w-4" />
          <div className="text-sm font-semibold">Hosting &amp; Geo-Location</div>
        </div>
        <div className="text-xs text-muted-foreground">IP: {ip}</div>
      </div>

      <div className="relative overflow-hidden rounded-xl border bg-background">
        <img
          src={geoMap}
          alt="World map visualization for hosting geolocation"
          className="h-56 w-full object-cover sm:h-64"
          loading="lazy"
        />

        {/* Legibility overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-background/45 via-transparent to-transparent"
          aria-hidden="true"
        />

        {/* Map pin (visual cue only; not a real projection) */}
        <div className="pointer-events-none absolute left-[54%] top-[44%] -translate-x-1/2 -translate-y-full">
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-brand/15 blur-md" aria-hidden="true" />
            <MapPin className="relative h-6 w-6 text-brand drop-shadow" />
          </div>
        </div>

        {/* Meta strip */}
        <div className="absolute left-4 top-4 right-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-panel/80 px-3 py-2 backdrop-blur">
          <div className="flex items-center gap-2 text-xs">
            <Crosshair className="h-4 w-4 text-muted-foreground" />
            <div className="font-medium">{coords}</div>
            <span className="text-muted-foreground">•</span>
            <div className="text-muted-foreground">TZ</div>
            <div className="font-medium">{timezone || "—"}</div>
          </div>

          <div className="text-xs text-muted-foreground">
            Local time: <span className="font-medium text-foreground">{localTime}</span>
          </div>
        </div>

        {/* Facts card */}
        <div className="absolute bottom-4 right-4 w-[280px] max-w-[calc(100%-2rem)] rounded-xl border bg-panel/90 p-4 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">SERVER LOCATION</div>
              <div className="mt-1 text-sm font-semibold">{location}</div>
            </div>
            <div className="rounded-md border bg-background/60 px-2 py-1 text-[11px] font-semibold text-muted-foreground">
              GEOLOCK (SIM)
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-muted-foreground">ASN</div>
              <div className="font-medium">{asn}</div>
            </div>
            <div>
              <div className="text-muted-foreground">ORGANIZATION</div>
              <div className="font-medium">{org}</div>
            </div>
            <div className="col-span-2">
              <div className="text-muted-foreground">ISP NAME</div>
              <div className="font-medium text-brand">{isp}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
