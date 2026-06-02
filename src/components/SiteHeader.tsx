import { getNavItems } from "@/lib/navigation";
import { getHomeLogoHtml } from "@/lib/ignite-data";
import { HeaderClient } from "@/components/HeaderClient";

export async function SiteHeader() {
  const [navItems, logoHtml] = await Promise.all([
    getNavItems(),
    getHomeLogoHtml(),
  ]);
  return <HeaderClient navItems={navItems} logoHtml={logoHtml} />;
}
