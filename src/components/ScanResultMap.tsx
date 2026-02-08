import * as React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

import type { ScanStatus } from "@/components/ScanRiskSummary";

type ScanResultMapProps = {
  lat?: number;
  lon?: number;
  country?: string;
  ipOrDomain?: string;
  score?: number;
  status?: ScanStatus;
};

function statusColor(status: ScanStatus) {
  switch (status) {
    case "Safe":
      return "hsl(var(--success))";
    case "Suspicious":
      return "hsl(var(--warning))";
    case "Dangerous":
      return "hsl(var(--destructive))";
  }
}

export function ScanResultMap({
  lat,
  lon,
  country,
  ipOrDomain,
  score,
  status,
}: ScanResultMapProps) {
  const hasLocation = typeof lat === "number" && typeof lon === "number";

  if (!hasLocation || !status) {
    return (
      <div className="rounded-xl border bg-panel p-6 text-left">
        <div className="text-sm font-medium">Map will appear here</div>
        <div className="mt-1 text-xs text-muted-foreground">
          After the first scan, we’ll show the server location with a single marker.
        </div>
      </div>
    );
  }

  const center: LatLngExpression = [lat, lon];
  const color = statusColor(status);

  return (
    <div className="overflow-hidden rounded-xl border bg-background h-[320px] sm:h-[420px]">
      <MapContainer center={center} zoom={6} scrollWheelZoom className="h-full w-full" zoomControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <CircleMarker
          center={center}
          radius={10}
          pathOptions={{ color, fillColor: color, fillOpacity: 0.9, weight: 2 }}
        >
          <Popup>
            <div className="space-y-1">
              <div className="text-sm font-semibold">{ipOrDomain || "Target"}</div>
              <div className="text-xs text-muted-foreground">Country: {country || "—"}</div>
              <div className="text-xs text-muted-foreground">Score: {typeof score === "number" ? score : "—"}</div>
              <div className="text-xs text-muted-foreground">Status: {status}</div>
            </div>
          </Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
