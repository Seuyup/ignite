"use client";

import { useCallback, useEffect, useRef } from "react";
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
        mapTypeIds: [
          naver.maps.MapTypeId.NORMAL,
          naver.maps.MapTypeId.SATELLITE,
          naver.maps.MapTypeId.HYBRID,
          naver.maps.MapTypeId.TERRAIN,
        ],
        style: naver.maps.MapTypeControlStyle.BUTTON,
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

  const openNaverMap = useCallback(() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const label = "IGNITE";

    if (isMobile) {
      const appUrl = `nmap://place?lat=${lat}&lng=${lng}&name=${encodeURIComponent(label)}&appname=${window.location.hostname}`;

      const start = Date.now();
      window.location.href = appUrl;

      setTimeout(() => {
        if (Date.now() - start < 1500) {
          window.open(
            `https://map.naver.com/p/search/${encodeURIComponent(`${lat},${lng}`)}`,
            "_blank",
            "noopener,noreferrer",
          );
        }
      }, 1000);
    } else {
      window.open(
        `https://map.naver.com/p/search/${lat},${lng}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  }, [lat, lng, zoom]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="relative z-0 h-[400px] w-full rounded-lg border border-neutral-200"
      />
      <button
        type="button"
        onClick={openNaverMap}
        className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-xs font-medium text-neutral-700 shadow-md transition-colors hover:bg-neutral-50 active:bg-neutral-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path
            fillRule="evenodd"
            d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
            clipRule="evenodd"
          />
        </svg>
        네이버 지도에서 보기
      </button>
    </div>
  );
}
