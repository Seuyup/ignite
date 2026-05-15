"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Swiper as SwiperType } from "swiper";

export type NavEdge = "left" | "right" | null;

const MD_MIN_PX = 768;
const TAP_MOVE_MAX_PX = 12;

function navZoneFromClient(shell: HTMLElement, clientX: number): NavEdge {
  const rect = shell.getBoundingClientRect();
  const w = rect.width;
  if (w <= 0) return null;
  const x = clientX - rect.left;
  if (x <= w * 0.4) return "left";
  if (x >= w * 0.6) return "right";
  return null;
}

type TapTrack = { pointerId: number; x: number; y: number; zone: "left" | "right" };

export function useSlideNav(opts: {
  swiperRef: React.RefObject<SwiperType | null>;
  shellRef: React.RefObject<HTMLDivElement | null>;
  total: number;
  disabled?: boolean;
  onTapNav?: () => void;
}) {
  const { swiperRef, shellRef, total, disabled = false, onTapNav } = opts;

  const [navEdge, setNavEdge] = useState<NavEdge>(null);
  const navEdgeRef = useRef<NavEdge>(null);

  const tapTrackRef = useRef<TapTrack | null>(null);
  const tapPointerUpRef = useRef<((e: PointerEvent) => void) | null>(null);

  const totalRef = useRef(total);
  totalRef.current = total;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const detachTapListeners = useCallback(() => {
    const h = tapPointerUpRef.current;
    if (h) {
      window.removeEventListener("pointerup", h);
      window.removeEventListener("pointercancel", h);
      tapPointerUpRef.current = null;
    }
    tapTrackRef.current = null;
  }, []);

  useEffect(() => () => detachTapListeners(), [detachTapListeners]);

  const resetNavEdge = useCallback(() => {
    shellRef.current?.style.removeProperty("cursor");
    if (navEdgeRef.current !== null) {
      navEdgeRef.current = null;
      setNavEdge(null);
    }
  }, [shellRef]);

  const reset = useCallback(() => {
    detachTapListeners();
    resetNavEdge();
  }, [detachTapListeners, resetNavEdge]);

  useEffect(() => {
    const onResize = () => {
      if (typeof window === "undefined" || window.innerWidth >= MD_MIN_PX) return;
      reset();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [reset]);

  const syncNavEdge = useCallback(
    (clientX: number) => {
      const shell = shellRef.current;
      if (typeof window === "undefined" || window.innerWidth < MD_MIN_PX) {
        resetNavEdge();
        return;
      }
      if (!shell) return;
      const next = navZoneFromClient(shell, clientX);
      if (navEdgeRef.current !== next) {
        navEdgeRef.current = next;
        setNavEdge(next);
      }
      if (disabledRef.current || totalRef.current <= 1) {
        shell.style.removeProperty("cursor");
      } else {
        shell.style.cursor = next ? "pointer" : "";
      }
    },
    [shellRef, resetNavEdge],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabledRef.current || totalRef.current <= 1) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;

      const el = e.target;
      if (!(el instanceof Element)) return;
      if (el.closest("[data-swiper-image-nav]")) return;

      const shell = shellRef.current;
      if (!shell?.contains(el)) return;

      const zone = navZoneFromClient(shell, e.clientX);
      if (!zone) return;

      detachTapListeners();
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
        onTapNav?.();
      };
      tapPointerUpRef.current = onUp;
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [shellRef, swiperRef, detachTapListeners, onTapNav],
  );

  const handlePointerLeave = useCallback(() => {
    resetNavEdge();
  }, [resetNavEdge]);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < MD_MIN_PX : true,
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MD_MIN_PX);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return {
    navEdge,
    isMobile,
    reset,
    shellProps: {
      onPointerDownCapture: handlePointerDown,
      onPointerMove: (e: React.PointerEvent) => syncNavEdge(e.clientX),
      onPointerLeave: handlePointerLeave,
    },
  };
}
