"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin-guard";
import {
  IGNITE_TYPE_INSTAGRAM,
  upsertIgniteBody,
} from "@/lib/ignite-data";

export type InstagramFormState = { error: string | null; saved?: boolean };

export async function updateInstagramAction(
  _prevState: InstagramFormState,
  formData: FormData,
): Promise<InstagramFormState> {
  await assertAdmin();

  const body = formData.get("instagramId")?.toString().trim() ?? "";

  try {
    await upsertIgniteBody(IGNITE_TYPE_INSTAGRAM, body);
  } catch {
    return { error: "저장에 실패했습니다." };
  }

  revalidatePath("/");

  return { error: null, saved: true };
}
