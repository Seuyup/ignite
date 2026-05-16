import { Schema, models, model } from "mongoose";

/**
 * Menu 컬렉션 - 다목적 스토어.
 *
 * 메뉴 구조:
 *   sort: "top_menu" → 상위 메뉴 (예: type="project", type="studio")
 *   sort: "child_menu" → 하위 메뉴 (예: type="architecture", parent_id로 상위 참조)
 *
 * 콘텐츠:
 *   type: "home" → body에 JSON (이미지 URL 배열)
 *   type: "studio" → bodyTop / bodyBottom에 HTML (지도 상하단)
 *
 * 개별 페이지:
 *   sort: "individual" → title(페이지명) + body(HTML 콘텐츠) + type(URL slug)
 *
 * 위치(선택):
 *   location.lat / location.lng → 지도 좌표
 *   location.mapType → 네이버 지도 유형 (NORMAL, SATELLITE, HYBRID, TERRAIN)
 */
const menuSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    title: { type: String, default: "" },
    body: { type: String, default: "" },
    bodyTop: { type: String, default: "" },
    bodyBottom: { type: String, default: "" },
    sort: {
      type: String,
      enum: ["top_menu", "child_menu", "individual", null],
      default: null,
    },
    parent_id: {
      type: Schema.Types.Mixed,
      default: null,
    },
    sortOrder: { type: Number, default: 0 },
    seo: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      ogImage: { type: String, default: "" },
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      mapTile: { type: String, default: null },
      mapType: { type: String, default: "NORMAL" },
      zoom: { type: Number, default: 16 },
      showZoomControl: { type: Boolean, default: true },
      showScaleControl: { type: Boolean, default: true },
      showMapTypeControl: { type: Boolean, default: false },
      scrollWheel: { type: Boolean, default: false },
      draggable: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

menuSchema.index({ type: 1 }, { unique: true });
menuSchema.index({ sort: 1 });
menuSchema.index({ parent_id: 1 });

export const Menu =
  models.Menu ?? model("Menu", menuSchema, "menu");
