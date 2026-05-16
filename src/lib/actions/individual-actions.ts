"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin-guard";
import {
  upsertIndividualPage,
  deleteIndividualPage,
} from "@/lib/ignite-data";
import { connectDB } from "@/lib/mongodb";
import { Menu } from "@/lib/models/Menu";

export type IndividualFormState = {
  error: string | null;
  saved?: boolean;
  deleted?: boolean;
};

export async function updateIndividualAction(
  _prevState: IndividualFormState,
  formData: FormData,
): Promise<IndividualFormState> {
  await assertAdmin();

  const id = formData.get("id")?.toString() || undefined;
  const type = formData.get("type")?.toString()?.trim() ?? "";
  const title = formData.get("title")?.toString()?.trim() ?? "";
  const body = formData.get("body")?.toString() ?? "";
  const seoTitle = formData.get("seoTitle")?.toString() ?? "";
  const seoDescription = formData.get("seoDescription")?.toString() ?? "";
  const seoOgImage = formData.get("seoOgImage")?.toString() ?? "";

  if (!type) return { error: "URL slug는 필수입니다." };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(type)) {
    return { error: "URL slug는 영문 소문자, 숫자, 하이픈만 사용 가능합니다." };
  }
  if (!title) return { error: "페이지 제목은 필수입니다." };

  try {
    await connectDB();

    if (!id) {
      const existing = await Menu.findOne({ type }).select("_id").lean();
      if (existing) {
        return { error: `이미 사용 중인 slug입니다. (slug: ${type})` };
      }
    }

    await upsertIndividualPage({
      id,
      type,
      title,
      body,
      seo: {
        title: seoTitle,
        description: seoDescription,
        ogImage: seoOgImage,
      },
    });
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: number }).code === 11000
    ) {
      return { error: `이미 사용 중인 slug입니다. (slug: ${type})` };
    }
    return { error: "저장에 실패했습니다." };
  }

  revalidatePath("/admin/pages");
  revalidatePath(`/p/${type}`);
  return { error: null, saved: true };
}

export async function deleteIndividualAction(
  _prevState: IndividualFormState,
  formData: FormData,
): Promise<IndividualFormState> {
  await assertAdmin();

  const id = formData.get("id")?.toString() ?? "";
  if (!id) return { error: "삭제할 페이지 ID가 없습니다." };

  try {
    await deleteIndividualPage(id);
  } catch {
    return { error: "삭제에 실패했습니다." };
  }

  revalidatePath("/admin/pages");
  return { error: null, deleted: true };
}
