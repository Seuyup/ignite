export type NavItem = { label: string; href: string; external?: boolean };

export const mainNav: NavItem[] = [
  { label: "project", href: "/projects" },
  { label: "space", href: "/space" },
  { label: "architecture", href: "/architecture" },
  { label: "product", href: "/products" },
  { label: "WGNB", href: "/wgnb" },
  { label: "people", href: "/people" },
  { label: "contact", href: "/contact" },
  {
    label: "@instagram",
    href: "https://www.instagram.com/wgnb.kr/",
    external: true,
  },
];
