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

  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, [lightbox.index, currentSrc]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const s0 = scaleRef.current;
      const next = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, s0 + (-e.deltaY / 400) * (s0 * 0.15 + 0.2)),
      );
      setScale(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    if (scale <= MIN_SCALE + 0.001) {
      setPan({ x: 0, y: 0 });
    } else {
      setPan((p) => clampPan(p.x, p.y, scale));
    }
  }, [scale]);

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

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (scale <= MIN_SCALE + 0.001) return;
      if (e.button !== 0) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        pid: e.pointerId,
        sx: e.clientX,
        sy: e.clientY,
        ox: pan.x,
        oy: pan.y,
      };
      setIsDragging(true);
    },
    [scale, pan.x, pan.y],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d || d.pid !== e.pointerId) return;
      const nx = d.ox + (e.clientX - d.sx);
      const ny = d.oy + (e.clientY - d.sy);
      setPan(clampPan(nx, ny, scaleRef.current));
    },
    [],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (d && d.pid === e.pointerId) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      dragRef.current = null;
      setIsDragging(false);
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      const s = scaleRef.current;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (s > MIN_SCALE + 0.001) panBy(-PAN_STEP, 0);
        else if (multi) goPrev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (s > MIN_SCALE + 0.001) panBy(PAN_STEP, 0);
        else if (multi) goNext();
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
  }, [onClose, goPrev, goNext, multi, panBy]);

  const zoomed = scale > MIN_SCALE + 0.001;
  const dragging = isDragging;

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
        className="absolute right-4 top-4 z-[103] rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-white hover:bg-white/25"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        닫기
      </button>

      {multi ? (
        <button
          type="button"
          aria-label="이전 이미지"
          title="이전 (←, 1배율일 때)"
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
          title="다음 (→, 1배율일 때)"
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
        className="relative z-[102] flex h-[min(85vh,1400px)] w-[min(96vw,1600px)] cursor-default touch-none flex-col items-center justify-center overflow-hidden rounded-lg bg-black/20 shadow-inner"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex h-full w-full flex-1 items-center justify-center px-4 pb-16 pt-14">
          <div
            className={
              zoomed
                ? `${dragging ? "cursor-grabbing" : "cursor-grab"} select-none`
                : "select-none"
            }
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transition: dragging ? "none" : "transform 0.12s ease-out",
              transformOrigin: "center center",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- 동적·외부 URL */}
            <img
              key={`${lightbox.index}-${currentSrc}`}
              src={currentSrc}
              alt=""
              draggable={false}
              className="max-h-[min(72vh,1200px)] max-w-[min(92vw,1500px)] object-contain shadow-2xl"
            />
          </div>
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
 * 본문 순서대로 이전/다음 이미지, 휠·버튼 줌, 확대 시 드래그 이동을 지원합니다.
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
