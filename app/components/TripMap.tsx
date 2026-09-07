"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import { useEffect, useMemo } from "react";

export type MapCategory = "destination" | "hotel" | "restaurant" | "attraction" | "hospital" | "fuel" | "transport";

export type MapPoint = {
  id: string;
  name: string;
  category: MapCategory;
  lat: number;
  lng: number;
  subtitle: string;
  detail?: string;
  routeOrder?: number;
  image?: string;
};

type Props = {
  center: [number, number];
  points: MapPoint[];
  route: MapPoint[];
  selectedId?: string;
  onSelect?: (point: MapPoint) => void;
};

const markerColors: Record<MapCategory, string> = {
  destination: "#0b63ce",
  hotel: "#7c4dff",
  restaurant: "#e8890c",
  attraction: "#16a34a",
  hospital: "#d9485f",
  fuel: "#475569",
  transport: "#0f766e",
};

function pinIcon(category: MapCategory, order?: number) {
  const color = markerColors[category];
  const label = order ? String(order) : category === "destination" ? "D" : "";
  return L.divIcon({
    className: "travelsetu-pin-wrap",
    html: `<span style="--pin-color:${color}" class="travelsetu-pin"><span class="travelsetu-pin-label">${label}</span></span>`,
    iconSize: [36, 42],
    iconAnchor: [18, 41],
    popupAnchor: [0, -37],
  });
}

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.2), { maxZoom: 13, animate: true });
  }, [map, points]);
  return null;
}

export default function TripMap({ center, points, route, selectedId, onSelect }: Props) {
  const routePositions = useMemo(() => route.map((point) => [point.lat, point.lng] as [number, number]), [route]);
  return (
    <div className="relative h-full min-h-[520px] overflow-hidden rounded-[28px] border border-[#dfe8f1] bg-[#eaf2f8] shadow-[0_18px_45px_rgba(20,55,95,.09)]">
      <MapContainer center={center} zoom={11} scrollWheelZoom className="z-0 h-full min-h-[520px] w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {routePositions.length > 1 && <Polyline positions={routePositions} pathOptions={{ color: "#0b63ce", weight: 5, opacity: 0.85, dashArray: "10 7" }} />}
        {points.map((point) => (
          point.category === "destination" ? (
            <Marker key={point.id} position={[point.lat, point.lng]} icon={pinIcon(point.category, point.routeOrder)} eventHandlers={{ click: () => onSelect?.(point) }}>
              <Tooltip direction="top" offset={[0, -35]} permanent>{point.routeOrder ? `${point.routeOrder}. ${point.name}` : point.name}</Tooltip>
              <Popup>
                <div className="min-w-[210px]">
                  <div className="text-[14px] font-black text-[#10243e]">{point.name}</div>
                  <div className="mt-1 text-[11px] font-bold text-[#6d7c90]">{point.subtitle}</div>
                  {point.detail && <p className="mt-2 text-[11px] leading-5 text-[#52657c]">{point.detail}</p>}
                </div>
              </Popup>
            </Marker>
          ) : (
            <Marker key={point.id} position={[point.lat, point.lng]} icon={pinIcon(point.category, point.routeOrder)} eventHandlers={{ click: () => onSelect?.(point) }}>
              <Popup>
                <div className="min-w-[210px]">
                  <div className="text-[14px] font-black text-[#10243e]">{point.name}</div>
                  <div className="mt-1 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#0b63ce]">{point.category}</div>
                  <div className="mt-1 text-[11px] font-bold text-[#6d7c90]">{point.subtitle}</div>
                  {point.detail && <p className="mt-2 text-[11px] leading-5 text-[#52657c]">{point.detail}</p>}
                </div>
              </Popup>
            </Marker>
          )
        ))}
        {route.slice(0, -1).map((point) => (
          <CircleMarker key={`circle-${point.id}`} center={[point.lat, point.lng]} radius={5} pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#0b63ce", fillOpacity: 1 }} />
        ))}
      </MapContainer>
      <div className="pointer-events-none absolute bottom-4 left-4 z-[500] rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
        <div className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#0b63ce]">TravelSetu Route</div>
        <div className="mt-1 text-[11px] font-bold text-[#53657a]">Blue line = demo route between planned stops</div>
      </div>
      {selectedId && <div className="pointer-events-none absolute right-4 top-4 z-[500] rounded-full border border-[#dcecff] bg-white/95 px-3 py-2 text-[10px] font-extrabold text-[#0b63ce] shadow-lg">Selected stop</div>}
    </div>
  );
}
