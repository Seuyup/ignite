"use client";

import dynamic from "next/dynamic";

const StudioMap = dynamic(() => import("@/components/StudioMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full animate-pulse rounded-lg bg-neutral-100" />
  ),
});

type Props = {
  lat: number;
  lng: number;
  address?: string;
  mapTile?: string;
  zoom?: number;
};

export default function StudioMapLoader(props: Props) {
  return <StudioMap {...props} />;
}
