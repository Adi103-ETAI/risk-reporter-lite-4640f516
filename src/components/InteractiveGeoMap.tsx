import * as React from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon issue with Leaflet + bundlers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

type InteractiveGeoMapProps = {
  latitude?: number;
  longitude?: number;
  location?: string;
  flyTo?: boolean;
  markers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    title: string;
    subtitle?: string;
    metaLines?: string[];
  }>;
  onMarkerSelect?: (marker: {
    id: string;
    latitude: number;
    longitude: number;
    title: string;
    subtitle?: string;
    metaLines?: string[];
  }) => void;
};

function FlyToController({ position, shouldFly }: { position: LatLngExpression; shouldFly: boolean }) {
  const map = useMap();

  React.useEffect(() => {
    if (shouldFly) {
      map.flyTo(position, 13, {
        duration: 2.5,
        easeLinearity: 0.25,
      });
    }
  }, [map, position, shouldFly]);

  return null;
}

function ZoomControls() {
  const map = useMap();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  return (
    <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
      <Button
        onClick={handleZoomIn}
        size="icon"
        variant="secondary"
        className="h-11 w-11 sm:h-10 sm:w-10 rounded-lg border bg-panel/90 backdrop-blur hover:bg-panel shadow-md"
        aria-label="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        onClick={handleZoomOut}
        size="icon"
        variant="secondary"
        className="h-11 w-11 sm:h-10 sm:w-10 rounded-lg border bg-panel/90 backdrop-blur hover:bg-panel shadow-md"
        aria-label="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function InteractiveGeoMap({
  latitude = 28.6139,
  longitude = 77.209,
  location = "New Delhi, IN",
  flyTo = false,
  markers,
  onMarkerSelect,
}: InteractiveGeoMapProps) {
  const fallbackPosition: LatLngExpression = [latitude, longitude];
  const primaryMarker = markers && markers.length > 0 ? markers[0] : null;
  const position: LatLngExpression = primaryMarker
    ? ([primaryMarker.latitude, primaryMarker.longitude] as LatLngExpression)
    : fallbackPosition;

  return (
    <motion.div
      className="relative h-full w-full overflow-hidden rounded-xl border"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <MapContainer
        center={position}
        zoom={4}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        {/* Dark Matter tiles from CartoDB */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />

        {(markers && markers.length > 0 ? markers : [
          {
            id: "default",
            latitude,
            longitude,
            title: location,
            subtitle: `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`,
          },
        ]).map((m) => (
          <Marker
            key={m.id}
            position={[m.latitude, m.longitude]}
            eventHandlers={{
              click: () => {
                onMarkerSelect?.(m);
              },
            }}
          >
            <Popup>
              <div className="text-sm font-semibold">{m.title}</div>
              {m.subtitle ? <div className="text-xs text-muted-foreground">{m.subtitle}</div> : null}
              {m.metaLines && m.metaLines.length ? (
                <div className="mt-2 space-y-1">
                  {m.metaLines.map((line, idx) => (
                    <div key={idx} className="text-xs text-muted-foreground">
                      {line}
                    </div>
                  ))}
                </div>
              ) : null}
            </Popup>
          </Marker>
        ))}

        <FlyToController position={position} shouldFly={flyTo} />
        <ZoomControls />
      </MapContainer>
    </motion.div>
  );
}
