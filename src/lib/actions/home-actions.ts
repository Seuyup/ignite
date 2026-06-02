"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin-guard";
import {
  upsertHomeContents,
  upsertIgniteSeo,
  IGNITE_TYPE_HOME,
  type HomeImage,
} from "@/lib/ignite-data";

export type HomeFormState = {
  error: string | null;
  saved?: boolean;
};

export async function updateHomeImagesAction(
  _prevState: HomeFormState,
  formData: FormData,
): Promise<HomeFormState> {
  await assertAdmin();

  const logoHtml = formData.get("logoHtml")?.toString() ?? "";

  const imagesJson = formData.get("images")?.toString() ?? "[]";
  let images: HomeImage[] = [];
  try {
    const parsed = JSON.parse(imagesJson);
    if (Array.isArray(parsed)) {
      images = parsed
        .map((item: unknown) => {
          if (typeof item === "string") return { url: item, link: "" };
          if (item && typeof item === "object" && "url" in item) {
            const obj = item as Record<string, unknown>;
            return {
              url: String(obj.url ?? "").trim(),
              link: String(obj.link ?? "").trim(),
            };
          }
          return null;
        })
        .filter((v): v is HomeImage => v !== null && v.url.length > 0);
    }
  } catch {
    return { error: "이미지 데이터가 올바르지 않습니다." };
  }

  const seoTitle = formData.get("seoTitle")?.toString() ?? "";
  const seoDescription = formData.get("seoDescription")?.toString() ?? "";
  const seoOgImage = formData.get("seoOgImage")?.toString() ?? "";

  try {
    await upsertHomeContents({ logoHtml, images });
    await upsertIgniteSeo(IGNITE_TYPE_HOME, {
      title: seoTitle,
      description: seoDescription,
      ogImage: seoOgImage,
    });
  } catch {
    return { error: "저장에 실패했습니다." };
  }

  revalidatePath("/");
  revalidatePath("/admin/home");
  return { error: null, saved: true };
}
