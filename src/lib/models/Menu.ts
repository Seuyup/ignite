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
 *   type: "studio" → body에 HTML
 */
const menuSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    body: { type: String, default: "" },
    sort: {
      type: String,
      enum: ["top_menu", "child_menu", null],
      default: null,
    },
    parent_id: {
      type: Schema.Types.Mixed,
      default: null,
    },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

menuSchema.index({ type: 1 }, { unique: true });
menuSchema.index({ sort: 1 });
menuSchema.index({ parent_id: 1 });

export const Menu =
  models.Menu ?? model("Menu", menuSchema, "menu");
