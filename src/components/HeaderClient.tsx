"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/navigation";

const SCROLL_THRESHOLD = 10;
const CATEGORIES = new Set(["architecture", "interior"]);

type Props = { navItems: NavItem[]; logoHtml?: string };

export function HeaderClient({ navItems, logoHtml }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  /** 링크 이동·메뉴 닫기 시 리마운트 → 하위 아코디언 전부 접힘 */
  const [navListKey, setNavListKey] = useState(0);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isProjectDetail =
    pathname.startsWith("/projects/") &&
    !CATEGORIES.has(pathname.split("/").pop() ?? "");
  const disableHide = isHome || isProjectDetail;

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (menuOpen || disableHide || window.innerWidth >= 768) {
        setHidden(false);
        lastScrollY.current = y;
        return;
      }
      if (y > lastScrollY.current + SCROLL_THRESHOLD) {
        setHidden(true);
      } else if (y < lastScrollY.current - SCROLL_THRESHOLD) {
        setHidden(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuOpen, disableHide]);

  useEffect(() => {
    if (menuOpen) setHidden(false);
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) {
      document.documentElement.setAttribute("data-menu-open", "");
    } else {
      document.documentElement.removeAttribute("data-menu-open");
    }
    return () => document.documentElement.removeAttribute("data-menu-open");
  }, [menuOpen]);

  return (
    <>
      {/* Fullscreen menu overlay — outside header to avoid transform context */}
      <div
        className={`header__menu fixed inset-0 z-50 bg-[#F5F4F0] transition-all duration-500 ${
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <nav className="flex h-full flex-col px-10 pt-[25vh] md:px-20">
          <ul key={navListKey} className="space-y-4">
            {navItems.map((item) => (
              <NavMenuItem
                key={item.label}
                item={item}
                onNavigate={() => {
                  setMenuOpen(false);
                  setNavListKey((k) => k + 1);
                }}
              />
            ))}
          </ul>
        </nav>
      </div>

      <header
        className={`fixed left-0 right-0 top-0 z-[55] bg-[#F5F4F0] md:bg-transparent transition-transform duration-300 ${
          hidden && !menuOpen ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 md:px-10">
          <Link
            href="/"
            className="relative z-[60]"
            onClick={() => {
              setMenuOpen(false);
              setNavListKey((k) => k + 1);
            }}
          >
            {logoHtml ? (
              <span dangerouslySetInnerHTML={{ __html: logoHtml }} />
            ) : (
              <span className="text-[1.5rem] font-medium tracking-tight text-neutral-900">
                IGNITE
              </span>
            )}
          </Link>
          <button
            type="button"
            className={`header__toggle relative z-[60] flex h-8 w-8 items-center justify-center ${menuOpen ? "active" : ""}`}
            onClick={() => {
              setMenuOpen((open) => {
                if (open) setNavListKey((k) => k + 1);
                return !open;
              });
            }}
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg className="h-6 w-6" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M2 2L14 14M14 2L2 14" />
              </svg>
            ) : (
              <svg className="h-6 w-6" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M1 6.3H15M1 9.7H15" />
              </svg>
            )}
          </button>
        </div>
      </header>
    </>
  );
}

function NavMenuItem({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const childLinkClass =
    "text-xl font-medium tracking-tight text-neutral-700 transition-colors hover:text-neutral-900 hover:underline hover:underline-offset-4 md:text-2xl";

  if (!hasChildren) {
    return (
      <li>
        <Link href={item.href} className={childLinkClass} onClick={onNavigate}>
          {item.label}
        </Link>
      </li>
    );
  }

  return (
    <li>
      {/* Mobile: accordion toggle */}
      <button
        type="button"
        className={`text-xl font-medium tracking-tight transition-colors hover:text-neutral-900 md:hidden md:text-2xl ${
          expanded
            ? "text-neutral-900 underline underline-offset-4"
            : "text-neutral-700 hover:underline hover:underline-offset-4"
        }`}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        {item.label}
      </button>

      {/* Desktop: Projects → first category (e.g. Architecture) */}
      <Link
        href={item.href}
        className={`hidden text-xl font-medium tracking-tight text-neutral-700 transition-colors hover:text-neutral-900 hover:underline hover:underline-offset-4 md:inline md:text-2xl`}
        onClick={onNavigate}
      >
        {item.label}
      </Link>

      {/* Mobile: collapsible sub-menu */}
      <ul
        className={`overflow-hidden pl-16 transition-all duration-300 md:hidden ${
          expanded ? "mt-3 max-h-96 space-y-4 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {item.children!.map((child) => (
          <li key={child.href}>
            <Link href={child.href} className={childLinkClass} onClick={onNavigate}>
              {child.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop: sub-menu always visible */}
      <ul className="mt-3 hidden space-y-4 pl-16 md:block">
        {item.children!.map((child) => (
          <li key={child.href}>
            <Link href={child.href} className={childLinkClass} onClick={onNavigate}>
              {child.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}
