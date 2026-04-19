import { MapContainer, TileLayer, Marker, Polyline, CircleMarker } from "react-leaflet";
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

// Lagos default centers
const LAGOS_CENTER: [number, number] = [6.5244, 3.3792];

export const TrackingMap = ({
  pickup = [6.5095, 3.3711], // Yaba area
  dropoff = [6.4474, 3.4731], // Lekki area
  rider = [6.4842, 3.4116], // Third Mainland Bridge area
  className,
}: TrackingMapProps) => {
  return (
    <div className={className}>
      <MapContainer
        center={rider || LAGOS_CENTER}
        zoom={12}
        scrollWheelZoom={false}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={[pickup, rider, dropoff]} pathOptions={{ color: "#0a0a0a", weight: 4, opacity: 0.85 }} />
        <Marker position={pickup} />
        <Marker position={dropoff} />
        <CircleMarker center={rider} radius={9} pathOptions={{ color: "#a3e635", fillColor: "#a3e635", fillOpacity: 1 }} />
      </MapContainer>
    </div>
  );
};
