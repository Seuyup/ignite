"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getTileByKey } from "@/lib/map-tiles";

type Props = {
  lat: number;
  lng: number;
  address?: string;
  mapTile?: string;
  zoom?: number;
};

const MARKER_ICON = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function StudioMap({
  lat,
  lng,
  address,
  mapTile = "stadia_stamen_toner",
  zoom = 16,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const tile = getTileByKey(mapTile);
    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
    }).setView([lat, lng], zoom);

    L.tileLayer(tile.url, {
      attribution: tile.attribution,
      maxZoom: 20,
    }).addTo(map);

    const marker = L.marker([lat, lng], { icon: MARKER_ICON }).addTo(map);
    if (address) marker.bindPopup(address);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [lat, lng, address, mapTile, zoom]);

  return (
    <div
      ref={containerRef}
      className="relative z-0 h-[400px] w-full rounded-lg border border-neutral-200"
    />
  );
}
