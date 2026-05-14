import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminToken } from "@/lib/admin-session";
import { getProjectCategories } from "@/lib/ignite-data";
import { AdminPanelNav } from "@/components/admin/AdminPanelNav";

export default async function AdminPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = (await cookies()).get("admin_token")?.value;
  if (!verifyAdminToken(token)) {
    redirect("/admin/login");
  }

  const categories = await getProjectCategories();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <AdminPanelNav
        categories={categories.map((c) => ({ id: c.id, type: c.type, label: c.label }))}
      />
      {children}
    </div>
  );
}
