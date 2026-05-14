import Link from "next/link";
import { redirect } from "next/navigation";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { getProjectForEditBySlug } from "@/lib/admin-project-queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "수정",
};

type Props = {
  searchParams: Promise<{ slug?: string; category?: string }>;
};

export default async function AdminModifyProjectPage({ searchParams }: Props) {
  const sp = await searchParams;
  const slug = sp.slug?.trim();
  if (!slug) {
    redirect("/admin/projects/list");
  }

  const initial = await getProjectForEditBySlug(slug);
  if (!initial) {
    redirect("/admin/projects/list");
  }

  const activeCategory = sp.category || initial.menu_id || "";

  if (!sp.category && initial.menu_id) {
    redirect(`/admin/projects/modify?slug=${encodeURIComponent(slug)}&category=${encodeURIComponent(initial.menu_id)}`);
  }

  return (
    <div>
      <p>
        <Link
          href={`/admin/projects/list?category=${activeCategory}`}
          className="inline-block rounded-md px-2 py-1 text-xs uppercase tracking-[0.12em] text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          &larr; 목록
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-medium tracking-tight text-neutral-900 md:text-3xl">
        수정
      </h1>
      <div className="mt-10">
        <ProjectForm mode="edit" initial={initial} />
      </div>
    </div>
  );
}
