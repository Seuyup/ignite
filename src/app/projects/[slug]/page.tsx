import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { R2Image } from "@/components/R2Image";
import {
  getProjectBySlug,
  getProjectSlugsForStaticParams,
} from "@/lib/project-queries";
import { ProseHtmlWithImageLightbox } from "@/components/ProseHtmlWithImageLightbox";
import { sanitizeRichHtml } from "@/lib/sanitize-html";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const slugs = await getProjectSlugsForStaticParams();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project" };
  const title = project.subtitle
    ? `${project.title} — ${project.subtitle}`
    : project.title;
  return { title };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const rawHtml = project.contentHtml ?? "";
  const safeHtml = sanitizeRichHtml(rawHtml);
  const textOnly = safeHtml.replace(/<[^>]*>/g, "").trim();
  const hasRichBody = textOnly.length > 0 || /<img\b/i.test(safeHtml);
  const cover = project.coverImageUrl?.trim();

  return (
    <article className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <Link
        href="/projects"
        className="text-xs uppercase tracking-[0.14em] text-neutral-500 transition-colors hover:text-neutral-900"
      >
        ← project
      </Link>

      {cover ? (
        <div className="relative mt-8 aspect-[21/10] max-h-[min(70vh,520px)] w-full overflow-hidden rounded-2xl bg-neutral-100 md:aspect-[2.5/1]">
          <R2Image
            src={cover}
            alt=""
            mode="fill"
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1152px"
            priority
          />
        </div>
      ) : null}

      <header
        className={`border-b border-neutral-200 pb-12 ${cover ? "mt-10" : "mt-8"}`}
      >
        <h1 className="text-3xl font-medium tracking-tight text-neutral-900 md:text-4xl">
          {project.title}
        </h1>
        {project.subtitle ? (
          <p className="mt-3 text-sm uppercase tracking-tagline text-neutral-500 md:text-base">
            {project.subtitle}
          </p>
        ) : null}
      </header>
      {hasRichBody ? (
        <ProseHtmlWithImageLightbox
          html={safeHtml}
          className="prose prose-neutral mt-12 max-w-none prose-headings:font-medium prose-headings:tracking-tight prose-p:text-neutral-600 prose-a:text-neutral-900 prose-img:rounded prose-img:border prose-img:border-neutral-200"
        />
      ) : cover ? (
        <p className="mt-10 max-w-2xl text-sm leading-relaxed text-neutral-600 md:text-base">
          본문은 관리자에서 추가할 수 있습니다.
        </p>
      ) : (
        <>
          <div className="mt-12 aspect-[16/10] w-full bg-neutral-100" aria-hidden />
          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-neutral-600 md:text-base">
            프로젝트 상세 영역입니다. 관리자에서 본문을 추가하면 여기에 표시됩니다.
          </p>
        </>
      )}
    </article>
  );
}
