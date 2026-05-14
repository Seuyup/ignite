"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";

import { R2Image } from "@/components/R2Image";
import type { ProjectDetail } from "@/lib/projects";

type Props = {
  project: ProjectDetail;
  adjacentProjects: { prev: ProjectDetail | null; next: ProjectDetail | null };
};

export function ProjectViewer({ project, adjacentProjects }: Props) {
  const [currentProject, setCurrentProject] = useState(project);
  const [adjacent, setAdjacent] = useState(adjacentProjects);
  const [imageIndex, setImageIndex] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const imageSwiperRef = useRef<SwiperType | null>(null);
  const vertSwiperRef = useRef<SwiperType | null>(null);
  const isTransitioning = useRef(false);

  const images = currentProject.images.length > 0
    ? currentProject.images
    : currentProject.coverImageUrl
      ? [currentProject.coverImageUrl]
      : [];
  const total = images.length;

  useEffect(() => {
    setCurrentProject(project);
    setAdjacent(adjacentProjects);
    setImageIndex(0);
    setShowContent(false);
    imageSwiperRef.current?.slideTo(0, 0);
  }, [project, adjacentProjects]);

  // Vertical slides: only include existing adjacent projects
  const vertSlides: ProjectDetail[] = [];
  if (adjacent.prev) vertSlides.push(adjacent.prev);
  vertSlides.push(currentProject);
  if (adjacent.next) vertSlides.push(adjacent.next);
  const currentVertIdx = adjacent.prev ? 1 : 0;

  const handleVertTransitionEnd = useCallback(
    async (swiper: SwiperType) => {
      const idx = swiper.activeIndex;
      if (idx === currentVertIdx || isTransitioning.current) return;

      const direction = idx > currentVertIdx ? "next" : "prev";
      const target = direction === "next" ? adjacent.next : adjacent.prev;
      if (!target) {
        swiper.slideTo(currentVertIdx, 0);
        return;
      }

      isTransitioning.current = true;

      let newAdjacent = { prev: null as ProjectDetail | null, next: null as ProjectDetail | null };
      try {
        const res = await fetch(
          `/api/projects/${target.slug}/adjacent?menu_id=${target.menu_id}`,
        );
        if (res.ok) newAdjacent = await res.json();
      } catch { /* keep defaults */ }

      setCurrentProject(target);
      setAdjacent(newAdjacent);
      setImageIndex(0);
      setShowContent(false);

      requestAnimationFrame(() => {
        const newCenterIdx = newAdjacent.prev ? 1 : 0;
        swiper.slideTo(newCenterIdx, 0);
        imageSwiperRef.current?.slideTo(0, 0);
        isTransitioning.current = false;
      });
    },
    [adjacent],
  );

  return (
    <div className="relative flex h-[calc(100vh-72px)] w-full flex-col bg-[#f5f5f3]">
      {/* Image area with vertical swiper for project navigation */}
      <div className="relative flex-1 overflow-hidden">
        <Swiper
          modules={[Mousewheel]}
          direction="vertical"
          mousewheel={!showContent ? { forceToAxis: true, thresholdDelta: 30 } : false}
          speed={800}
          initialSlide={currentVertIdx}
          onSwiper={(s) => { vertSwiperRef.current = s; }}
          onSlideChangeTransitionEnd={handleVertTransitionEnd}
          className="h-full w-full"
        >
          {vertSlides.map((proj, vIdx) => (
            <SwiperSlide key={`${proj.slug}-${vIdx}`}>
              <div className="relative h-full w-full">
                {(() => {
                  const projImages = proj.images.length > 0
                    ? proj.images
                    : proj.coverImageUrl ? [proj.coverImageUrl] : [];
                  const projTotal = projImages.length;
                  const isActive = vIdx === currentVertIdx;

                  return projImages.length > 0 ? (
                    <Swiper
                      nested
                      loop={projTotal > 1}
                      speed={800}
                      onSwiper={isActive ? (s) => { imageSwiperRef.current = s; } : undefined}
                      onSlideChange={isActive ? (s) => setImageIndex(s.realIndex) : undefined}
                      className="h-full w-full"
                    >
                      {projImages.map((url, i) => (
                        <SwiperSlide key={url + i} className="!flex items-center justify-center">
                          <div className="relative h-full w-[86%] md:w-[80%]">
                            <R2Image
                              src={url}
                              alt={proj.title}
                              mode="fill"
                              className="pointer-events-none object-contain"
                              sizes="80vw"
                              priority={i === 0}
                            />
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-sm text-neutral-500">이미지 없음</p>
                    </div>
                  );
                })()}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Left arrow – PC only */}
        {total > 1 && !showContent && (
          <button
            type="button"
            className="group absolute left-[50px] top-1/2 z-10 hidden -translate-y-1/2 cursor-pointer md:block"
            onClick={() => imageSwiperRef.current?.slidePrev()}
            aria-label="이전 이미지"
          >
            <svg className="h-4 w-8 text-neutral-900 opacity-0 transition-opacity duration-200 group-hover:opacity-100" fill="none" viewBox="0 0 24 12" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 6H2" />
              <path d="M7 1L2 6l5 5" />
            </svg>
          </button>
        )}

        {/* Right arrow – PC only */}
        {total > 1 && !showContent && (
          <button
            type="button"
            className="group absolute right-[50px] top-1/2 z-10 hidden -translate-y-1/2 cursor-pointer md:block"
            onClick={() => imageSwiperRef.current?.slideNext()}
            aria-label="다음 이미지"
          >
            <svg className="h-4 w-8 text-neutral-900 opacity-0 transition-opacity duration-200 group-hover:opacity-100" fill="none" viewBox="0 0 24 12" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 6h20" />
              <path d="M17 1l5 5-5 5" />
            </svg>
          </button>
        )}

        {/* Project content overlay – covers image area only */}
        <div
          className={`absolute inset-0 z-30 flex items-center justify-center transition-opacity duration-300 ${
            showContent ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div className="flex h-full w-full items-center justify-center overflow-y-auto bg-[#f5f5f3] px-8 py-10 md:px-12 md:py-14">
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

      {/* Bottom bar: title + paging – fixed outside vertical swiper */}
      <div className="flex items-center justify-between px-6 py-6 md:px-10 md:py-8">
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
