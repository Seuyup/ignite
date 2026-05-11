"use server";

import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/admin-guard";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";

export type ProjectFormState = { error: string | null };

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function createProjectAction(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  await assertAdmin();

  const title = formData.get("title")?.toString().trim() ?? "";
  const subtitle = formData.get("subtitle")?.toString().trim() ?? "";
  const slugRaw = formData.get("slug")?.toString().trim().toLowerCase() ?? "";
  const contentHtml = formData.get("contentHtml")?.toString() ?? "";
  const coverImageUrl = formData.get("coverImageUrl")?.toString().trim() ?? "";

  if (!title) {
    return { error: "프로젝트 제목을 입력하세요." };
  }
  if (!slugRaw) {
    return { error: "URL용 slug를 입력하세요. (영문 소문자, 숫자, 하이픈)" };
  }
  if (!SLUG_PATTERN.test(slugRaw)) {
    return {
      error:
        "slug는 영문 소문자·숫자·하이픈만 사용할 수 있습니다. (예: my-project-name)",
    };
  }

  try {
    await connectDB();
    await Project.create({
      title,
      subtitle: subtitle || undefined,
      slug: slugRaw,
      contentHtml,
      coverImageUrl: coverImageUrl || undefined,
    });
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: number }).code === 11000
    ) {
      return { error: "이미 사용 중인 slug입니다. 다른 값을 입력하세요." };
    }
    return { error: "저장에 실패했습니다. 잠시 후 다시 시도하세요." };
  }

  redirect(`/projects/${slugRaw}`);
}

export async function updateProjectAction(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  await assertAdmin();

  const originalSlug =
    formData.get("originalSlug")?.toString().trim().toLowerCase() ?? "";
  const title = formData.get("title")?.toString().trim() ?? "";
  const subtitle = formData.get("subtitle")?.toString().trim() ?? "";
  const contentHtml = formData.get("contentHtml")?.toString() ?? "";
  const coverImageUrl = formData.get("coverImageUrl")?.toString().trim() ?? "";

  if (!originalSlug) {
    return { error: "수정 대상 slug가 없습니다." };
  }
  if (!title) {
    return { error: "프로젝트 제목을 입력하세요." };
  }

  try {
    await connectDB();
    const updated = await Project.findOneAndUpdate(
      { slug: originalSlug },
      {
        $set: {
          title,
          subtitle: subtitle || undefined,
          contentHtml,
          coverImageUrl: coverImageUrl || "",
        },
      },
      { new: true },
    ).lean();

    if (!updated) {
      return { error: "해당 프로젝트를 찾을 수 없습니다. 목록에서 다시 선택하세요." };
    }
  } catch {
    return { error: "저장에 실패했습니다. 잠시 후 다시 시도하세요." };
  }

  redirect(`/projects/${originalSlug}`);
}
