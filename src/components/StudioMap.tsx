"use client";

import { useEffect, useRef } from "react";
import type { NaverMapType } from "@/lib/map-tiles";

export type StudioMapProps = {
  lat: number;
  lng: number;
  mapType?: NaverMapType;
  zoom?: number;
  showZoomControl?: boolean;
  showScaleControl?: boolean;
  showMapTypeControl?: boolean;
  scrollWheel?: boolean;
  draggable?: boolean;
};

declare global {
  interface Window {
    naver: typeof naver;
  }
}

const MAP_TYPE_MAP: Record<string, () => naver.maps.MapTypeId> = {
  NORMAL: () => naver.maps.MapTypeId.NORMAL,
  SATELLITE: () => naver.maps.MapTypeId.SATELLITE,
  HYBRID: () => naver.maps.MapTypeId.HYBRID,
  TERRAIN: () => naver.maps.MapTypeId.TERRAIN,
};

export default function StudioMap({
  lat,
  lng,
  mapType = "NORMAL",
  zoom = 16,
  showZoomControl = true,
  showScaleControl = true,
  showMapTypeControl = false,
  scrollWheel = false,
  draggable = true,
}: StudioMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const markerRef = useRef<naver.maps.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || !window.naver?.maps) return;

    const position = new naver.maps.LatLng(lat, lng);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.destroy();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }

    const resolvedTypeId = (MAP_TYPE_MAP[mapType] ?? MAP_TYPE_MAP.NORMAL)();

    const map = new naver.maps.Map(containerRef.current, {
      center: position,
      zoom,
      scrollWheel,
      draggable,
      mapTypeId: resolvedTypeId,
      zoomControl: showZoomControl,
      zoomControlOptions: {
        position: naver.maps.Position.TOP_RIGHT,
      },
      scaleControl: showScaleControl,
      scaleControlOptions: {
        position: naver.maps.Position.BOTTOM_RIGHT,
      },
      mapTypeControl: showMapTypeControl,
      mapTypeControlOptions: {
        position: naver.maps.Position.TOP_LEFT,
      },
    });

    const marker = new naver.maps.Marker({
      position,
      map,
    });

    markerRef.current = marker;
    mapInstanceRef.current = map;

    return () => {
      map.destroy();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [lat, lng, mapType, zoom, showZoomControl, showScaleControl, showMapTypeControl, scrollWheel, draggable]);

  return (
    <div
      ref={containerRef}
      className="relative z-0 h-[400px] w-full rounded-lg border border-neutral-200"
    />
  );
}
