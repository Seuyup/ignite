"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { logoutAction } from "@/lib/actions/login-actions";

type CategoryOption = {
  id: string;
  type: string;
  label: string;
};

type Props = {
  categories: CategoryOption[];
  activeCategory?: string;
};

export function AdminPanelNav({ categories, activeCategory }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = activeCategory || searchParams.get("category") || "";
  const [projectsOpen, setProjectsOpen] = useState(
    pathname.startsWith("/admin/projects"),
  );

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <nav
      className="mb-10 border-b border-neutral-200 pb-6 text-sm uppercase tracking-[0.12em]"
      aria-label="관리자 메뉴"
    >
      <div className="flex flex-wrap items-center gap-6">
        <Link
          href="/admin/home"
          className={`rounded-md px-2 py-1 transition-colors hover:bg-neutral-100 hover:text-neutral-900 ${
            isActive("/admin/home") ? "bg-neutral-100 text-neutral-900" : "text-neutral-600"
          }`}
        >
          Home
        </Link>
        <button
          type="button"
          onClick={() => setProjectsOpen(!projectsOpen)}
          className={`flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-neutral-100 hover:text-neutral-900 ${
            isActive("/admin/projects") ? "bg-neutral-100 text-neutral-900" : "text-neutral-600"
          }`}
        >
          PROJECTS
          <svg
            className={`h-3 w-3 transition-transform duration-200 ${projectsOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <Link
          href="/admin/studio"
          className={`rounded-md px-2 py-1 transition-colors hover:bg-neutral-100 hover:text-neutral-900 ${
            isActive("/admin/studio") ? "bg-neutral-100 text-neutral-900" : "text-neutral-600"
          }`}
        >
          Studio
        </Link>
        <Link
          href="/admin/contact"
          className={`rounded-md px-2 py-1 transition-colors hover:bg-neutral-100 hover:text-neutral-900 ${
            isActive("/admin/contact") ? "bg-neutral-100 text-neutral-900" : "text-neutral-600"
          }`}
        >
          Contact
        </Link>
        <form action={logoutAction} className="ml-auto">
          <button
            type="submit"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-500 transition-colors hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-900"
          >
            로그아웃
          </button>
        </form>
      </div>

      {projectsOpen && (
        <div className="mt-4 flex flex-wrap gap-2 pl-2">
          {categories.length > 0 ? (
            categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/admin/projects/list?category=${cat.id}`}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                  currentCategory === cat.id
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
                }`}
              >
                {cat.label}
              </Link>
            ))
          ) : (
            <p className="text-xs text-neutral-400">
              하위 메뉴가 없습니다. Ignite 테이블에 child_menu를 추가하세요.
            </p>
          )}
        </div>
      )}
    </nav>
  );
}
