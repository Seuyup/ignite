import { getStudioBody } from "@/lib/ignite-data";
import { sanitizeRichHtml } from "@/lib/sanitize-html";

export const dynamic = "force-dynamic";

export const metadata = { title: "Studio" };

export default async function StudioPage() {
  const body = await getStudioBody();
  const trimmed = body.trim();

  if (!trimmed) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-20 md:py-28">
        <h1 className="text-3xl font-medium tracking-tight text-neutral-900 md:text-4xl">
          Studio
        </h1>
        <p className="mt-6 text-sm text-neutral-500">
          스튜디오 소개가 준비 중입니다.
        </p>
      </section>
    );
  }

  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed);
  const content = looksLikeHtml ? sanitizeRichHtml(body) : null;

  return (
    <section className="mx-auto max-w-4xl px-6 py-20 md:py-28">
      <h1 className="text-3xl font-medium tracking-tight text-neutral-900 md:text-4xl">
        Studio
      </h1>
      {content ? (
        <div
          className="prose prose-neutral mt-10 max-w-none prose-headings:font-medium prose-headings:tracking-tight prose-p:text-neutral-600 prose-a:text-neutral-900 prose-img:rounded"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <div className="mt-10 whitespace-pre-wrap text-sm text-neutral-700">
          {body}
        </div>
      )}
    </section>
  );
}
