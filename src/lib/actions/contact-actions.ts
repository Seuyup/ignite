"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin-guard";
import {
  upsertIgniteBody,
  upsertIgniteSeo,
  IGNITE_TYPE_CONTACT,
} from "@/lib/ignite-data";

export type ContactFormState = {
  error: string | null;
  saved?: boolean;
};

export async function updateContactAction(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  await assertAdmin();

  const body = formData.get("body")?.toString() ?? "";
  const seoTitle = formData.get("seoTitle")?.toString() ?? "";
  const seoDescription = formData.get("seoDescription")?.toString() ?? "";
  const seoOgImage = formData.get("seoOgImage")?.toString() ?? "";

  try {
    await upsertIgniteBody(IGNITE_TYPE_CONTACT, body);
    await upsertIgniteSeo(IGNITE_TYPE_CONTACT, {
      title: seoTitle,
      description: seoDescription,
      ogImage: seoOgImage,
    });
  } catch {
    return { error: "저장에 실패했습니다." };
  }

  revalidatePath("/contact");
  return { error: null, saved: true };
}
