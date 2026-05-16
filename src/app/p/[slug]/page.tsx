import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getIndividualPageByType } from "@/lib/ignite-data";
import { sanitizeRichHtml } from "@/lib/sanitize-html";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getIndividualPageByType(slug);
  if (!page) return { title: "Page" };

  const title = page.seo.title || page.title;
  const description = page.seo.description || undefined;
  return {
    title,
    ...(description ? { description } : {}),
    openGraph: {
      title,
      ...(description ? { description } : {}),
      ...(page.seo.ogImage
        ? { images: [{ url: page.seo.ogImage, width: 1200, height: 630 }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      ...(description ? { description } : {}),
      ...(page.seo.ogImage ? { images: [page.seo.ogImage] } : {}),
    },
  };
}

export default async function IndividualPage({ params }: Props) {
  const { slug } = await params;
  const page = await getIndividualPageByType(slug);
  if (!page) notFound();

  const trimmed = page.body.trim();
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed);
  const content = looksLikeHtml ? sanitizeRichHtml(page.body) : null;

  return (
    <div className="min-h-[calc(100dvh-72px)]">
      <div className="flex flex-col px-6 py-16 md:flex-row md:px-10 md:py-24 lg:px-[90px]">
        {/* Left - label */}
        <div className="mb-10 md:mb-0 md:flex-1">
          <h1 className="text-sm font-medium text-neutral-900 md:sticky md:top-[25vh]">
            {page.title}
          </h1>
        </div>

        {/* Right - content */}
        <div className="w-full md:w-[55%] md:max-w-[680px] md:flex-shrink-0 md:mr-[22%]">
          {content ? (
            <div
              className="prose prose-neutral max-w-none prose-headings:font-medium prose-headings:tracking-tight prose-p:text-neutral-600 prose-a:text-neutral-900 prose-img:rounded"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : trimmed ? (
            <div className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-neutral-900">
              {page.body}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              콘텐츠가 준비 중입니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
