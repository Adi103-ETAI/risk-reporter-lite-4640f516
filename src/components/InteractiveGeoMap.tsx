import * as React from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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

export function InteractiveGeoMap({
  latitude = 55.7558,
  longitude = 37.6173,
  location = "Moscow, RU",
  flyTo = false,
}: InteractiveGeoMapProps) {
  const position: LatLngExpression = [latitude, longitude];

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
        zoomControl={true}
      >
        {/* Dark Matter tiles from CartoDB */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />

        <Marker position={position}>
          <Popup>
            <div className="text-sm font-semibold">{location}</div>
            <div className="text-xs text-muted-foreground">
              {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
            </div>
          </Popup>
        </Marker>

        <FlyToController position={position} shouldFly={flyTo} />
      </MapContainer>
    </motion.div>
  );
}
