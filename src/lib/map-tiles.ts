export type NaverMapType = "NORMAL" | "SATELLITE" | "HYBRID" | "TERRAIN";

export type NaverMapConfig = {
  mapType: NaverMapType;
  showZoomControl: boolean;
  showScaleControl: boolean;
  showMapTypeControl: boolean;
  scrollWheel: boolean;
  draggable: boolean;
};

export const NAVER_MAP_TYPE_OPTIONS: { key: NaverMapType; label: string }[] = [
  { key: "NORMAL", label: "일반 지도" },
  { key: "SATELLITE", label: "위성 지도" },
  { key: "HYBRID", label: "하이브리드 (위성+라벨)" },
  { key: "TERRAIN", label: "지형도" },
];

export const DEFAULT_MAP_CONFIG: NaverMapConfig = {
  mapType: "NORMAL",
  showZoomControl: true,
  showScaleControl: true,
  showMapTypeControl: false,
  scrollWheel: false,
  draggable: true,
};
