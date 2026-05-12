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
        className="mb-10 flex flex-wrap items-center gap-6 border-b border-neutral-200 pb-6 text-sm uppercase tracking-[0.12em]"
        aria-label="관리자 메뉴"
      >
        <Link
          href="/admin/projects/list"
          className="rounded-md px-2 py-1 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          project
        </Link>
        <Link
          href="/admin/contact"
          className="rounded-md px-2 py-1 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          contact
        </Link>
        <Link
          href="/admin/instagram"
          className="rounded-md px-2 py-1 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          @instagram
        </Link>
        <form action={logoutAction} className="ml-auto">
          <button
            type="submit"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-500 transition-colors hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-900"
          >
            로그아웃
          </button>
        </form>
      </nav>
      {children}
    </div>
  );
}
