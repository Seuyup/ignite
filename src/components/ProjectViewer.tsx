"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";

import { R2Image } from "@/components/R2Image";
import { useSlideNav, goSlidePrev, goSlideNext } from "@/hooks/useSlideNav";
import type { ProjectDetail } from "@/lib/projects";

const PV_CLASSES = {
  root: "relative h-[calc(100dvh-72px)] w-full bg-[#F5F4F0] md:-mt-[72px] md:h-dvh md:bg-transparent",
  imageShell:
    "relative h-full min-h-0 overflow-hidden",
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
} as const;

type Props = {
  project: ProjectDetail;
  adjacentProjects: { prev: ProjectDetail | null; next: ProjectDetail | null };
};

export function ProjectViewer({ project, adjacentProjects }: Props) {
  const [currentProject, setCurrentProject] = useState(project);
  const [adjacent, setAdjacent] = useState(adjacentProjects);
  const [imageIndex, setImageIndex] = useState(0);
  const [showContent, setShowContent] = useState(false);

  const imageShellRef = useRef<HTMLDivElement>(null);
  const imageSwiperRef = useRef<SwiperType | null>(null);
  const vertSwiperRef = useRef<SwiperType | null>(null);
  const isTransitioning = useRef(false);

  const imageIndexCacheRef = useRef<Map<string, number>>(new Map());

  const images = currentProject.images.length > 0
    ? currentProject.images
    : currentProject.coverImageUrl
      ? [currentProject.coverImageUrl]
      : [];
  const total = images.length;

  const { navEdge, isMobile, reset, shellProps } = useSlideNav({
    swiperRef: imageSwiperRef,
    shellRef: imageShellRef,
    total,
    disabled: showContent,
  });

  useEffect(() => {
    setCurrentProject(project);
    setAdjacent(adjacentProjects);
    setImageIndex(0);
    setShowContent(false);
    reset();
    imageSwiperRef.current?.slideTo(0, 0);
  }, [project, adjacentProjects, reset]);

  // --- Vertical swiper: project navigation ---
  const vertSlides: ProjectDetail[] = [];
  if (adjacent.prev) vertSlides.push(adjacent.prev);
  vertSlides.push(currentProject);
  if (adjacent.next) vertSlides.push(adjacent.next);
  const currentVertIdx = adjacent.prev ? 1 : 0;

  const currentVertIdxRef = useRef(currentVertIdx);
  currentVertIdxRef.current = currentVertIdx;
  const adjacentRef = useRef(adjacent);
  adjacentRef.current = adjacent;
  const currentProjectRef = useRef(currentProject);
  currentProjectRef.current = currentProject;
  const imageIndexRef = useRef(imageIndex);
  imageIndexRef.current = imageIndex;

  const handleVertTransitionEnd = useCallback(
    async (swiper: SwiperType) => {
      const idx = swiper.activeIndex;
      const centerIdx = currentVertIdxRef.current;
      if (idx === centerIdx || isTransitioning.current) return;

      const adj = adjacentRef.current;
      const direction = idx > centerIdx ? "next" : "prev";
      const target = direction === "next" ? adj.next : adj.prev;
      if (!target) {
        swiper.slideTo(centerIdx, 0);
        return;
      }

      isTransitioning.current = true;

      imageIndexCacheRef.current.set(
        currentProjectRef.current.slug,
        imageIndexRef.current,
      );

      let newAdjacent = { prev: null as ProjectDetail | null, next: null as ProjectDetail | null };
      try {
        const res = await fetch(
          `/api/projects/${target.slug}/adjacent?menu_id=${target.menu_id}`,
        );
        if (res.ok) newAdjacent = await res.json();
      } catch { /* keep defaults */ }

      const cachedIdx = imageIndexCacheRef.current.get(target.slug) ?? 0;

      setCurrentProject(target);
      setAdjacent(newAdjacent);
      setImageIndex(cachedIdx);
      setShowContent(false);

      requestAnimationFrame(() => {
        const newCenterIdx = newAdjacent.prev ? 1 : 0;
        swiper.slideTo(newCenterIdx, 0);
        imageSwiperRef.current?.slideTo(cachedIdx, 0);
        isTransitioning.current = false;
      });
    },
    [],
  );

  const mousewheelConfig = showContent
    ? false
    : { forceToAxis: true, thresholdDelta: 30 };

  return (
    <div className={PV_CLASSES.root}>
      <div
        ref={imageShellRef}
        className={PV_CLASSES.imageShell}
        {...shellProps}
      >
        <Swiper
          modules={[Mousewheel]}
          direction="vertical"
          resistance={false}
          allowTouchMove={isMobile}
          mousewheel={mousewheelConfig}
          speed={800}
          initialSlide={currentVertIdx}
          onSwiper={(s) => { vertSwiperRef.current = s; }}
          onSlideChangeTransitionEnd={handleVertTransitionEnd}
          className="h-full w-full"
        >
          {vertSlides.map((proj, vIdx) => {
            const projImages = proj.images.length > 0
              ? proj.images
              : proj.coverImageUrl ? [proj.coverImageUrl] : [];
            const projTotal = projImages.length;
            const isActive = vIdx === currentVertIdx;

            return (
              <SwiperSlide key={`${proj.slug}-${vIdx}`}>
                <div className="relative h-full w-full">
                  {projImages.length > 0 ? (
                    <div className={PV_CLASSES.swiperInner}>
                      <Swiper
                        nested
                        allowTouchMove={isMobile}
                        observer
                        observeParents
                        speed={800}
                        onSwiper={isActive ? (s) => { imageSwiperRef.current = s; } : undefined}
                        onSlideChange={isActive ? (s) => setImageIndex(s.activeIndex) : undefined}
                        className="h-full w-full"
                      >
                        {projImages.map((url, i) => (
                          <SwiperSlide key={url + i} className={PV_CLASSES.horizontalSlide}>
                            <div className={PV_CLASSES.imageFrame}>
                              <R2Image
                                src={url}
                                alt={proj.title}
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
              </SwiperSlide>
            );
          })}
        </Swiper>

        {total > 1 && !showContent && (
          <div className={`${PV_CLASSES.navHitOuter} left-0 md:justify-start`}>
            <button
              type="button"
              data-swiper-image-nav
              className={PV_CLASSES.navHitStripBtn}
              onClick={() => {
                const sw = imageSwiperRef.current;
                if (sw) goSlidePrev(sw, total);
              }}
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
              onClick={() => {
                const sw = imageSwiperRef.current;
                if (sw) goSlideNext(sw, total);
              }}
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

        {/* Project content overlay */}
        <div
          data-pv-meta-layer
          className={`absolute inset-0 z-30 flex items-center justify-center transition-opacity duration-300 ${
            showContent ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div className={PV_CLASSES.metaScroll}>
            {(() => {
              const visibleMeta = currentProject.meta.filter((m) => m.value.trim());
              if (visibleMeta.length === 0) return null;
              return (
                <dl className="w-full max-w-[500px] border-t border-neutral-900" style={{ borderTopWidth: '0.8px' }}>
                  {visibleMeta.map((m, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-2 items-center border-b border-neutral-900 py-1.5"
                      style={{ borderBottomWidth: '0.8px' }}
                    >
                      <dt className="text-sm text-neutral-600">{m.label}</dt>
                      <dd className="text-sm text-neutral-900">{m.value}</dd>
                    </div>
                  ))}
                </dl>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-6 md:px-10 md:py-8">
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
    </div>
  );
}
