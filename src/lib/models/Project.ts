import mongoose, { Schema, models, model } from "mongoose";

const projectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    /** Tiptap 등에서 저장한 HTML 본문 */
    contentHtml: { type: String, default: "" },
    /** 목록·상단 히어로용 대표 이미지 URL (R2 등) */
    coverImageUrl: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

export const Project =
  models.Project ?? model("Project", projectSchema);
