import { redirect } from "next/navigation";
import { getProjectCategories } from "@/lib/ignite-data";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const categories = await getProjectCategories();
  const first = categories[0];
  if (first) {
    redirect(`/projects/${first.type}`);
  }
  redirect("/");
}
