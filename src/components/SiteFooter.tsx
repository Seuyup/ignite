"use client";

import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isProjectDetail = pathname.startsWith("/projects/") && !isCategory(pathname);

  if (isHome || isProjectDetail) return null;

  return (
    <footer className="relative z-40 md:pointer-events-none md:fixed md:bottom-0 md:left-0 md:right-0">
      <div className="flex items-center justify-between px-6 py-5 md:pointer-events-auto md:px-10">
        <a
          href="mailto:boxeryup@naver.com"
          className="text-xs uppercase tracking-wide text-neutral-600 transition-colors hover:text-neutral-900"
        >
          BOXERYUP@NAVER.COM
        </a>
        <p className="text-xs uppercase tracking-wide text-neutral-600">
          &copy;{new Date().getFullYear()} IGNITE
        </p>
      </div>
    </footer>
  );
}

const CATEGORIES = ["architecture", "interior"];

function isCategory(pathname: string): boolean {
  const slug = pathname.split("/").pop();
  return CATEGORIES.includes(slug ?? "");
}
