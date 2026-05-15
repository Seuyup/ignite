import { getStudioBody, getStudioLocation } from "@/lib/ignite-data";
import { sanitizeRichHtml } from "@/lib/sanitize-html";
import StudioMapLoader from "@/components/StudioMapLoader";

export const dynamic = "force-dynamic";

export const metadata = { title: "Studio" };

export default async function StudioPage() {
  const [body, location] = await Promise.all([
    getStudioBody(),
    getStudioLocation(),
  ]);
  const trimmed = body.trim();

  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed);
  const content = looksLikeHtml ? sanitizeRichHtml(body) : null;

  const hasLocation = !!location;
  const hasBody = !!trimmed;

  return (
    <div className="min-h-[calc(100dvh-72px)]">
      <div className="flex flex-col px-6 py-16 md:flex-row md:px-10 md:py-24 lg:px-[90px]">
        {/* Left - label */}
        <div className="mb-10 md:mb-0 md:flex-1">
          <h1 className="text-sm font-medium text-neutral-900 md:sticky md:top-[25vh]">
            Studio
          </h1>
        </div>

        {/* Right - content */}
        <div className="w-full md:w-[55%] md:max-w-[680px] md:flex-shrink-0 md:mr-[15%]">
          {hasLocation && (
            <StudioMapLoader
              lat={location.lat}
              lng={location.lng}
              address={location.address}
              mapTile={location.mapTile}
              zoom={location.zoom}
            />
          )}

          {/* HTML 콘텐츠 - 하단 */}
          {hasBody && (
            <div className={hasLocation ? "mt-16" : ""}>
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

          {!hasLocation && !hasBody && (
            <p className="text-sm text-neutral-500">
              스튜디오 소개가 준비 중입니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
