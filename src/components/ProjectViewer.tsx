"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";

import { R2Image } from "@/components/R2Image";
import type { ProjectDetail } from "@/lib/projects";

/**
 * 모바일(<md) / PC(md+) 레이아웃·이미지 규칙을 한곳에 모아 둡니다.
 * - 모바일: 좁은 패딩, 하단 바 높이만큼 slide pb → contain 기준 가운데, 세로 90vh 상한
 * - PC: 헤더 72px 상단 패딩, 좌우 각 10% 여백(`md:px-[10%]`), w-full·cover
 */
const PV_CLASSES = {
  root: "relative h-[calc(100vh-72px)] w-full bg-[#f5f5f3] md:-mt-[72px] md:h-screen md:bg-transparent",
  imageShell:
    "relative h-full min-h-0 overflow-hidden md:[&_.swiper]:!cursor-inherit",
  swiperInner: "relative h-full min-h-0 w-full",
  horizontalSlide:
    "!flex items-center justify-center px-4 pb-[calc(1.5rem+1.5rem+1.25rem+env(safe-area-inset-bottom,0px))] md:px-[10%] md:pt-[72px] md:pb-[calc(2rem+2rem+1.25rem)]",
  imageFrame:
    "relative h-full min-h-0 w-[86%] max-h-[90vh] md:h-full md:w-full md:max-h-full",
  imageFit: "pointer-events-none object-contain md:!object-cover md:object-center",
  /** PC: 하단 바(py-6 md:py-8 + 한 줄)와 동일 여백 — 가로 슬라이드 md:pb 토큰과 맞춤 */
  navHitOuter:
    "absolute top-0 z-20 hidden h-full items-center md:flex md:pointer-events-none md:top-[72px] md:h-auto md:bottom-[calc(2rem+2rem+1.25rem)] md:w-[40%]",
  navHitStripBtn:
    "group/strip flex h-full w-32 shrink-0 cursor-pointer items-center justify-start border-0 bg-transparent p-0 pl-2 text-neutral-900 md:pl-4 pointer-events-auto",
  navHitStripBtnEnd:
    "group/strip flex h-full w-32 shrink-0 cursor-pointer items-center justify-end border-0 bg-transparent p-0 pr-2 text-neutral-900 md:pr-4 pointer-events-auto",
  metaScroll:
    "box-border flex h-full w-full items-center justify-center overflow-y-auto bg-[#f5f5f3] px-8 py-10 pb-[calc(1.5rem+1.5rem+1.25rem+2.5rem+env(safe-area-inset-bottom,0px))] md:px-[10%] md:pt-[72px] md:py-14 md:pb-[calc(2rem+2rem+1.25rem+1.5rem)]",
} as const;

type Props = {
  project: ProjectDetail;
  adjacentProjects: { prev: ProjectDetail | null; next: ProjectDetail | null };
};

/** PC(md+)에서 이미지 셸 너비 기준 좌·우 40% 구간 (가운데 20%는 화살표 없음) */
type NavEdge = "left" | "right" | null;
const MD_MIN_PX = 768;
/** 좌·우 40%에서 짧은 드래그 없이 뗐을 때 이전/다음으로 처리할 최대 이동(px) */
const TAP_MOVE_MAX_PX = 12;

function navZoneFromClientInShell(shell: HTMLElement, clientX: number): NavEdge {
  const rect = shell.getBoundingClientRect();
  const w = rect.width;
  if (w <= 0) return null;
  const x = clientX - rect.left;
  if (x <= w * 0.4) return "left";
  if (x >= w * 0.6) return "right";
  return null;
}

type TapTrack = { pointerId: number; x: number; y: number; zone: "left" | "right" };

