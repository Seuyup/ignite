"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/navigation";

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const active = isActive(href, pathname);
  return (
    <Link
      href={href}
      className={`block text-sm font-medium text-neutral-900 transition-colors ${
        active
          ? "underline underline-offset-4"
          : "hover:underline hover:underline-offset-4"
      }`}
    >
      {label}
    </Link>
  );
}

function NavSection({ item, pathname }: { item: NavItem; pathname: string }) {
  const hasChildren = item.children && item.children.length > 0;

  if (!hasChildren) {
    return <NavLink href={item.href} label={item.label} pathname={pathname} />;
  }

  const parentActive =
    isActive(item.href, pathname) ||
    item.children!.some((c) => isActive(c.href, pathname));

  return (
    <div className="space-y-1">
      <Link
        href={item.href}
        className={`block text-sm font-medium text-neutral-900 transition-colors ${
          parentActive
            ? "underline underline-offset-4"
            : "hover:underline hover:underline-offset-4"
        }`}
      >
        {item.label}
      </Link>
      <div className="space-y-1 pl-4">
        {item.children!.map((child) => (
          <NavLink
            key={child.href}
            href={child.href}
            label={child.label}
            pathname={pathname}
          />
        ))}
      </div>
    </div>
  );
}

type Props = {
  navItems: NavItem[];
};

export function DesktopSideNav({ navItems }: Props) {
  const pathname = usePathname();

  return (
    <div className="hidden w-[230px] flex-shrink-0 md:block">
      <nav className="fixed top-[25vh] left-[90px] z-30 w-[140px] space-y-4">
        {navItems.map((item) => (
          <NavSection key={item.href + item.label} item={item} pathname={pathname} />
        ))}
      </nav>
    </div>
  );
}
