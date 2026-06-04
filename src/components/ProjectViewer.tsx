"use client";

import { useState, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";

import { MobileImageLightbox } from "@/components/MobileImageLightbox";
import { R2Image } from "@/components/R2Image";
import { useSlideNav } from "@/hooks/useSlideNav";
import type { ProjectDetail } from "@/lib/projects";

const WHEEL_THRESHOLD = 30;

const PV_CLASSES = {
  root: "relative h-[calc(100dvh-72px)] w-full bg-[#F5F4F0] md:-mt-[72px] md:h-dvh md:bg-transparent",
  imageShell: "relative h-full min-h-0 overflow-hidden",
  swiperInner: "relative h-full min-h-0 w-full",
  horizontalSlide:
    "!flex items-center justify-center px-4 pb-[calc(1.5rem+1.5rem+1.25rem+env(safe-area-inset-bottom,0px))] md:px-[10%] md:pt-[72px] md:pb-[calc(2rem+2rem+1.25rem)]",
  imageFrame:
    "relative h-full min-h-0 w-[86%] max-h-[90dvh] md:h-full md:w-full md:max-h-full",
  imageFit: "pointer-events-none object-contain md:!object-cover md:object-center",
  navHitOuter:
    "absolute top-0 z-20 hidden h-full items-center md:flex md:pointer-events-none md:top-[72px] md:h-auto md:bottom-[calc(2rem+2rem+1.25rem)] md:w-[40%]",
  navHitStripBtn:
    "group/strip flex h-full w-32 shrink-0 cursor-pointer items-center justify-start border-0 bg-transparent p-0 pl-6 text-neutral-900 md:pl-10 pointer-events-auto",
  navHitStripBtnEnd:
    "group/strip flex h-full w-32 shrink-0 cursor-pointer items-center justify-end border-0 bg-transparent p-0 pr-6 text-neutral-900 md:pr-10 pointer-events-auto",
  metaScroll:
    "box-border flex h-full w-full items-center justify-center overflow-y-auto bg-[#F5F4F0] px-8 py-10 pb-[calc(1.5rem+1.5rem+1.25rem+2.5rem+env(safe-area-inset-bottom,0px))] md:px-[10%] md:pt-[72px] md:py-14 md:pb-[calc(2rem+2rem+1.25rem+1.5rem)]",
  desktopImageTitle:
    "pointer-events-none absolute left-[10%] right-[10%] top-0 z-[56] hidden h-[72px] items-end justify-end pb-2 md:flex",
  desktopMetaLine:
    "pointer-events-none absolute bottom-0 left-0 right-0 z-40 hidden px-6 py-6 text-center text-xs leading-relaxed text-neutral-700 md:block md:px-24 md:py-8 md:pr-28",
  desktopPaging:
    "pointer-events-none absolute bottom-0 right-0 z-40 hidden px-6 py-6 md:block md:px-10 md:py-8",
} as const;

type Props = {
  projects: ProjectDetail[];
  initialIndex: number;
};

function getProjectImages(proj: ProjectDetail): string[] {
  if (proj.images.length > 0) return proj.images;
  if (proj.coverImageUrl) return [proj.coverImageUrl];
  return [];
}

export function ProjectViewer({ projects, initialIndex }: Props) {
  const [imageIndex, setImageIndex] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  const imageShellRef = useRef<HTMLDivElement>(null);
  const hSwiperRef = useRef<SwiperType | null>(null);

  const projectIndex = initialIndex >= 0 ? initialIndex : 0;
  const currentProject = projects[projectIndex] ?? projects[0];
  const images = getProjectImages(currentProject);
  const total = images.length;

  const { navEdge, isMobile, reset, shellProps } = useSlideNav({
    swiperRef: hSwiperRef,
    shellRef: imageShellRef,
    total,
    disabled: showContent || zoomOpen,
  });

  useEffect(() => {
    setImageIndex(0);
    setShowContent(false);
    setZoomOpen(false);
    reset();
    hSwiperRef.current?.slideTo(0, 0);
  }, [projects, initialIndex, reset]);

  useEffect(() => {
    setShowContent(false);
    setZoomOpen(false);
  }, [isMobile]);

  useEffect(() => {
    const shell = imageShellRef.current;
    if (!shell || total <= 1) return;

    const onWheel = (e: WheelEvent) => {
      if (showContent || zoomOpen) return;
      if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;

      e.preventDefault();
      if (e.deltaY > 0) hSwiperRef.current?.slideNext();
      else hSwiperRef.current?.slidePrev();
    };

    shell.addEventListener("wheel", onWheel, { passive: false });
    return () => shell.removeEventListener("wheel", onWheel);
  }, [showContent, zoomOpen, total, projectIndex]);

  const visibleMeta = currentProject.meta.filter((m) => m.value.trim());
  const desktopMetaLine = visibleMeta
    .map((m) => `${m.label} : ${m.value}`)
    .join(" / ");

  return (
    <div className={PV_CLASSES.root}>
      <div
        ref={imageShellRef}
        className={PV_CLASSES.imageShell}
        {...shellProps}
      >
        <div className="relative h-full w-full">
          {images.length > 0 ? (
            <div className={PV_CLASSES.swiperInner}>
              <Swiper
                loop={total > 1}
                allowTouchMove={isMobile}
                speed={800}
                onSwiper={(s) => {
                  hSwiperRef.current = s;
                }}
                onSlideChange={(s) => setImageIndex(s.realIndex)}
                className="h-full w-full"
              >
                {images.map((url, i) => (
                  <SwiperSlide key={url + i} className={PV_CLASSES.horizontalSlide}>
                    <div
                      className={`${PV_CLASSES.imageFrame}${isMobile ? " cursor-zoom-in" : ""}`}
                      role={isMobile ? "button" : undefined}
                      tabIndex={isMobile ? 0 : undefined}
                      aria-label={isMobile ? "이미지 확대 보기" : undefined}
                      onClick={() => {
                        if (isMobile) setZoomOpen(true);
                      }}
                      onKeyDown={(e) => {
                        if (isMobile && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          setZoomOpen(true);
                        }
                      }}
                    >
                      <R2Image
                        src={url}
                        alt={currentProject.title}
                        mode="fill"
                        className={PV_CLASSES.imageFit}
                        sizes="(max-width: 767px) 86vw, min(96vw, 2400px)"
                        priority={i === 0}
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center pb-[calc(1.5rem+1.5rem+1.25rem+env(safe-area-inset-bottom,0px))] md:pb-[calc(2rem+2rem+1.25rem)]">
              <p className="text-sm text-neutral-500">이미지 없음</p>
            </div>
          )}
        </div>

        {total > 1 && !showContent && (
          <div className={`${PV_CLASSES.navHitOuter} left-0 md:justify-start`}>
            <button
              type="button"
              data-swiper-image-nav
              className={PV_CLASSES.navHitStripBtn}
              onClick={() => hSwiperRef.current?.slidePrev()}
              aria-label="이전 이미지"
            >
              <svg
                className={`h-4 w-8 shrink-0 text-neutral-900 transition-opacity duration-200 group-focus-within/strip:opacity-100 ${
                  navEdge === "left" ? "opacity-100" : "opacity-0"
                }`}
                fill="none"
                viewBox="0 0 24 12"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M22 6H2" />
                <path d="M7 1L2 6l5 5" />
              </svg>
            </button>
          </div>
        )}

        {total > 1 && !showContent && (
          <div className={`${PV_CLASSES.navHitOuter} right-0 md:justify-end`}>
            <button
              type="button"
              data-swiper-image-nav
              className={PV_CLASSES.navHitStripBtnEnd}
              onClick={() => hSwiperRef.current?.slideNext()}
              aria-label="다음 이미지"
            >
              <svg
                className={`h-4 w-8 shrink-0 text-neutral-900 transition-opacity duration-200 group-focus-within/strip:opacity-100 ${
                  navEdge === "right" ? "opacity-100" : "opacity-0"
                }`}
                fill="none"
                viewBox="0 0 24 12"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M2 6h20" />
                <path d="M17 1l5 5-5 5" />
              </svg>
            </button>
          </div>
        )}

        {/* Mobile: fullscreen meta overlay (title tap) */}
        {isMobile && visibleMeta.length > 0 && (
          <div
            data-pv-meta-layer
            className={`absolute inset-0 z-30 flex items-center justify-center transition-opacity duration-300 md:hidden ${
              showContent ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <div className={PV_CLASSES.metaScroll}>
              <dl
                className="w-full max-w-[500px] border-t border-neutral-900"
                style={{ borderTopWidth: "0.8px" }}
              >
                {visibleMeta.map((m, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-2 items-center border-b border-neutral-900 py-1.5"
                    style={{ borderBottomWidth: "0.8px" }}
                  >
                    <dt className="text-sm text-neutral-600">{m.label}</dt>
                    <dd className="text-sm text-neutral-900">{m.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: title in margin above image (not over photo) */}
      <div data-pv-desktop-title className={PV_CLASSES.desktopImageTitle}>
        <span className="pointer-events-auto text-[0.9375rem] font-medium tracking-tight text-neutral-900">
          {currentProject.title}
        </span>
      </div>

      {isMobile && zoomOpen && images.length > 0 && (
        <MobileImageLightbox
          images={images}
          initialIndex={imageIndex}
          alt={currentProject.title}
          onClose={() => setZoomOpen(false)}
          onIndexChange={(i) => {
            setImageIndex(i);
            if (total > 1) hSwiperRef.current?.slideToLoop(i);
            else hSwiperRef.current?.slideTo(i);
          }}
        />
      )}

      {/* Mobile: bottom bar — title (tap) left, paging right */}
      <div className="absolute bottom-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-6 md:hidden">
        <button
          type="button"
          className={`text-[0.9375rem] font-medium tracking-tight text-neutral-900 ${
            showContent ? "underline underline-offset-4" : ""
          }`}
          onClick={() => setShowContent(!showContent)}
        >
          {currentProject.title}
        </button>
        {total > 0 && (
          <span className="text-[0.8125rem] font-medium text-neutral-900">
            {imageIndex + 1} / {total}
          </span>
        )}
      </div>

      {/* Desktop: centered meta line at bottom */}
      {desktopMetaLine && (
        <p className={PV_CLASSES.desktopMetaLine}>{desktopMetaLine}</p>
      )}

      {/* Desktop: paging at bottom-right */}
      {total > 0 && (
        <div className={PV_CLASSES.desktopPaging}>
          <span className="text-[0.8125rem] font-medium text-neutral-900">
            {imageIndex + 1} / {total}
          </span>
        </div>
      )}
    </div>
  );
}
