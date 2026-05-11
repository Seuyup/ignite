import { ProjectsDirectory } from "@/components/ProjectsDirectory";
import { getProjectsForPublic } from "@/lib/project-queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Project",
};

export default async function ProjectsPage() {
  const projects = await getProjectsForPublic();

  return (
    <div className="border-b border-neutral-200/80 bg-gradient-to-b from-neutral-50/80 to-white">
      <header className="mx-auto max-w-6xl px-6 pb-10 pt-16 md:pb-14 md:pt-24">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">
          Selected work
        </p>
        <h1 className="mt-3 text-3xl font-medium tracking-tight text-neutral-900 md:text-4xl">
          project
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-neutral-500 md:text-base">
          등록된 프로젝트를 둘러보고, 카드를 선택하면 상세 페이지로 이동합니다.
        </p>
      </header>
      <ProjectsDirectory projects={projects} />
    </div>
  );
}
