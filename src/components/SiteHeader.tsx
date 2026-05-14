import { getNavItems } from "@/lib/navigation";
import { HeaderClient } from "@/components/HeaderClient";

export async function SiteHeader() {
  const navItems = await getNavItems();
  return <HeaderClient navItems={navItems} />;
}
