import Link from "next/link";
import { redirect } from "next/navigation";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { getProjectForEditBySlug } from "@/lib/admin-project-queries";

export const metadata = {
  title: "프로젝트 수정",
};

type Props = {
  searchParams: Promise<{ slug?: string }>;
};

export default async function AdminModifyProjectPage({ searchParams }: Props) {
  const { slug: slugParam } = await searchParams;
  const slug = slugParam?.trim();
  if (!slug) {
    redirect("/admin/projects/list");
  }

  const initial = await getProjectForEditBySlug(slug);
  if (!initial) {
    redirect("/admin/projects/list");
  }

  return (
    <div>
      <p>
        <Link
          href="/admin/projects/list"
          className="text-xs uppercase tracking-[0.12em] text-neutral-500 transition-colors hover:text-neutral-900"
        >
          ← 프로젝트 목록
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-medium tracking-tight text-neutral-900 md:text-3xl">
        프로젝트 수정
      </h1>
      <p className="mt-3 max-w-xl text-sm text-neutral-500">
        제목·부제·본문을 수정합니다. Slug는 공개 URL과 연결되어 있어 변경할 수
        없습니다.
      </p>
      <div className="mt-10">
        <ProjectForm mode="edit" initial={initial} />
      </div>
    </div>
  );
}
