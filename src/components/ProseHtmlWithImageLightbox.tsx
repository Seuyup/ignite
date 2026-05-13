"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  html: string;
  className?: string;
};

type LightboxState = {
  urls: string[];
  index: number;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.2;
const PAN_STEP = 56;
const SWIPE_THRESHOLD_PX = 50;
const PINCH_MIN_SPAN_PX = 12;
const SWIPE_ANIM_MS = 280;

function collectGalleryFromContainer(root: HTMLElement): string[] {
  const imgs = root.querySelectorAll("img");
  const out: string[] = [];
  imgs.forEach((img) => {
    const src = (img.currentSrc || img.getAttribute("src") || "").trim();
    if (src) out.push(src);
  });
  return out;
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5 15.75 12l-7.5 7.5" />
    </svg>
  );
}

function clampPan(x: number, y: number, scale: number): { x: number; y: number } {
  const lim = 320 * Math.max(0, scale - 1);
  return {
    x: Math.max(-lim, Math.min(lim, x)),
    y: Math.max(-lim, Math.min(lim, y)),
  };
}

function wrapIndex(i: number, len: number) {
  return ((i % len) + len) % len;
}

type LightboxPanelProps = {
  lightbox: LightboxState;
  currentSrc: string;
  multi: boolean;
  positionLabel: string;
  onClose: () => void;
  goPrev: () => void;
  goNext: () => void;
};

