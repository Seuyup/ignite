import type { Metadata } from "next";
import { DesktopSideNav } from "@/components/DesktopSideNav";
import {
  getStudioBodies,
  getStudioLocation,
  getIgniteSeo,
  IGNITE_TYPE_STUDIO,
} from "@/lib/ignite-data";
import { getNavItems } from "@/lib/navigation";
import { sanitizeRichHtml } from "@/lib/sanitize-html";
import StudioMapLoader from "@/components/StudioMapLoader";
import type { NaverMapType } from "@/lib/map-tiles";
import { DEFAULT_OG_IMAGE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getIgniteSeo(IGNITE_TYPE_STUDIO);
  const title = seo.title || "Studio";
  const description = seo.description || "IGNITE 건축 스튜디오 소개 및 위치 안내.";
  const ogImage = seo.ogImage || DEFAULT_OG_IMAGE;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

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
  const [{ bodyTop, bodyBottom }, location, navItems] = await Promise.all([
    getStudioBodies(),
    getStudioLocation(),
    getNavItems(),
  ]);

  const hasTop = !!bodyTop.trim();
  const hasLocation = !!location;
  const hasBottom = !!bodyBottom.trim();
  const hasAny = hasTop || hasLocation || hasBottom;

  return (
    <div className="min-h-[calc(100dvh-72px)]">
      <div className="flex">
        <DesktopSideNav navItems={navItems} />

        <div className="flex flex-1 flex-col px-6 py-16 md:flex-row md:px-10 md:py-24 lg:px-0">
          {/* Mobile - label */}
          <div className="mb-10 md:mb-0 md:hidden">
            <h1 className="text-sm font-medium text-neutral-900">Studio</h1>
          </div>

          {/* Content */}
          <div className="w-full md:mx-auto md:w-[55%] md:max-w-[680px] md:flex-shrink-0">
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

        <div className="hidden w-[230px] flex-shrink-0 md:block" />
      </div>
    </div>
  );
}
