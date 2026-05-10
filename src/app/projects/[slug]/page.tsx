import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { featuredProjects } from "@/lib/projects";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return featuredProjects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = featuredProjects.find((p) => p.slug === slug);
  if (!project) return { title: "Project" };
  const title = project.subtitle
    ? `${project.title} — ${project.subtitle}`
    : project.title;
  return { title };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = featuredProjects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <article className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <Link
        href="/projects"
        className="text-xs uppercase tracking-[0.14em] text-neutral-500 transition-colors hover:text-neutral-900"
      >
        ← project
      </Link>
      <header className="mt-8 border-b border-neutral-200 pb-12">
        <h1 className="text-3xl font-medium tracking-tight text-neutral-900 md:text-4xl">
          {project.title}
        </h1>
        {project.subtitle ? (
          <p className="mt-3 text-sm uppercase tracking-tagline text-neutral-500 md:text-base">
            {project.subtitle}
          </p>
        ) : null}
      </header>
      <div className="mt-12 aspect-[16/10] w-full bg-neutral-100" aria-hidden />
      <p className="mt-8 max-w-2xl text-sm leading-relaxed text-neutral-600 md:text-base">
        프로젝트 상세 영역입니다. 이미지, 텍스트, 크레딧 등을 여기에 구성하면 됩니다.
      </p>
    </article>
  );
}
