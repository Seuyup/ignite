import { getStudioBodies, getStudioLocation } from "@/lib/ignite-data";
import { sanitizeRichHtml } from "@/lib/sanitize-html";
import StudioMapLoader from "@/components/StudioMapLoader";
import type { NaverMapType } from "@/lib/map-tiles";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Studio",
  description: "IGNITE 건축 스튜디오 소개 및 위치 안내.",
  openGraph: {
    title: "Studio — IGNITE",
    description: "IGNITE 건축 스튜디오 소개 및 위치 안내.",
  },
};

function renderHtmlBlock(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed);
  const sanitized = looksLikeHtml ? sanitizeRichHtml(raw) : null;

  return sanitized ? (
    <div
      className="prose prose-neutral max-w-none prose-headings:font-medium prose-headings:tracking-tight prose-p:text-neutral-600 prose-a:text-neutral-900 prose-img:rounded"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  ) : (
    <div className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-neutral-900">
      {raw}
    </div>
  );
}

export default async function StudioPage() {
  const [{ bodyTop, bodyBottom }, location] = await Promise.all([
    getStudioBodies(),
    getStudioLocation(),
  ]);

  const hasTop = !!bodyTop.trim();
  const hasLocation = !!location;
  const hasBottom = !!bodyBottom.trim();
  const hasAny = hasTop || hasLocation || hasBottom;

  return (
    <div className="min-h-[calc(100dvh-72px)]">
      <div className="flex flex-col px-6 py-16 md:flex-row md:px-10 md:py-24 lg:px-[90px]">
        {/* Left - label */}
        <div className="mb-10 md:mb-0 md:flex-1">
          <h1 className="text-sm font-medium text-neutral-900 md:sticky md:top-[25vh]">
            Studio
          </h1>
        </div>

        {/* Right - content: 상단 HTML → 지도 → 하단 HTML */}
        <div className="w-full md:w-[55%] md:max-w-[680px] md:flex-shrink-0 md:mr-[15%]">
          {hasTop && renderHtmlBlock(bodyTop)}

          {hasLocation && (
            <div>
              <StudioMapLoader
                lat={location.lat}
                lng={location.lng}
                mapType={location.mapType as NaverMapType}
                zoom={location.zoom}
                showZoomControl={location.showZoomControl}
                showScaleControl={location.showScaleControl}
                showMapTypeControl={location.showMapTypeControl}
                scrollWheel={location.scrollWheel}
                draggable={location.draggable}
              />
            </div>
          )}

          {hasBottom && (
            <div>
              {renderHtmlBlock(bodyBottom)}
            </div>
          )}

          {!hasAny && (
            <p className="text-sm text-neutral-500">
              스튜디오 소개가 준비 중입니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
