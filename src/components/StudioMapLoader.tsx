"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { StudioMapProps } from "@/components/StudioMap";

const NAVER_MAPS_SCRIPT_ID = "naver-maps-sdk";

function useNaverMapsReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.naver?.maps) {
      setReady(true);
      return;
    }

    const existing = document.getElementById(NAVER_MAPS_SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => setReady(true));
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    if (!clientId) {
      console.warn("NEXT_PUBLIC_NAVER_MAP_CLIENT_ID is not set");
      return;
    }

    const script = document.createElement("script");
    script.id = NAVER_MAPS_SCRIPT_ID;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, []);

  return ready;
}

function MapPlaceholder(): ReactNode {
  return (
    <div className="flex h-[400px] w-full items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100">
      <span className="text-xs text-neutral-400">지도 로딩 중…</span>
    </div>
  );
}

export default function StudioMapLoader(props: StudioMapProps) {
  const ready = useNaverMapsReady();

  if (!ready) return <MapPlaceholder />;

  const StudioMap =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@/components/StudioMap").default as React.ComponentType<StudioMapProps>;

  return <StudioMap {...props} />;
}
