"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";

import { R2Image } from "@/components/R2Image";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_MS = 300;
const NO_SWIPE_CLASS = "pv-lightbox-no-swipe";

type Transform = { scale: number; x: number; y: number };

function touchDistance(t0: Touch, t1: Touch): number {
  return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
}

/** object-contain 기준 표시 크기 */
function getFitSize(
  containerW: number,
  containerH: number,
  imgW: number,
  imgH: number,
): { w: number; h: number } {
  if (!containerW || !containerH || !imgW || !imgH) {
    return { w: containerW, h: containerH };
  }
  const imgRatio = imgW / imgH;
  const containerRatio = containerW / containerH;
  if (imgRatio > containerRatio) {
    return { w: containerW, h: containerW / imgRatio };
  }
  return { w: containerH * imgRatio, h: containerH };
}

/** 확대 후 이동 — 상·하·좌·우 빈 여백이 보이지 않도록 제한 */
function clampPan(
  x: number,
  y: number,
  scale: number,
  containerW: number,
  containerH: number,
  imgW: number,
  imgH: number,
): { x: number; y: number } {
  if (scale <= 1 || !containerW || !containerH) {
    return { x: 0, y: 0 };
  }

  const { w: fitW, h: fitH } = getFitSize(containerW, containerH, imgW, imgH);
  const scaledW = fitW * scale;
  const scaledH = fitH * scale;
  const maxX = Math.max(0, (scaledW - containerW) / 2);
  const maxY = Math.max(0, (scaledH - containerH) / 2);

  return {
    x: Math.min(maxX, Math.max(-maxX, x)),
    y: Math.min(maxY, Math.max(-maxY, y)),
  };
}

function ZoomableSlide({
  url,
  alt,
  priority,
  isActive,
  onZoomedChange,
}: {
  url: string;
  alt: string;
  priority: boolean;
  isActive: boolean;
  onZoomedChange: (zoomed: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerSizeRef = useRef({ w: 0, h: 0 });
  const imgSizeRef = useRef({ w: 0, h: 0 });
  const transformRef = useRef<Transform>({ scale: 1, x: 0, y: 0 });
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const panRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const lastTapRef = useRef(0);
  const hadMultiTouchRef = useRef(false);

  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 });
  const [isGesturing, setIsGesturing] = useState(false);

  const applyTransform = useCallback(
    (next: Transform) => {
      const { w: cw, h: ch } = containerSizeRef.current;
      const { w: iw, h: ih } = imgSizeRef.current;

      let scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next.scale));
      let x = next.x;
      let y = next.y;

      if (scale <= 1) {
        scale = 1;
        x = 0;
        y = 0;
      } else {
        const clamped = clampPan(x, y, scale, cw, ch, iw, ih);
        x = clamped.x;
        y = clamped.y;
      }

      const result = { scale, x, y };
      transformRef.current = result;
      setTransform(result);
      onZoomedChange(scale > 1);
    },
    [onZoomedChange],
  );

  const resetTransform = useCallback(() => {
    applyTransform({ scale: 1, x: 0, y: 0 });
  }, [applyTransform]);

  useEffect(() => {
    if (isActive) return;
    pinchRef.current = null;
    panRef.current = null;
    resetTransform();
  }, [isActive, resetTransform]);

  useEffect(() => {
    const probe = new window.Image();
    probe.onload = () => {
      imgSizeRef.current = {
        w: probe.naturalWidth,
        h: probe.naturalHeight,
      };
      if (transformRef.current.scale > 1) {
        applyTransform(transformRef.current);
      }
    };
    probe.src = url;
  }, [url, applyTransform]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      containerSizeRef.current = {
        w: el.clientWidth,
        h: el.clientHeight,
      };
      if (transformRef.current.scale > 1) {
        applyTransform(transformRef.current);
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [applyTransform]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isActive) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        hadMultiTouchRef.current = true;
      }
      if (e.touches.length === 2) {
        setIsGesturing(true);
        pinchRef.current = {
          dist: touchDistance(e.touches[0], e.touches[1]),
          scale: transformRef.current.scale,
        };
        panRef.current = null;
        return;
      }
      if (e.touches.length === 1 && transformRef.current.scale > 1) {
        setIsGesturing(true);
        panRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          ox: transformRef.current.x,
          oy: transformRef.current.y,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const dist = touchDistance(e.touches[0], e.touches[1]);
        const nextScale = Math.min(
          MAX_SCALE,
          Math.max(
            MIN_SCALE,
            (pinchRef.current.scale * dist) / pinchRef.current.dist,
          ),
        );
        const scale = nextScale <= 1 ? 1 : nextScale;
        applyTransform({
          scale,
          x: transformRef.current.x,
          y: transformRef.current.y,
        });
        return;
      }
      if (e.touches.length === 1 && panRef.current && transformRef.current.scale > 1) {
        e.preventDefault();
        const t = panRef.current;
        const rawX = t.ox + (e.touches[0].clientX - t.x);
        const rawY = t.oy + (e.touches[0].clientY - t.y);
        const { w: cw, h: ch } = containerSizeRef.current;
        const { w: iw, h: ih } = imgSizeRef.current;
        const clamped = clampPan(
          rawX,
          rawY,
          transformRef.current.scale,
          cw,
          ch,
          iw,
          ih,
        );
        if (rawX !== clamped.x) t.ox += clamped.x - rawX;
        if (rawY !== clamped.y) t.oy += clamped.y - rawY;
        applyTransform({
          scale: transformRef.current.scale,
          x: clamped.x,
          y: clamped.y,
        });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        pinchRef.current = null;
        panRef.current = null;
        setIsGesturing(false);

        if (hadMultiTouchRef.current) {
          hadMultiTouchRef.current = false;
          return;
        }

        const now = Date.now();
        if (now - lastTapRef.current < DOUBLE_TAP_MS) {
          if (transformRef.current.scale > 1) {
            resetTransform();
          } else {
            applyTransform({ scale: 2, x: 0, y: 0 });
          }
          lastTapRef.current = 0;
          return;
        }
        if (e.changedTouches.length === 1) {
          lastTapRef.current = now;
        }
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [isActive, applyTransform, resetTransform]);

  const zoomed = transform.scale > 1;

  return (
    <div
      ref={containerRef}
      className={`flex h-full w-full items-center justify-center overflow-hidden px-4 ${
        zoomed ? NO_SWIPE_CLASS : ""
      }`}
      style={{ touchAction: "none" }}
    >
      <div
        className="relative h-full w-full will-change-transform"
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
          transformOrigin: "center center",
          transition: isGesturing ? "none" : "transform 0.2s ease-out",
        }}
      >
        <R2Image
          src={url}
          alt={alt}
          mode="fill"
          className="pointer-events-none object-contain"
          sizes="100vw"
          priority={priority}
        />
      </div>
    </div>
  );
}

