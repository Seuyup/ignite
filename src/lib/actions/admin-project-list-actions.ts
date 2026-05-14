"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin-guard";
import { connectDB } from "@/lib/mongodb";
import { List as Project } from "@/lib/models/List";
import { isSlugTakenByActiveProject } from "@/lib/admin-project-queries";
import mongoose from "mongoose";

export type IdActionState = { error: string | null };

const initial: IdActionState = { error: null };

export async function softDeleteProjectAction(
  _prev: IdActionState,
  formData: FormData,
): Promise<IdActionState> {
  await assertAdmin();
  const id = formData.get("id")?.toString().trim() ?? "";
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: "잘못된 항목입니다." };
  }
  try {
    await connectDB();
    const r = await Project.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
    );
    if (!r) return { error: "이미 삭제되었거나 없는 프로젝트입니다." };
  } catch {
    return { error: "삭제에 실패했습니다." };
  }
  revalidatePath("/admin/projects/list");
  revalidatePath("/admin/projects/trash");
  revalidatePath("/projects");
  revalidatePath("/");
  return initial;
}

export async function restoreProjectAction(
  _prev: IdActionState,
  formData: FormData,
): Promise<IdActionState> {
  await assertAdmin();
  const id = formData.get("id")?.toString().trim() ?? "";
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: "잘못된 항목입니다." };
  }
  try {
    await connectDB();
    const doc = await Project.findOne({
      _id: id,
      deletedAt: { $ne: null },
    }).lean();
    if (!doc) return { error: "휴지통에 없거나 이미 복원된 항목입니다." };
    const taken = await isSlugTakenByActiveProject(doc.slug);
    if (taken) {
      return {
        error:
          "같은 slug가 이미 활성 프로젝트에 사용 중입니다. slug를 바꾼 뒤 복원하거나 기존 프로젝트를 정리하세요.",
      };
    }
    await Project.updateOne(
      { _id: id },
      { $set: { deletedAt: null } },
    );
  } catch {
    return { error: "복원에 실패했습니다." };
  }
  revalidatePath("/admin/projects/list");
  revalidatePath("/admin/projects/trash");
  revalidatePath("/projects");
  revalidatePath("/");
  return initial;
}

export async function permanentDeleteProjectAction(
  _prev: IdActionState,
  formData: FormData,
): Promise<IdActionState> {
  await assertAdmin();
  const id = formData.get("id")?.toString().trim() ?? "";
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: "잘못된 항목입니다." };
  }
  try {
    await connectDB();
    const r = await Project.deleteOne({
      _id: id,
      deletedAt: { $ne: null },
    });
    if (r.deletedCount === 0) {
      return { error: "영구 삭제할 휴지통 항목만 선택할 수 있습니다." };
    }
  } catch {
    return { error: "영구 삭제에 실패했습니다." };
  }
  revalidatePath("/admin/projects/trash");
  return initial;
}
