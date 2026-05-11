import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminToken } from "@/lib/admin-session";

export async function assertAdmin(): Promise<void> {
  const token = (await cookies()).get("admin_token")?.value;
  if (!verifyAdminToken(token)) {
    redirect("/admin/login");
  }
}
