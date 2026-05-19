import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectViewer } from "@/components/ProjectViewer";
import { ProjectsGrid } from "@/components/ProjectsGrid";
import {
  getProjectBySlug,
  getProjectsByMenuId,
  getProjectDetailsByMenuId,
} from "@/lib/project-queries";
import { getProjectCategories, getIgniteSeoById } from "@/lib/ignite-data";
import { DEFAULT_OG_IMAGE } from "@/lib/constants";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const categories = await getProjectCategories();
  const category = categories.find((c) => c.type === slug);
  if (category) {
    const seo = await getIgniteSeoById(category.id);
    const title = seo.title || category.label;
    const description = seo.description || undefined;
    const ogImage = seo.ogImage || DEFAULT_OG_IMAGE;
    return {
      title,
      ...(description ? { description } : {}),
      openGraph: {
        title,
        ...(description ? { description } : {}),
        images: [{ url: ogImage, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        ...(description ? { description } : {}),
        images: [ogImage],
      },
    };
  }

  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project" };

  const ogImage = project.coverImageUrl || project.images[0] || DEFAULT_OG_IMAGE;
  return {
    title: project.title,
    description: [project.sub_title_1, project.sub_title_2]
      .filter(Boolean)
      .join(" — ") || undefined,
    openGraph: {
      title: project.title,
      description: [project.sub_title_1, project.sub_title_2]
        .filter(Boolean)
        .join(" — ") || undefined,
      images: [{ url: ogImage, width: 1200, height: 630, alt: project.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      images: [ogImage],
    },
  };
}

export default async function ProjectSlugPage({ params }: Props) {
  const { slug } = await params;

  const categories = await getProjectCategories();
  const category = categories.find((c) => c.type === slug);

  if (category) {
    const projects = await getProjectsByMenuId(category.id);
    return (
      <div className="min-h-[calc(100dvh-72px)]">
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
            <nav className="fixed top-[25vh] left-[90px] z-30 space-y-1">
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

  const allProjects = await getProjectDetailsByMenuId(project.menu_id);
  const startIndex = allProjects.findIndex((p) => p.slug === slug);

  return (
    <ProjectViewer
      projects={allProjects}
      initialIndex={startIndex >= 0 ? startIndex : 0}
    />
  );
}
