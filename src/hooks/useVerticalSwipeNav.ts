"use client";

import { useEffect, useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";

const TOUCH_LAYOUT_MAX_PX = 1024;
const SWIPE_MIN_PX = 20;
/** 화면 상·하 절반 영역에서 세로 스와이프 인식 */
const HALF_ZONE_RATIO = 0.5;

export function useTouchLayout() {
  const [isTouchLayout, setIsTouchLayout] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < TOUCH_LAYOUT_MAX_PX : true,
  );

  useEffect(() => {
    const check = () => {
      setIsTouchLayout(window.innerWidth < TOUCH_LAYOUT_MAX_PX);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isTouchLayout;
}

export function useVerticalSwipeNav(opts: {
  shellRef: React.RefObject<HTMLDivElement | null>;
  swiperRef: React.RefObject<SwiperType | null>;
  total: number;
  enabled: boolean;
  disabled?: boolean;
}) {
  const { shellRef, swiperRef, total, enabled, disabled = false } = opts;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || !enabled || total <= 1) return;

    let start: { x: number; y: number; id: number } | null = null;

    const onTouchStart = (e: TouchEvent) => {
      if (disabledRef.current || e.touches.length !== 1) return;
      const t = e.touches[0];
      start = { x: t.clientX, y: t.clientY, id: t.identifier };
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (disabledRef.current || !start) return;
      const t = Array.from(e.changedTouches).find((c) => c.identifier === start!.id)
        ?? e.changedTouches[0];
      if (!t) return;

      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const origin = start;
      start = null;

      if (Math.abs(dy) < SWIPE_MIN_PX) return;
      if (Math.abs(dx) > Math.abs(dy) * 0.85) return;

      const rect = shell.getBoundingClientRect();
      const relY = origin.y - rect.top;
      const half = rect.height * HALF_ZONE_RATIO;
      const inUpperHalf = relY < half;
      const inLowerHalf = relY >= half;

      // 하단 절반 + 위로 스와이프 → 다음(오른쪽)
      if (inLowerHalf && dy < 0) {
        swiperRef.current?.slideNext();
        return;
      }
      // 상단 절반 + 아래로 스와이프 → 이전(왼쪽)
      if (inUpperHalf && dy > 0) {
        swiperRef.current?.slidePrev();
      }
    };

    const opts = { capture: true, passive: true } as const;

    shell.addEventListener("touchstart", onTouchStart, opts);
    shell.addEventListener("touchend", onTouchEnd, opts);
    shell.addEventListener("touchcancel", onTouchEnd, opts);

    return () => {
      shell.removeEventListener("touchstart", onTouchStart, opts);
      shell.removeEventListener("touchend", onTouchEnd, opts);
      shell.removeEventListener("touchcancel", onTouchEnd, opts);
    };
  }, [enabled, total, shellRef, swiperRef]);
}
