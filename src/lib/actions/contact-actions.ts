"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin-guard";
import { connectDB } from "@/lib/mongodb";
import { ContactSettings } from "@/lib/models/ContactSettings";

export type ContactFormState = { error: string | null; saved?: boolean };

const SINGLETON_KEY = "default";

export async function updateContactAction(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  await assertAdmin();

  const body = formData.get("body")?.toString() ?? "";

  try {
    await connectDB();
    await ContactSettings.findOneAndUpdate(
      { singletonKey: SINGLETON_KEY },
      { $set: { body } },
      { upsert: true, new: true },
    );
  } catch {
    return { error: "저장에 실패했습니다." };
  }

  revalidatePath("/contact");

  return { error: null, saved: true };
}
