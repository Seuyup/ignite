import { Schema, models, model } from "mongoose";

export type { ProjectMeta } from "@/lib/project-types";
export { DEFAULT_META_LABELS } from "@/lib/project-types";

const listMetaSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const listSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    sub_title_1: { type: String, default: "", trim: true },
    sub_title_2: { type: String, default: "", trim: true },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    menu_id: {
      type: String,
      required: true,
    },
    images: [{ type: String, trim: true }],
    coverImageUrl: { type: String, default: "", trim: true },
    meta: { type: [listMetaSchema], default: [] },
    sortOrder: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

listSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);
listSchema.index({ menu_id: 1 });

export const List =
  models.List ?? model("List", listSchema, "list");
