import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { verifyAdminToken } from "@/lib/admin-session";

export default async function AdminLoginPage() {
  const token = (await cookies()).get("admin_token")?.value;
  if (verifyAdminToken(token)) {
    redirect("/admin");
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <h1 className="text-lg font-medium text-neutral-900">
        관리자 로그인
      </h1>
      <p className="mt-4 max-w-md text-sm text-neutral-500">
        콘텐츠 편집 전 환경 변수에 설정한 관리자 비밀번호를 입력하세요.
      </p>
      <div className="mt-10">
        <LoginForm />
      </div>
    </div>
  );
}
