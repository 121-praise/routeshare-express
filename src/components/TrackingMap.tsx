import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons in bundlers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface TrackingMapProps {
  pickup?: [number, number];
  dropoff?: [number, number];
  rider?: [number, number];
  className?: string;
}

export const TrackingMap = ({
  pickup = [6.5095, 3.3711],
  dropoff = [6.4474, 3.4731],
  rider = [6.4842, 3.4116],
  className,
}: TrackingMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: rider,
      zoom: 12,
      scrollWheelZoom: false,
      zoomControl: false,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    L.polyline([pickup, rider, dropoff], { color: "#0a0a0a", weight: 4, opacity: 0.85 }).addTo(map);
    L.marker(pickup).addTo(map);
    L.marker(dropoff).addTo(map);
    L.circleMarker(rider, { radius: 9, color: "#a3e635", fillColor: "#a3e635", fillOpacity: 1 }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={className} />;
};
