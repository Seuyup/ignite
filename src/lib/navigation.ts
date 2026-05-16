import { getMenuTree, type MenuItem } from "@/lib/ignite-data";

export type NavItem = {
  label: string;
  href: string;
  external?: boolean;
  children?: NavItem[];
};

function menuItemToNavItem(item: MenuItem): NavItem {
  if (item.type === "project") {
    return {
      label: "Projects",
      href: "/projects",
      children: item.children.map((child) => ({
        label: child.label,
        href: `/projects/${child.type}`,
      })),
    };
  }

  if (item.type === "studio") {
    return {
      label: "Studio",
      href: "/studio",
    };
  }

  if (item.type === "contact") {
    return {
      label: "Contact",
      href: "/contact",
    };
  }

  // 기타 top_menu 항목
  if (item.children.length > 0) {
    return {
      label: item.label,
      href: `/${item.type}`,
      children: item.children.map((child) => ({
        label: child.label,
        href: `/${item.type}/${child.type}`,
      })),
    };
  }

  return {
    label: item.label,
    href: `/${item.type}`,
  };
}

export async function getNavItems(): Promise<NavItem[]> {
  const menuTree = await getMenuTree();

  const items: NavItem[] = menuTree.length === 0
    ? [
        {
          label: "Projects",
          href: "/projects",
          children: [
            { label: "Architecture", href: "/projects/architecture" },
          ],
        },
        { label: "Studio", href: "/studio" },
        { label: "Contact", href: "/contact" },
      ]
    : menuTree.map(menuItemToNavItem);

  if (menuTree.length > 0 && !menuTree.some((m) => m.type === "contact")) {
    items.push({ label: "Contact", href: "/contact" });
  }

  return items;
}
