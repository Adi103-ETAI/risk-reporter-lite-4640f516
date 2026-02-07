import { Globe2 } from "lucide-react";
import geoMap from "@/assets/geo-map.jpg";

export function HostingGeoPanel({
  ip = "192.168.45.12",
  location = "Moscow, RU",
  asn = "AS12345",
  org = "BadActor Net Ltd.",
  isp = "Secure Hosting Solutions LLC",
}: {
  ip?: string;
  location?: string;
  asn?: string;
  org?: string;
  isp?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
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
        <div className="absolute inset-0 bg-gradient-to-t from-background/35 via-transparent to-transparent" aria-hidden="true" />

        <div className="absolute bottom-4 right-4 w-[260px] rounded-xl border bg-panel/90 p-4 backdrop-blur">
          <div className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">SERVER LOCATION</div>
          <div className="mt-1 text-sm font-semibold">{location}</div>

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
