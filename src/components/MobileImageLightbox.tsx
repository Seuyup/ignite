"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";

import { R2Image } from "@/components/R2Image";

const MIN_SCALE = 1;
const MAX_SCALE = 4;

function touchDistance(t0: React.Touch, t1: React.Touch): number {
  return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
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
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isGesturing, setIsGesturing] = useState(false);

  const swiperRef = useRef<SwiperType | null>(null);
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const panRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const lastTapRef = useRef(0);

  const total = images.length;

  const resetTransform = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

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

  const handleSlideChange = (s: SwiperType) => {
    const idx = s.realIndex;
    setActiveIndex(idx);
    onIndexChange?.(idx);
    resetTransform();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsGesturing(true);
      pinchRef.current = { dist: touchDistance(e.touches[0], e.touches[1]), scale };
      panRef.current = null;
      return;
    }
    if (e.touches.length === 1 && scale > 1) {
      setIsGesturing(true);
      panRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        ox: offset.x,
        oy: offset.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dist = touchDistance(e.touches[0], e.touches[1]);
      const next = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, (pinchRef.current.scale * dist) / pinchRef.current.dist),
      );
      setScale(next);
      if (next <= 1) setOffset({ x: 0, y: 0 });
      return;
    }
    if (e.touches.length === 1 && panRef.current && scale > 1) {
      e.preventDefault();
      const t = panRef.current;
      setOffset({
        x: t.ox + (e.touches[0].clientX - t.x),
        y: t.oy + (e.touches[0].clientY - t.y),
      });
    }
  };

  const handleTouchEnd = () => {
    pinchRef.current = null;
    panRef.current = null;
    setIsGesturing(false);
  };

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (scale > 1) resetTransform();
      else setScale(2);
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
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
          allowTouchMove={scale <= 1}
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
              <div
                className="flex h-full w-full touch-none items-center justify-center overflow-hidden px-4"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                onClick={handleTap}
              >
                <div
                  className="relative h-full w-full"
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                    transition: isGesturing ? "none" : "transform 0.2s ease-out",
                  }}
                >
                  <R2Image
                    src={url}
                    alt={alt}
                    mode="fill"
                    className="object-contain"
                    sizes="100vw"
                    priority={i === initialIndex}
                  />
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <p className="shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-neutral-500">
        두 손가락으로 확대 · 두 번 탭하여 확대/축소
      </p>
    </div>
  );
}
