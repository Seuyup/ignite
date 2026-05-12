import mongoose, { Schema, models, model } from "mongoose";

const projectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    /** Tiptap 등에서 저장한 HTML 본문 */
    contentHtml: { type: String, default: "" },
    /** 목록·상단 히어로용 대표 이미지 URL (R2 등) */
    coverImageUrl: { type: String, default: "", trim: true },
    /** 목록 정렬 (작을수록 앞) */
    sortOrder: { type: Number, default: 0 },
    /** 소프트 삭제 시각. null 이면 활성 */
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

/** 활성 문서끼리 slug 유일 (휴지통은 partial 제외로 동일 slug 허용 가능) */
projectSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);

export const Project =
  models.Project ?? model("Project", projectSchema);
