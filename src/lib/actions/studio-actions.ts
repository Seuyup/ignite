"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin-guard";
import { upsertIgniteBody, IGNITE_TYPE_STUDIO } from "@/lib/ignite-data";

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

  try {
    await upsertIgniteBody(IGNITE_TYPE_STUDIO, body);
  } catch {
    return { error: "저장에 실패했습니다." };
  }

  revalidatePath("/studio");
  return { error: null, saved: true };
}
