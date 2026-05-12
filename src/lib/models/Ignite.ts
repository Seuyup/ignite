import mongoose, { Schema, models, model } from "mongoose";

/**
 * 범용 키–값 스토어. `contactsettings` / `instagram` 등 `type`당 문서 하나.
 * MongoDB 컬렉션 이름은 `ignite`.
 */
const igniteSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    body: { type: String, default: "" },
  },
  { timestamps: true },
);

igniteSchema.index({ type: 1 }, { unique: true });

export const Ignite =
  models.Ignite ?? model("Ignite", igniteSchema, "ignite");
