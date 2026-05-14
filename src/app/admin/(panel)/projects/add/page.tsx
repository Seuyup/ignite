import Link from "next/link";
import { redirect } from "next/navigation";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { getProjectCategories } from "@/lib/ignite-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "추가",
};

type Props = {
  searchParams: Promise<{ category?: string }>;
};

export default async function AdminAddProjectPage({ searchParams }: Props) {
  const sp = await searchParams;
  const categoryType = sp.category ?? "";

  const categories = await getProjectCategories();
  const matched = categories.find((c) => c.id === categoryType || c.type === categoryType);

  if (!matched) {
    redirect("/admin/projects/list");
  }

  return (
    <div>
      <p>
        <Link
          href={`/admin/projects/list?category=${categoryType}`}
          className="inline-block rounded-md px-2 py-1 text-xs uppercase tracking-[0.12em] text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          &larr; 목록
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-medium tracking-tight text-neutral-900 md:text-3xl">
        추가
      </h1>
      <div className="mt-10">
        <ProjectForm mode="create" menuId={matched.id} />
      </div>
    </div>
  );
}