export function ProjectViewer({ project, adjacentProjects }: Props) {
  const [currentProject, setCurrentProject] = useState(project);
  const [adjacent, setAdjacent] = useState(adjacentProjects);
  const [imageIndex, setImageIndex] = useState(0);
  const [showContent, setShowContent] = useState(false);
  /** PC에서 포인터가 셸의 좌 40% / 우 40%에 있을 때만 해당 쪽 화살표 표시 */
  const [navEdge, setNavEdge] = useState<NavEdge>(null);
  const navEdgeRef = useRef<NavEdge>(null);
  const imageShellRef = useRef<HTMLDivElement>(null);
  const imageSwiperRef = useRef<SwiperType | null>(null);
  const vertSwiperRef = useRef<SwiperType | null>(null);
  const isTransitioning = useRef(false);

  const images = currentProject.images.length > 0
    ? currentProject.images
    : currentProject.coverImageUrl
      ? [currentProject.coverImageUrl]
      : [];
  const total = images.length;

  const uiTapRefs = useRef({ showContent: false, total: 0 });
  uiTapRefs.current.showContent = showContent;
  uiTapRefs.current.total = total;

  const tapTrackRef = useRef<TapTrack | null>(null);
  const tapPointerUpRef = useRef<((e: PointerEvent) => void) | null>(null);

  const detachTapPointerListeners = useCallback(() => {
    const h = tapPointerUpRef.current;
    if (h) {
      window.removeEventListener("pointerup", h);
      window.removeEventListener("pointercancel", h);
      tapPointerUpRef.current = null;
    }
    tapTrackRef.current = null;
  }, []);

  useEffect(() => () => detachTapPointerListeners(), [detachTapPointerListeners]);

  useEffect(() => {
    setCurrentProject(project);
    setAdjacent(adjacentProjects);
    setImageIndex(0);
    setShowContent(false);
    navEdgeRef.current = null;
    setNavEdge(null);
    detachTapPointerListeners();
    imageShellRef.current?.style.removeProperty("cursor");
    imageSwiperRef.current?.slideTo(0, 0);
  }, [project, adjacentProjects, detachTapPointerListeners]);

  useEffect(() => {
    const onResize = () => {
      if (typeof window === "undefined" || window.innerWidth >= MD_MIN_PX) return;
      detachTapPointerListeners();
      imageShellRef.current?.style.removeProperty("cursor");
      if (navEdgeRef.current !== null) {
        navEdgeRef.current = null;
        setNavEdge(null);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [detachTapPointerListeners]);

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

  const syncNavEdgeFromClientX = useCallback((clientX: number) => {
    const shell = imageShellRef.current;
    if (typeof window === "undefined" || window.innerWidth < MD_MIN_PX) {
      shell?.style.removeProperty("cursor");
      if (navEdgeRef.current !== null) {
        navEdgeRef.current = null;
        setNavEdge(null);
      }
      return;
    }
    if (!shell) return;
    const next = navZoneFromClientInShell(shell, clientX);
    if (navEdgeRef.current !== next) {
      navEdgeRef.current = next;
      setNavEdge(next);
    }
    const { showContent: metaOpen, total: n } = uiTapRefs.current;
    if (metaOpen || n <= 1) shell.style.removeProperty("cursor");
    else shell.style.cursor = next ? "pointer" : "";
  }, []);

  const handleImageShellPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (typeof window === "undefined" || window.innerWidth < MD_MIN_PX) return;
      const { showContent: metaOpen, total: n } = uiTapRefs.current;
      if (metaOpen || n <= 1) return;
      const el = e.target;
      if (!(el instanceof Element)) return;
      if (el.closest("[data-swiper-image-nav]")) return;
      const shell = imageShellRef.current;
      if (!shell?.contains(el)) return;
      const zone = navZoneFromClientInShell(shell, e.clientX);
      if (!zone) return;
      detachTapPointerListeners();
      tapTrackRef.current = {
        pointerId: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        zone,
      };
      const onUp = (ev: PointerEvent) => {
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        tapPointerUpRef.current = null;
        const tr = tapTrackRef.current;
        tapTrackRef.current = null;
        if (!tr || ev.pointerId !== tr.pointerId) return;
        const d = Math.hypot(ev.clientX - tr.x, ev.clientY - tr.y);
        if (d > TAP_MOVE_MAX_PX) return;
        const upEl = ev.target;
        if (upEl instanceof Element && upEl.closest("[data-swiper-image-nav]")) return;
        if (tr.zone === "left") imageSwiperRef.current?.slidePrev();
        else imageSwiperRef.current?.slideNext();
      };
      tapPointerUpRef.current = onUp;
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [detachTapPointerListeners],
  );

  const handleImageShellPointerLeave = useCallback(() => {
    imageShellRef.current?.style.removeProperty("cursor");
    if (navEdgeRef.current !== null) {
      navEdgeRef.current = null;
      setNavEdge(null);
    }
  }, []);

  return (
    <div className="relative h-[calc(100vh-72px)] w-full bg-[#f5f5f3] md:-mt-[72px] md:h-screen md:bg-transparent">
      {/* Image area — full height, swiper extends behind bottom bar */}
      <div
        ref={imageShellRef}
        className={PV_CLASSES.imageShell}
        onPointerDownCapture={handleImageShellPointerDown}
        onPointerMove={(e) => syncNavEdgeFromClientX(e.clientX)}
        onPointerLeave={handleImageShellPointerLeave}
      >
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
                    <div className={PV_CLASSES.swiperInner}>
                      <Swiper
                        nested
                        loop={projTotal > 1}
                        speed={800}
                        onSwiper={isActive ? (s) => { imageSwiperRef.current = s; } : undefined}
                        onSlideChange={isActive ? (s) => setImageIndex(s.realIndex) : undefined}
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
                  );
                })()}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Left nav zone – PC only */}
        {total > 1 && !showContent && (
          <div className={`${PV_CLASSES.navHitOuter} left-0 md:justify-start`}>
            <button
              type="button"
              data-swiper-image-nav
              className={PV_CLASSES.navHitStripBtn}
              onClick={() => imageSwiperRef.current?.slidePrev()}
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

        {/* Right nav zone – PC only */}
        {total > 1 && !showContent && (
          <div className={`${PV_CLASSES.navHitOuter} right-0 md:justify-end`}>
            <button
              type="button"
              data-swiper-image-nav
              className={PV_CLASSES.navHitStripBtnEnd}
              onClick={() => imageSwiperRef.current?.slideNext()}
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

        {/* Project content overlay – covers image area only */}
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

      {/* Bottom bar: overlaid with transparent bg so swiper slides visible behind */}
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
