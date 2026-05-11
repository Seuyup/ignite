import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/actions/login-actions";
import { verifyAdminToken } from "@/lib/admin-session";

export default async function AdminPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = (await cookies()).get("admin_token")?.value;
  if (!verifyAdminToken(token)) {
    redirect("/admin/login");
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <nav
        className="mb-10 flex flex-wrap items-center gap-6 border-b border-neutral-200 pb-6 text-sm"
        aria-label="관리자 메뉴"
      >
        <Link
          href="/admin/projects/list"
          className="text-neutral-600 transition-colors hover:text-neutral-900"
        >
          프로젝트
        </Link>
        <Link
          href="/admin/contact"
          className="text-neutral-600 transition-colors hover:text-neutral-900"
        >
          연락처
        </Link>
        <form action={logoutAction} className="ml-auto">
          <button
            type="submit"
            className="text-neutral-500 transition-colors hover:text-neutral-900"
          >
            로그아웃
          </button>
        </form>
      </nav>
      {children}
    </div>
  );
}
