"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";

import { R2Image } from "@/components/R2Image";
import { useSlideNav, goSlidePrev, goSlideNext } from "@/hooks/useSlideNav";
import type { HomeImage } from "@/lib/ignite-data";

const HS_CLASSES = {
  section:
    "flex min-h-0 h-[calc(100dvh-72px)] w-full flex-col bg-[#F5F4F0] md:relative md:-mt-[72px] md:h-dvh md:flex-none md:bg-transparent",
  swiperShell:
    "relative flex-1 min-h-0 overflow-hidden",
  swiperInner: "relative h-full min-h-0 w-full",
  slide:
    "!flex items-center justify-center px-4 md:px-[10%] md:pt-[72px] md:pb-[calc(2rem+2rem+1.25rem+env(safe-area-inset-bottom,0px))]",
  imageFrame:
    "relative h-full min-h-0 max-h-[90dvh] w-[86%] md:h-full md:w-full md:max-h-full",
  imageFit: "pointer-events-none object-contain md:!object-cover md:object-center",
  navHitOuter:
    "absolute top-0 z-20 hidden h-full items-center md:flex md:pointer-events-none md:top-[72px] md:h-auto md:bottom-[calc(2rem+2rem+1.25rem+env(safe-area-inset-bottom,0px))] md:w-[40%]",
  navHitStripBtn:
    "group/strip flex h-full w-32 shrink-0 cursor-pointer items-center justify-start border-0 bg-transparent p-0 pl-6 text-neutral-900 md:pl-10 pointer-events-auto",
  navHitStripBtnEnd:
    "group/strip flex h-full w-32 shrink-0 cursor-pointer items-center justify-end border-0 bg-transparent p-0 pr-6 text-neutral-900 md:pr-10 pointer-events-auto",
} as const;

const AUTOPLAY_DELAY = 5000;

type Props = { images: HomeImage[] };

export function HomeSlideshow({ images }: Props) {
  const router = useRouter();
  const swiperRef = useRef<SwiperType | null>(null);
  const swiperShellRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const total = images.length;
  const autoplayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suppressClickRef = useRef(false);

  const { navEdge, isMobile, reset, shellProps } = useSlideNav({
    swiperRef,
    shellRef: swiperShellRef,
    total,
    onTapNav: () => {
      suppressClickRef.current = true;
    },
  });

  const clearAutoplay = useCallback(() => {
    if (autoplayTimer.current) {
      clearTimeout(autoplayTimer.current);
      autoplayTimer.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    clearAutoplay();
    if (total <= 1) return;
    autoplayTimer.current = setTimeout(() => {
      const sw = swiperRef.current;
      if (sw) goSlideNext(sw, total);
    }, AUTOPLAY_DELAY);
  }, [total, clearAutoplay]);

  useEffect(() => {
    setCurrent(0);
    reset();
    swiperRef.current?.slideTo(0, 0);
    startAutoplay();
    return clearAutoplay;
  }, [images, reset, startAutoplay, clearAutoplay]);

  const handleSlideChange = useCallback(
    (s: SwiperType) => {
      setCurrent(s.activeIndex);
      startAutoplay();
    },
    [startAutoplay],
  );

  const handleImageClick = useCallback(() => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    const link = images[current]?.link?.trim();
    if (link) {
      const href = link.startsWith("/") ? link : `/${link}`;
      router.push(href);
    }
  }, [images, current, router]);

  if (total === 0) {
    return (
      <section className="flex h-[calc(100dvh-72px)] items-center justify-center bg-[#F5F4F0]">
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
        {...shellProps}
      >
        <div className={HS_CLASSES.swiperInner}>
          <Swiper
            allowTouchMove={isMobile}
            speed={800}
            onSwiper={(s) => { swiperRef.current = s; }}
            onSlideChange={handleSlideChange}
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

        {total > 1 && (
          <div className={`${HS_CLASSES.navHitOuter} left-0 md:justify-start`}>
            <button
              type="button"
              data-swiper-image-nav
              className={HS_CLASSES.navHitStripBtn}
              onClick={() => {
                const sw = swiperRef.current;
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

        {total > 1 && (
          <div className={`${HS_CLASSES.navHitOuter} right-0 md:justify-end`}>
            <button
              type="button"
              data-swiper-image-nav
              className={HS_CLASSES.navHitStripBtnEnd}
              onClick={() => {
                const sw = swiperRef.current;
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
      </div>

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
