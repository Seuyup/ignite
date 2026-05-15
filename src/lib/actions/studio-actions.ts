"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin-guard";
import {
  upsertIgniteBody,
  upsertStudioLocation,
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

  const body = formData.get("body")?.toString() ?? "";

  const lat = parseFloat(formData.get("lat")?.toString() ?? "");
  const lng = parseFloat(formData.get("lng")?.toString() ?? "");
  const address = formData.get("address")?.toString() ?? "";
  const mapTile = formData.get("mapTile")?.toString() || "stadia_stamen_toner";
  const zoom = parseInt(formData.get("zoom")?.toString() ?? "16", 10) || 16;

  try {
    await upsertIgniteBody(IGNITE_TYPE_STUDIO, body);

    if (!isNaN(lat) && !isNaN(lng)) {
      await upsertStudioLocation({ lat, lng, address, mapTile, zoom });
    }
  } catch {
    return { error: "저장에 실패했습니다." };
  }

  revalidatePath("/studio");
  return { error: null, saved: true };
}
