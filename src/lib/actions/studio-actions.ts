"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin-guard";
import {
  upsertStudioBodies,
  upsertStudioLocation,
  upsertIgniteSeo,
  IGNITE_TYPE_STUDIO,
} from "@/lib/ignite-data";

export type StudioFormState = {
  error: string | null;
  saved?: boolean;
};

export async function updateStudioAction(
  _prevState: StudioFormState,
  formData: FormData,
): Promise<StudioFormState> {
  await assertAdmin();

  const bodyTop = formData.get("bodyTop")?.toString() ?? "";
  const bodyBottom = formData.get("bodyBottom")?.toString() ?? "";

  const lat = parseFloat(formData.get("lat")?.toString() ?? "");
  const lng = parseFloat(formData.get("lng")?.toString() ?? "");
  const mapType = formData.get("mapType")?.toString() || "NORMAL";
  const zoom = parseInt(formData.get("zoom")?.toString() ?? "16", 10) || 16;
  const showZoomControl = formData.get("showZoomControl") === "true";
  const showScaleControl = formData.get("showScaleControl") === "true";
  const showMapTypeControl = formData.get("showMapTypeControl") === "true";
  const scrollWheel = formData.get("scrollWheel") === "true";
  const draggable = formData.get("draggable") === "true";

  const seoTitle = formData.get("seoTitle")?.toString() ?? "";
  const seoDescription = formData.get("seoDescription")?.toString() ?? "";
  const seoOgImage = formData.get("seoOgImage")?.toString() ?? "";

  try {
    await upsertStudioBodies(bodyTop, bodyBottom);

    if (!isNaN(lat) && !isNaN(lng)) {
      await upsertStudioLocation({
        lat, lng, mapType, zoom,
        showZoomControl, showScaleControl, showMapTypeControl,
        scrollWheel, draggable,
      });
    }

    await upsertIgniteSeo(IGNITE_TYPE_STUDIO, {
      title: seoTitle,
      description: seoDescription,
      ogImage: seoOgImage,
    });
  } catch {
    return { error: "저장에 실패했습니다." };
  }

  revalidatePath("/studio");
  return { error: null, saved: true };
}
