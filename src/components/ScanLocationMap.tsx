import * as React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

export type ScanMapData = {
  lat: number;
  lon: number;
  country: string;
  ip: string;
  status: string;
  score: number; // 0..100
};

type ScanLocationMapProps = {
  data: ScanMapData;
};

export function clampScore(score: number) {
  return Math.min(100, Math.max(0, score));
}

export type RiskClassification = "Safe" | "Suspicious" | "Dangerous";

export function classifyScore(score: number): RiskClassification {
  const s = clampScore(score);
  if (s <= 20) return "Safe";
  if (s <= 50) return "Suspicious";
  return "Dangerous";
}

export function markerColorHsl(classification: RiskClassification) {
  switch (classification) {
    case "Safe":
      return "hsl(var(--success))";
    case "Suspicious":
      return "hsl(var(--warning))";
    case "Dangerous":
      return "hsl(var(--destructive))";
  }
}

function Recenter({ center }: { center: LatLngExpression }) {
  const map = useMap();

  React.useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}

export function ScanLocationMap({ data }: ScanLocationMapProps) {
  const center: LatLngExpression = [data.lat, data.lon];
  const classification = classifyScore(data.score);
  const color = markerColorHsl(classification);

  return (
    <div className="h-[360px] w-full overflow-hidden rounded-xl border bg-background">
      <MapContainer center={center} zoom={6} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <CircleMarker
          center={center}
          radius={10}
          pathOptions={{
            color,
            fillColor: color,
            fillOpacity: 0.9,
            weight: 2,
          }}
        >
          <Popup>
            <div className="space-y-1 text-sm">
              <div>
                <span className="font-semibold">IP:</span> {data.ip}
              </div>
              <div>
                <span className="font-semibold">Country:</span> {data.country}
              </div>
              <div>
                <span className="font-semibold">Score:</span> {clampScore(data.score)} ({classification})
              </div>
              <div>
                <span className="font-semibold">Status:</span> {data.status}
              </div>
            </div>
          </Popup>
        </CircleMarker>

        <Recenter center={center} />
      </MapContainer>
    </div>
  );
}