type Props = {
  images: string[];
  initialIndex: number;
  alt: string;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
};

export function MobileImageLightbox({
  images,
  initialIndex,
  alt,
  onClose,
  onIndexChange,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  const swiperRef = useRef<SwiperType | null>(null);
  const total = images.length;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper) return;
    swiper.allowTouchMove = !isZoomed;
  }, [isZoomed]);

  const handleSlideChange = (s: SwiperType) => {
    const idx = s.realIndex;
    setActiveIndex(idx);
    setIsZoomed(false);
    onIndexChange?.(idx);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-[#F5F4F0] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="이미지 확대 보기"
    >
      <div className="flex shrink-0 items-center justify-between px-6 pb-2 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-neutral-900"
        >
          닫기
        </button>
        {total > 1 && (
          <span className="text-[0.8125rem] font-medium text-neutral-900">
            {activeIndex + 1} / {total}
          </span>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        <Swiper
          initialSlide={initialIndex}
          loop={total > 1}
          allowTouchMove={!isZoomed}
          noSwiping
          noSwipingClass={NO_SWIPE_CLASS}
          speed={300}
          onSwiper={(s) => {
            swiperRef.current = s;
          }}
          onSlideChange={handleSlideChange}
          className="h-full w-full"
        >
          {images.map((url, i) => (
            <SwiperSlide
              key={url + i}
              className="!flex h-full items-center justify-center"
            >
              <ZoomableSlide
                url={url}
                alt={alt}
                priority={i === initialIndex}
                isActive={i === activeIndex}
                onZoomedChange={setIsZoomed}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <p className="shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-neutral-500">
        두 손가락으로 확대 · 두 번 탭하여 확대/축소 · 축소 후 좌우로 넘기기
      </p>
    </div>
  );
}
