import type { Metadata } from "next";
import {
  getContactBody,
  getIgniteSeo,
  IGNITE_TYPE_CONTACT,
} from "@/lib/ignite-data";
import { sanitizeRichHtml } from "@/lib/sanitize-html";
import { ContactForm } from "@/components/ContactForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getIgniteSeo(IGNITE_TYPE_CONTACT);
  const title = seo.title || "Contact";
  const description =
    seo.description || "IGNITE에 프로젝트 문의, 채용, 협업 제안을 보내주세요.";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(seo.ogImage ? { images: [{ url: seo.ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(seo.ogImage ? { images: [seo.ogImage] } : {}),
    },
  };
}

export default async function ContactPage() {
  const body = await getContactBody();
  const trimmed = body.trim();
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed);
  const content = looksLikeHtml ? sanitizeRichHtml(body) : null;
  const hasBody = !!trimmed;

  return (
    <div className="min-h-[calc(100dvh-72px)]">
      <div className="flex flex-col px-6 py-16 md:flex-row md:px-10 md:py-24 lg:px-[90px]">
        {/* Left - label */}
        <div className="mb-10 md:mb-0 md:flex-1">
          <h1 className="text-sm font-medium text-neutral-900 md:sticky md:top-[25vh]">
            Contact
          </h1>
        </div>

        {/* Right - content */}
        <div className="w-full md:w-[55%] md:max-w-[680px] md:flex-shrink-0 md:mr-[22%]">
          <div className="space-y-10">
            <p className="text-sm font-medium leading-relaxed text-neutral-900">
              프로젝트를 논의하고 싶으시다면, 전화를 주시거나 아래 양식을 작성해
              주세요. 가능한 빨리 상담 일정을 잡아드리겠습니다. 채용을 원하시는
              경우, PDF 형식의 포트폴리오와 이력서를 아래 이메일로 보내주세요.
            </p>

            <ContactForm />

            {hasBody && (
              <div className="mt-16">
                {content ? (
                  <div
                    className="prose prose-neutral max-w-none prose-headings:font-medium prose-headings:tracking-tight prose-p:text-neutral-600 prose-a:text-neutral-900 prose-img:rounded"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                ) : (
                  <div className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-neutral-900">
                    {body}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
