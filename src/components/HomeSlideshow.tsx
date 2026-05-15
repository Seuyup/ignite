"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";

import { R2Image } from "@/components/R2Image";
import type { HomeImage } from "@/lib/ignite-data";

/** 모바일 / PC 분리 — ProjectViewer와 동일한 이미지 규칙 */
const HS_CLASSES = {
  section:
    "flex min-h-0 h-[calc(100dvh-72px)] w-full flex-col bg-[#f5f5f3] md:relative md:-mt-[72px] md:h-dvh md:flex-none md:bg-transparent",
  swiperShell:
    "relative flex-1 min-h-0 overflow-hidden md:h-full md:[&_.swiper]:!cursor-inherit",
  swiperInner: "relative h-full min-h-0 w-full",
  slide:
    "!flex items-center justify-center px-4 md:px-[10%] md:pt-[72px] md:pb-[calc(2rem+2rem+1.25rem+env(safe-area-inset-bottom,0px))]",
  imageFrame:
    "relative h-full min-h-0 max-h-[90dvh] w-[86%] md:h-full md:w-full md:max-h-full",
  imageFit: "pointer-events-none object-contain md:!object-cover md:object-center",
  navHitOuter:
    "absolute top-0 z-20 hidden h-full items-center md:flex md:pointer-events-none md:top-[72px] md:h-auto md:bottom-[calc(2rem+2rem+1.25rem+env(safe-area-inset-bottom,0px))] md:w-[40%]",
  navHitStripBtn:
    "group/strip flex h-full w-32 shrink-0 cursor-pointer items-center justify-start border-0 bg-transparent p-0 pl-2 text-neutral-900 md:pl-4 pointer-events-auto",
  navHitStripBtnEnd:
    "group/strip flex h-full w-32 shrink-0 cursor-pointer items-center justify-end border-0 bg-transparent p-0 pr-2 text-neutral-900 md:pr-4 pointer-events-auto",
} as const;

type NavEdge = "left" | "right" | null;
const MD_MIN_PX = 768;
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

type Props = { images: HomeImage[] };

export function HomeSlideshow({ images }: Props) {
  const router = useRouter();
  const swiperRef = useRef<SwiperType | null>(null);
  const [current, setCurrent] = useState(0);
  const [navEdge, setNavEdge] = useState<NavEdge>(null);
  const navEdgeRef = useRef<NavEdge>(null);
  const swiperShellRef = useRef<HTMLDivElement>(null);
  const total = images.length;

  const uiTapRefs = useRef({ total: 0 });
  uiTapRefs.current.total = total;

  const tapTrackRef = useRef<TapTrack | null>(null);
  const tapPointerUpRef = useRef<((e: PointerEvent) => void) | null>(null);
  const suppressImageLinkClickRef = useRef(false);

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
    setCurrent(0);
    navEdgeRef.current = null;
    setNavEdge(null);
    detachTapPointerListeners();
    swiperShellRef.current?.style.removeProperty("cursor");
    swiperRef.current?.slideTo(0, 0);
  }, [images, detachTapPointerListeners]);

  const syncNavEdgeFromClientX = useCallback((clientX: number) => {
    const shell = swiperShellRef.current;
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
    if (uiTapRefs.current.total <= 1) shell.style.removeProperty("cursor");
    else shell.style.cursor = next ? "pointer" : "";
  }, []);

  const handleSwiperShellPointerLeave = useCallback(() => {
    swiperShellRef.current?.style.removeProperty("cursor");
    if (navEdgeRef.current !== null) {
      navEdgeRef.current = null;
      setNavEdge(null);
    }
  }, []);

  const handleSwiperShellPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (typeof window === "undefined" || window.innerWidth < MD_MIN_PX) return;
      if (uiTapRefs.current.total <= 1) return;
      const el = e.target;
      if (!(el instanceof Element)) return;
      if (el.closest("[data-swiper-image-nav]")) return;
      const shell = swiperShellRef.current;
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
        if (tr.zone === "left") swiperRef.current?.slidePrev();
        else swiperRef.current?.slideNext();
        suppressImageLinkClickRef.current = true;
      };
      tapPointerUpRef.current = onUp;
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [detachTapPointerListeners],
  );

  useEffect(() => {
    const onResize = () => {
      if (typeof window === "undefined" || window.innerWidth >= MD_MIN_PX) return;
      detachTapPointerListeners();
      swiperShellRef.current?.style.removeProperty("cursor");
      if (navEdgeRef.current !== null) {
        navEdgeRef.current = null;
        setNavEdge(null);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [detachTapPointerListeners]);

  const handleImageClick = () => {
    if (suppressImageLinkClickRef.current) {
      suppressImageLinkClickRef.current = false;
      return;
    }
    const link = images[current]?.link?.trim();
    if (link) {
      const href = link.startsWith("/") ? link : `/${link}`;
      router.push(href);
    }
  };

  if (total === 0) {
    return (
      <section className="flex h-[calc(100dvh-72px)] items-center justify-center bg-[#f5f5f3]">
        <p className="text-sm text-neutral-500">등록된 이미지가 없습니다.</p>
      </section>
    );
  }

  const currentHasLink = !!images[current]?.link?.trim();

  return (
    <section className={HS_CLASSES.section}>
      <div
        ref={swiperShellRef}
        className={HS_CLASSES.swiperShell}
        onPointerDownCapture={handleSwiperShellPointerDown}
        onPointerMove={(e) => syncNavEdgeFromClientX(e.clientX)}
        onPointerLeave={handleSwiperShellPointerLeave}
      >
        <div className={HS_CLASSES.swiperInner}>
          <Swiper
            modules={[Autoplay]}
            loop={total > 1}
            autoplay={total > 1 ? { delay: 5000, disableOnInteraction: false } : false}
            speed={800}
            onSwiper={(s) => { swiperRef.current = s; }}
            onSlideChange={(s) => setCurrent(s.realIndex)}
            className="h-full w-full"
          >
            {images.map((img, i) => (
              <SwiperSlide key={img.url} className={HS_CLASSES.slide}>
                <div
                  className={`${HS_CLASSES.imageFrame} ${currentHasLink ? "cursor-pointer" : ""}`}
                  onClick={handleImageClick}
                >
                  <R2Image
                    src={img.url}
                    alt=""
                    mode="fill"
                    className={HS_CLASSES.imageFit}
                    sizes="(max-width: 767px) 86vw, min(96vw, 2400px)"
                    priority={i === 0}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Left nav zone – PC only */}
        {total > 1 && (
          <div className={`${HS_CLASSES.navHitOuter} left-0 md:justify-start`}>
            <button
              type="button"
              data-swiper-image-nav
              className={HS_CLASSES.navHitStripBtn}
              onClick={() => swiperRef.current?.slidePrev()}
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

        {total > 1 && (
          <div className={`${HS_CLASSES.navHitOuter} right-0 md:justify-end`}>
            <button
              type="button"
              data-swiper-image-nav
              className={HS_CLASSES.navHitStripBtnEnd}
              onClick={() => swiperRef.current?.slideNext()}
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
      </div>

      {/* Bottom bar — takes space on mobile, overlaid on PC */}
      <div className="flex shrink-0 items-center justify-end px-6 py-6 md:absolute md:bottom-0 md:left-0 md:right-0 md:z-20 md:px-10 md:py-8">
        {total > 1 && (
          <span className="text-xs text-neutral-900">
            {current + 1} / {total}
          </span>
        )}
      </div>
    </section>
  );
}
