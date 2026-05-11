"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminToken } from "@/lib/admin-session";

export type LoginState = { error: string | null };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = formData.get("password")?.toString() ?? "";

  if (!process.env.ADMIN_PASSWORD) {
    return {
      error:
        "ADMIN_PASSWORD가 설정되어 있지 않습니다. 서버 환경 변수를 확인하세요.",
    };
  }
  if (!process.env.ADMIN_SECRET) {
    return {
      error:
        "ADMIN_SECRET이 설정되어 있지 않습니다. 서버 환경 변수를 확인하세요.",
    };
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return { error: "비밀번호가 올바르지 않습니다." };
  }

  let token: string;
  try {
    token = createAdminToken();
  } catch {
    return { error: "관리자 세션을 만들 수 없습니다. ADMIN_SECRET을 확인하세요." };
  }

  (await cookies()).set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/admin");
}

export async function logoutAction() {
  (await cookies()).delete("admin_token");
  redirect("/admin/login");
}
