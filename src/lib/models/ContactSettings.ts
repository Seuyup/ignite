import mongoose, { Schema, models, model } from "mongoose";

const contactSettingsSchema = new Schema(
  {
    singletonKey: {
      type: String,
      default: "default",
      unique: true,
      immutable: true,
    },
    body: { type: String, default: "" },
  },
  { timestamps: true },
);

export const ContactSettings =
  models.ContactSettings ??
  model("ContactSettings", contactSettingsSchema);
