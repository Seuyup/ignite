export type MapTileConfig = {
  key: string;
  label: string;
  url: string;
  attribution: string;
  lang: "ko" | "en";
};

export const MAP_TILES: MapTileConfig[] = [
  // ── 한글 ──
  {
    key: "osm_korean",
    label: "[한글] OpenStreetMap 기본",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    lang: "ko",
  },
  {
    key: "osm_kr_hot",
    label: "[한글] OpenStreetMap Korea (HOT)",
    url: "https://tiles.osm.kr/hot/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles courtesy of <a href="https://osm.kr/">OSM Korea</a>',
    lang: "ko",
  },
  {
    key: "cartodb_positron_ko",
    label: "[한글] CartoDB Positron (밝은)",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?lang=ko",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    lang: "ko",
  },
  {
    key: "cartodb_dark_matter_ko",
    label: "[한글] CartoDB Dark Matter (어두운)",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?lang=ko",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    lang: "ko",
  },
  {
    key: "cartodb_voyager_ko",
    label: "[한글] CartoDB Voyager (컬러)",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?lang=ko",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    lang: "ko",
  },
  {
    key: "cartodb_voyager_nolabel_ko",
    label: "[한글] CartoDB Voyager (라벨 하단)",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png?lang=ko",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    lang: "ko",
  },
  // ── 영문 ──
  {
    key: "stadia_stamen_toner",
    label: "[영문] Stamen Toner",
    url: "https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    lang: "en",
  },
  {
    key: "stadia_stamen_toner_lite",
    label: "[영문] Stamen Toner Lite",
    url: "https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    lang: "en",
  },
  {
    key: "stadia_stamen_watercolor",
    label: "[영문] Stamen Watercolor",
    url: "https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg",
    attribution:
      '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    lang: "en",
  },
  {
    key: "stadia_alidade_smooth",
    label: "[영문] Alidade Smooth (밝은)",
    url: "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    lang: "en",
  },
  {
    key: "stadia_alidade_smooth_dark",
    label: "[영문] Alidade Smooth Dark (어두운)",
    url: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    lang: "en",
  },
  {
    key: "osm_standard",
    label: "[영문] OpenStreetMap Standard",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    lang: "en",
  },
  {
    key: "cartodb_positron",
    label: "[영문] CartoDB Positron",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    lang: "en",
  },
  {
    key: "cartodb_dark_matter",
    label: "[영문] CartoDB Dark Matter",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    lang: "en",
  },
  {
    key: "cartodb_voyager",
    label: "[영문] CartoDB Voyager",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    lang: "en",
  },
];

export function getTileByKey(key: string): MapTileConfig {
  return (
    MAP_TILES.find((t) => t.key === key) ?? MAP_TILES[0]
  );
}
