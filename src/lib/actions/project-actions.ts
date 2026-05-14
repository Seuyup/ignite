"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin-guard";
import { isSlugTakenByActiveProject } from "@/lib/admin-project-queries";
import { connectDB } from "@/lib/mongodb";
import { List as Project } from "@/lib/models/List";
import type { ProjectMeta } from "@/lib/project-types";

export type ProjectFormState = {
  error: string | null;
  saved?: boolean;
  savedSlug?: string;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parseMetaFromFormData(formData: FormData): ProjectMeta[] {
  const metaJson = formData.get("meta")?.toString() ?? "[]";
  try {
    const arr = JSON.parse(metaJson);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(
        (m: unknown): m is { label: string; value: string } =>
          typeof m === "object" &&
          m !== null &&
          "label" in m &&
          typeof (m as Record<string, unknown>).label === "string" &&
          "value" in m &&
          typeof (m as Record<string, unknown>).value === "string",
      )
      .map((m) => ({
        label: m.label.trim(),
        value: m.value.trim(),
      }))
      .filter((m) => m.label.length > 0);
  } catch {
    return [];
  }
}

function parseImagesFromFormData(formData: FormData): string[] {
  const imagesJson = formData.get("images")?.toString() ?? "[]";
  try {
    const arr = JSON.parse(imagesJson);
    if (!Array.isArray(arr)) return [];
    return arr.filter((u: unknown) => typeof u === "string" && u.trim().length > 0);
  } catch {
    return [];
  }
}

export async function createProjectAction(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  await assertAdmin();

  const title = formData.get("title")?.toString().trim() ?? "";
  const subTitle1 = formData.get("sub_title_1")?.toString().trim() ?? "";
  const subTitle2 = formData.get("sub_title_2")?.toString().trim() ?? "";
  const slugRaw = formData.get("slug")?.toString().trim().toLowerCase() ?? "";
  const menuId = formData.get("menu_id")?.toString().trim() ?? "";
  const coverImageUrl = formData.get("coverImageUrl")?.toString().trim() ?? "";
  const images = parseImagesFromFormData(formData);
  const meta = parseMetaFromFormData(formData);

  if (!title) return { error: "제목을 입력하세요." };
  if (!slugRaw) return { error: "URL용 slug를 입력하세요." };
  if (!SLUG_PATTERN.test(slugRaw)) {
    return { error: "slug는 영문 소문자·숫자·하이픈만 사용할 수 있습니다." };
  }
  if (!menuId) return { error: "카테고리(menu_id)가 지정되지 않았습니다." };

  try {
    await connectDB();

    const existing = await Project.findOne({ slug: slugRaw, deletedAt: null }).select("_id").lean();
    if (existing) {
      return { error: `이미 사용 중인 slug입니다. (slug: ${slugRaw})` };
    }

    const top = await Project.find({ deletedAt: null })
      .sort({ sortOrder: -1 })
      .limit(1)
      .select("sortOrder")
      .lean();
    const sortOrder = ((top[0] as any)?.sortOrder ?? 0) + 10;

    await Project.create({
      title,
      sub_title_1: subTitle1,
      sub_title_2: subTitle2,
      slug: slugRaw,
      menu_id: menuId,
      images,
      coverImageUrl: coverImageUrl || (images[0] ?? ""),
      meta,
      sortOrder,
      deletedAt: null,
    });
  } catch (e: unknown) {
    console.log("[createProjectAction] error:", e instanceof Error ? e.message : String(e));
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: number }).code === 11000
    ) {
      return { error: "이미 사용 중인 slug입니다." };
    }
    return { error: `저장에 실패했습니다. (${e instanceof Error ? e.message : String(e)})` };
  }

  revalidatePath("/admin/projects/list");
  revalidatePath("/projects");
  revalidatePath(`/projects/${slugRaw}`);
  revalidatePath("/");

  return { error: null, saved: true, savedSlug: slugRaw };
}

export async function updateProjectAction(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  await assertAdmin();

  const originalSlug = formData.get("originalSlug")?.toString().trim().toLowerCase() ?? "";
  const title = formData.get("title")?.toString().trim() ?? "";
  const subTitle1 = formData.get("sub_title_1")?.toString().trim() ?? "";
  const subTitle2 = formData.get("sub_title_2")?.toString().trim() ?? "";
  const slugRaw = formData.get("slug")?.toString().trim().toLowerCase() ?? "";
  const menuId = formData.get("menu_id")?.toString().trim() ?? "";
  const coverImageUrl = formData.get("coverImageUrl")?.toString().trim() ?? "";
  const images = parseImagesFromFormData(formData);
  const meta = parseMetaFromFormData(formData);

  if (!originalSlug) return { error: "수정 대상 slug가 없습니다." };
  if (!title) return { error: "제목을 입력하세요." };
  if (!slugRaw) return { error: "URL용 slug를 입력하세요." };
  if (!SLUG_PATTERN.test(slugRaw)) {
    return { error: "slug는 영문 소문자·숫자·하이픈만 사용할 수 있습니다." };
  }

  try {
    await connectDB();
    const current = await Project.findOne({ slug: originalSlug, deletedAt: null })
      .select("_id")
      .lean();
    if (!current) return { error: "해당 항목을 찾을 수 없습니다." };

    const id = String((current as any)._id);
    if (slugRaw !== originalSlug) {
      const taken = await isSlugTakenByActiveProject(slugRaw, id);
      if (taken) return { error: "이미 사용 중인 slug입니다." };
    }

    await Project.findOneAndUpdate(
      { slug: originalSlug, deletedAt: null },
      {
        $set: {
          title,
          sub_title_1: subTitle1,
          sub_title_2: subTitle2,
          slug: slugRaw,
          menu_id: menuId,
          images,
          coverImageUrl: coverImageUrl || (images[0] ?? ""),
          meta,
        },
      },
      { new: true },
    );

    revalidatePath("/admin/projects/list");
    revalidatePath(`/projects/${originalSlug}`);
    revalidatePath(`/projects/${slugRaw}`);
    revalidatePath("/projects");
    revalidatePath("/");

    return { error: null, saved: true, savedSlug: slugRaw };
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: number }).code === 11000
    ) {
      return { error: "이미 사용 중인 slug입니다." };
    }
    return { error: `저장에 실패했습니다. (${e instanceof Error ? e.message : String(e)})` };
  }
}
