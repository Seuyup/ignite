import { SectionPage } from "@/components/SectionPage";
import { getContactBody } from "@/lib/ignite-data";
import { sanitizeRichHtml } from "@/lib/sanitize-html";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const body = await getContactBody();
  const trimmed = body.trim();
  if (!trimmed) {
    return <SectionPage title="contact" />;
  }

  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed);
  if (looksLikeHtml) {
    const safeHtml = sanitizeRichHtml(body);
    return (
      <SectionPage title="contact">
        <div
          className="prose prose-neutral max-w-3xl prose-headings:font-medium prose-headings:tracking-tight prose-p:text-neutral-600 prose-a:text-neutral-900 prose-img:rounded prose-img:border prose-img:border-neutral-200"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      </SectionPage>
    );
  }

  return (
    <SectionPage title="contact">
      <div className="whitespace-pre-wrap">{body}</div>
    </SectionPage>
  );
}
