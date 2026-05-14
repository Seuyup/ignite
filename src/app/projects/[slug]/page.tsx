import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectViewer } from "@/components/ProjectViewer";
import { ProjectsGrid } from "@/components/ProjectsGrid";
import {
  getProjectBySlug,
  getProjectsByMenuId,
  getAdjacentProjects,
} from "@/lib/project-queries";
import { getProjectCategories } from "@/lib/ignite-data";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const categories = await getProjectCategories();
  const category = categories.find((c) => c.type === slug);
  if (category) {
    return { title: category.label };
  }

  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project" };
  return { title: project.title };
}

export default async function ProjectSlugPage({ params }: Props) {
  const { slug } = await params;

  const categories = await getProjectCategories();
  const category = categories.find((c) => c.type === slug);

  if (category) {
    const projects = await getProjectsByMenuId(category.id);
    return (
      <div className="min-h-[calc(100vh-72px)]">
        {/* Mobile: category nav at top (vertical) */}
        <nav className="space-y-1 px-6 pt-8 md:hidden">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/projects/${cat.type}`}
              className={`block text-sm font-medium text-neutral-900 transition-colors ${
                cat.type === slug
                  ? "underline underline-offset-4"
                  : "hover:underline hover:underline-offset-4"
              }`}
            >
              {cat.label}
            </Link>
          ))}
        </nav>

        {/* Desktop: left 200px | center | right 200px */}
        <div className="flex">
          {/* Left - category nav (desktop) */}
          <div className="hidden w-[230px] flex-shrink-0 md:block">
            <nav className="fixed top-1/2 left-[90px] z-30 -translate-y-1/2 space-y-1">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/projects/${cat.type}`}
                  className={`block text-sm font-medium text-neutral-900 transition-colors ${
                    cat.type === slug
                      ? "underline underline-offset-4"
                      : "hover:underline hover:underline-offset-4"
                  }`}
                >
                  {cat.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center - project grid */}
          <div className="flex-1 px-6 py-10 md:px-0 md:py-24">
            <ProjectsGrid projects={projects} />
          </div>

          {/* Right - empty space (desktop) */}
          <div className="hidden w-[230px] flex-shrink-0 md:block" />
        </div>
      </div>
    );
  }

  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const adjacent = await getAdjacentProjects(slug, project.menu_id);

  return (
    <ProjectViewer
      project={project}
      adjacentProjects={adjacent}
    />
  );
}