function LightboxPanel({
  lightbox,
  currentSrc,
  multi,
  positionLabel,
  onClose,
  goPrev,
  goNext,
}: LightboxPanelProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef<{
    pid: number;
    sx: number;
    sy: number;
    ox: number;
    oy: number;
  } | null>(null);
  const scaleRef = useRef(1);
  scaleRef.current = scale;
  const panRef = useRef({ x: 0, y: 0 });
  panRef.current = pan;

  const activePointersRef = useRef(new Map<number, { x: number; y: number }>());

  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeMode, setSwipeMode] = useState<"idle" | "animate" | "none">("none");
  const mouseSwipeRef = useRef<{ x0: number; y0: number; pid: number } | null>(null);
  const touchSwipeRef = useRef<{ x0: number; y0: number } | null>(null);
  const pendingNavRef = useRef<"next" | "prev" | null>(null);
  const animatingRef = useRef(false);

  const commitSwipeFromRef = useRef<(dx: number) => void>(() => {});

  const goPrevRef = useRef(goPrev);
  goPrevRef.current = goPrev;
  const goNextRef = useRef(goNext);
  goNextRef.current = goNext;
  const multiRef = useRef(multi);
  multiRef.current = multi;

  const resetSwipe = useCallback(() => {
    setSwipeMode("none");
    setSwipeOffset(0);
    pendingNavRef.current = null;
    animatingRef.current = false;
  }, []);

  const getTrackWidth = useCallback(() => {
    return trackRef.current?.clientWidth ?? viewportRef.current?.clientWidth ?? 800;
  }, []);

  const commitSwipe = useCallback(
    (dx: number) => {
      if (animatingRef.current) return;
      if (Math.abs(dx) > SWIPE_THRESHOLD_PX) {
        const dir = dx < 0 ? "next" : "prev";
        pendingNavRef.current = dir;
        animatingRef.current = true;
        const w = getTrackWidth();
        setSwipeMode("animate");
        setSwipeOffset(dir === "next" ? -w : w);
      } else if (Math.abs(dx) > 1) {
        setSwipeMode("animate");
        setSwipeOffset(0);
      } else {
        resetSwipe();
      }
    },
    [getTrackWidth, resetSwipe],
  );

  commitSwipeFromRef.current = commitSwipe;

  const onSwipeTransitionEnd = useCallback(() => {
    const dir = pendingNavRef.current;
    pendingNavRef.current = null;
    animatingRef.current = false;
    setSwipeOffset(0);
    setSwipeMode("none");
    if (dir) {
      if (dir === "next") goNextRef.current();
      else goPrevRef.current();
    }
  }, []);

  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    activePointersRef.current.clear();
    dragRef.current = null;
    mouseSwipeRef.current = null;
    touchSwipeRef.current = null;
    setIsDragging(false);
    resetSwipe();
  }, [lightbox.index, currentSrc, resetSwipe]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const next = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, scaleRef.current + (-e.deltaY / 400) * (scaleRef.current * 0.15 + 0.2)),
      );
      setScale(next);
    };

    const touchDist = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const a = touches.item(0)!;
      const b = touches.item(1)!;
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    };

    let touchPinch: { dist0: number; scale0: number } | null = null;
    let sawSecondFinger = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        sawSecondFinger = true;
        touchSwipeRef.current = null;
        if (!animatingRef.current) {
          setSwipeMode("none");
          setSwipeOffset(0);
        }
        const d0 = touchDist(e.touches);
        touchPinch =
          d0 >= PINCH_MIN_SPAN_PX ? { dist0: d0, scale0: scaleRef.current } : null;
      } else if (e.touches.length === 1) {
        if (!sawSecondFinger && multiRef.current && scaleRef.current <= MIN_SCALE + 0.001 && !animatingRef.current) {
          const t = e.touches.item(0)!;
          touchSwipeRef.current = { x0: t.clientX, y0: t.clientY };
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (touchPinch && e.touches.length >= 2) {
        e.preventDefault();
        const d1 = touchDist(e.touches);
        if (touchPinch.dist0 >= PINCH_MIN_SPAN_PX && d1 > 0) {
          const next = Math.min(
            MAX_SCALE,
            Math.max(MIN_SCALE, touchPinch.scale0 * (d1 / touchPinch.dist0)),
          );
          setScale(next);
        }
        return;
      }
      const sw = touchSwipeRef.current;
      if (
        e.touches.length === 1 &&
        sw &&
        multiRef.current &&
        scaleRef.current <= MIN_SCALE + 0.001 &&
        !animatingRef.current
      ) {
        const t = e.touches.item(0)!;
        const dx = t.clientX - sw.x0;
        const dy = t.clientY - sw.y0;
        if (Math.abs(dx) > 5 || Math.abs(dx) > Math.abs(dy) * 0.45) {
          e.preventDefault();
          setSwipeMode("idle");
          setSwipeOffset(dx);
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) touchPinch = null;

      if (e.touches.length === 0) {
        if (sawSecondFinger) {
          if (!animatingRef.current) {
            setSwipeMode("none");
            setSwipeOffset(0);
          }
        } else if (
          touchSwipeRef.current &&
          multiRef.current &&
          scaleRef.current <= MIN_SCALE + 0.001
        ) {
          const t = e.changedTouches.item(0);
          if (t) {
            const dx = t.clientX - touchSwipeRef.current.x0;
            const dy = t.clientY - touchSwipeRef.current.y0;
            if (Math.abs(dx) > Math.abs(dy) * 1.15) {
              commitSwipeFromRef.current(dx);
            } else {
              setSwipeMode("animate");
              setSwipeOffset(0);
            }
          }
        }
        sawSecondFinger = false;
        touchSwipeRef.current = null;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [currentSrc]);

  useEffect(() => {
    if (scale <= MIN_SCALE + 0.001) {
      setPan({ x: 0, y: 0 });
    } else {
      setPan((p) => clampPan(p.x, p.y, scale));
      resetSwipe();
    }
  }, [scale, resetSwipe]);

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(MAX_SCALE, s + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(MIN_SCALE, s - ZOOM_STEP));
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const panBy = useCallback((dx: number, dy: number) => {
    setPan((p) => clampPan(p.x + dx, p.y + dy, scaleRef.current));
  }, []);

  const onViewportPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 && e.button !== -1) return;
      const el = e.currentTarget;
      const map = activePointersRef.current;
      map.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (map.size === 2) {
        mouseSwipeRef.current = null;
        if (dragRef.current) {
          try {
            el.releasePointerCapture(dragRef.current.pid);
          } catch {
            /* ignore */
          }
          dragRef.current = null;
          setIsDragging(false);
        }
        return;
      }

      if (map.size === 1) {
        const s = scaleRef.current;
        if (e.pointerType === "mouse" && multiRef.current && s <= MIN_SCALE + 0.001 && !animatingRef.current) {
          mouseSwipeRef.current = { x0: e.clientX, y0: e.clientY, pid: e.pointerId };
        } else {
          mouseSwipeRef.current = null;
        }
        if (s > MIN_SCALE + 0.001) {
          try {
            el.setPointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
          const p = panRef.current;
          dragRef.current = {
            pid: e.pointerId,
            sx: e.clientX,
            sy: e.clientY,
            ox: p.x,
            oy: p.y,
          };
          setIsDragging(true);
        }
      }
    },
    [],
  );

  const onViewportPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const map = activePointersRef.current;
    if (!map.has(e.pointerId)) return;
    map.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const d = dragRef.current;
    if (d && d.pid === e.pointerId) {
      const nx = d.ox + (e.clientX - d.sx);
      const ny = d.oy + (e.clientY - d.sy);
      setPan(clampPan(nx, ny, scaleRef.current));
      return;
    }

    const sw = mouseSwipeRef.current;
    if (
      sw &&
      sw.pid === e.pointerId &&
      e.pointerType === "mouse" &&
      multiRef.current &&
      scaleRef.current <= MIN_SCALE + 0.001 &&
      !animatingRef.current
    ) {
      const dx = e.clientX - sw.x0;
      setSwipeMode("idle");
      setSwipeOffset(dx);
    }
  }, []);

  const onViewportPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const map = activePointersRef.current;

      const sw = mouseSwipeRef.current;
      if (
        sw &&
        sw.pid === e.pointerId &&
        e.pointerType === "mouse" &&
        multiRef.current &&
        scaleRef.current <= MIN_SCALE + 0.001
      ) {
        const dx = e.clientX - sw.x0;
        commitSwipe(dx);
      }
      if (sw?.pid === e.pointerId) mouseSwipeRef.current = null;

      map.delete(e.pointerId);

      const dr = dragRef.current;
      if (dr && dr.pid === e.pointerId) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        dragRef.current = null;
        setIsDragging(false);
      }
    },
    [commitSwipe],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      const s = scaleRef.current;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (s > MIN_SCALE + 0.001) panBy(-PAN_STEP, 0);
        else if (multi) goPrevRef.current();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (s > MIN_SCALE + 0.001) panBy(PAN_STEP, 0);
        else if (multi) goNextRef.current();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (s > MIN_SCALE + 0.001) panBy(0, -PAN_STEP);
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (s > MIN_SCALE + 0.001) panBy(0, PAN_STEP);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, multi, panBy]);

  const zoomed = scale > MIN_SCALE + 0.001;
  const dragging = isDragging;

  const prevSrc = multi ? lightbox.urls[wrapIndex(lightbox.index - 1, lightbox.urls.length)] : null;
  const nextSrc = multi ? lightbox.urls[wrapIndex(lightbox.index + 1, lightbox.urls.length)] : null;

  const imgClass = "max-h-[min(72vh,1200px)] max-w-[min(80vw,1500px)] object-contain shadow-2xl md:max-w-[min(92vw,1500px)]";

  return (
    <div
      className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="이미지 확대 보기"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="닫기"
        title="닫기 (Esc)"
        className="absolute right-4 top-4 z-[103] flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white hover:bg-white/25"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-5 w-5"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>

      {multi ? (
        <button
          type="button"
          aria-label="이전 이미지"
          title="이전 (←)"
          className="absolute left-2 top-1/2 z-[103] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white hover:bg-black/60 md:left-6 md:h-14 md:w-14"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
        >
          <ChevronLeft className="h-7 w-7 md:h-8 md:w-8" />
        </button>
      ) : null}
      {multi ? (
        <button
          type="button"
          aria-label="다음 이미지"
          title="다음 (→)"
          className="absolute right-2 top-1/2 z-[103] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white hover:bg-black/60 md:right-6 md:h-14 md:w-14"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
        >
          <ChevronRight className="h-7 w-7 md:h-8 md:w-8" />
        </button>
      ) : null}

      <div
        className="pointer-events-auto absolute left-1/2 top-4 z-[103] flex -translate-x-1/2 flex-wrap items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-1 rounded-full border border-white/20 bg-black/55 px-2 py-1.5">
          <button
            type="button"
            title="축소"
            aria-label="축소"
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold text-white hover:bg-white/15"
            onClick={(e) => {
              e.stopPropagation();
              zoomOut();
            }}
          >
            −
          </button>
          <button
            type="button"
            title="화면 맞춤"
            aria-label="배율 초기화"
            className="min-w-[3.25rem] rounded-full px-2 py-1 text-[11px] font-medium tabular-nums text-white/90 hover:bg-white/15"
            onClick={(e) => {
              e.stopPropagation();
              resetView();
            }}
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            title="확대"
            aria-label="확대"
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold text-white hover:bg-white/15"
            onClick={(e) => {
              e.stopPropagation();
              zoomIn();
            }}
          >
            +
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className={`relative z-[102] flex h-[min(85vh,1400px)] w-[min(96vw,1600px)] cursor-default touch-none flex-col items-center justify-center overflow-hidden rounded-lg bg-black/20 shadow-inner ${zoomed ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onViewportPointerDown}
        onPointerMove={onViewportPointerMove}
        onPointerUp={onViewportPointerUp}
        onPointerCancel={onViewportPointerUp}
      >
        <div className="pointer-events-none relative flex h-full w-full flex-1 items-center justify-center overflow-hidden px-4 pb-16 pt-14">
          {zoomed ? (
            <div
              className="select-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transition: dragging ? "none" : "transform 0.12s ease-out",
                transformOrigin: "center center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={`${lightbox.index}-${currentSrc}`}
                src={currentSrc}
                alt=""
                draggable={false}
                className={imgClass}
              />
            </div>
          ) : (
            <div
              ref={trackRef}
              className="relative h-full w-full"
              onTransitionEnd={(e) => {
                if (e.propertyName === "transform" && e.target === e.currentTarget) {
                  onSwipeTransitionEnd();
                }
              }}
              style={{
                transform: `translateX(${swipeOffset}px)`,
                transition:
                  swipeMode === "animate"
                    ? `transform ${SWIPE_ANIM_MS}ms cubic-bezier(0.33, 1, 0.68, 1)`
                    : "none",
              }}
            >
              {multi && prevSrc ? (
                <div
                  className="absolute inset-y-0 flex items-center justify-center overflow-hidden"
                  style={{ right: "100%", width: "100%" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={prevSrc} alt="" draggable={false} className={imgClass} />
                </div>
              ) : null}

              <div className="flex h-full w-full select-none items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={`${lightbox.index}-${currentSrc}`}
                  src={currentSrc}
                  alt=""
                  draggable={false}
                  className={imgClass}
                />
              </div>

              {multi && nextSrc ? (
                <div
                  className="absolute inset-y-0 flex items-center justify-center overflow-hidden"
                  style={{ left: "100%", width: "100%" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={nextSrc} alt="" draggable={false} className={imgClass} />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {multi ? (
        <p
          className="pointer-events-none absolute bottom-5 left-0 right-0 z-[101] text-center text-xs tabular-nums text-white/90"
          aria-live="polite"
        >
          <span className="inline-block rounded-full bg-black/50 px-3 py-1">{positionLabel}</span>
        </p>
      ) : null}
    </div>
  );
}

/**
 * `dangerouslySetInnerHTML`로 넣은 본문 안의 `<img>`를 클릭하면 확대(라이트박스)합니다.
 * 본문 순서대로 이전/다음 이미지, 휠·버튼·핀치(2손가락) 줌, 1배율에서 스와이프 넘기기, 확대 시 드래그 이동을 지원합니다.
 */
export function ProseHtmlWithImageLightbox({ html, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLImageElement)) return;

      const urls = collectGalleryFromContainer(el);
      if (!urls.length) return;

      const imgs = Array.from(el.querySelectorAll("img"));
      const idx = imgs.indexOf(target);
      if (idx < 0) return;

      e.preventDefault();
      e.stopPropagation();
      setLightbox({ urls, index: idx });
    };

    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [html]);

  const close = useCallback(() => setLightbox(null), []);

  const goPrev = useCallback(() => {
    setLightbox((s) => {
      if (!s || s.urls.length < 2) return s;
      return {
        urls: s.urls,
        index: (s.index - 1 + s.urls.length) % s.urls.length,
      };
    });
  }, []);

  const goNext = useCallback(() => {
    setLightbox((s) => {
      if (!s || s.urls.length < 2) return s;
      return {
        urls: s.urls,
        index: (s.index + 1) % s.urls.length,
      };
    });
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  const mergedClass = [
    className,
    "[&_img]:cursor-pointer [&_img]:transition-opacity hover:[&_img]:opacity-90",
  ]
    .filter(Boolean)
    .join(" ");

  const currentSrc =
    lightbox && lightbox.urls.length > 0
      ? lightbox.urls[Math.min(lightbox.index, lightbox.urls.length - 1)]
      : null;
  const multi = Boolean(lightbox && lightbox.urls.length > 1);
  const positionLabel = lightbox
    ? `${lightbox.index + 1} / ${lightbox.urls.length}`
    : "";

  return (
    <>
      <div
        ref={containerRef}
        className={mergedClass}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {lightbox && currentSrc ? (
        <LightboxPanel
          lightbox={lightbox}
          currentSrc={currentSrc}
          multi={multi}
          positionLabel={positionLabel}
          onClose={close}
          goPrev={goPrev}
          goNext={goNext}
        />
      ) : null}
    </>
  );
}
