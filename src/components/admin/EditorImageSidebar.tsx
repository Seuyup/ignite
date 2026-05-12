"use client";

import {
  extractImgEntriesFromHtml,
  removeImgAtIndexFromHtml,
} from "@/lib/html-body-images";
import { useCallback, useMemo } from "react";

function CopyUrlIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

/** 겹친 문서 형태 — 목록 전체 복사 의미 */
function CopyAllUrlsIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 7.125v-.75a3 3 0 00-3-3h-9a3 3 0 00-3 3v11.25a3 3 0 003 3h9a3 3 0 003-3v-.75M19.125 7.5h-9.75a1.125 1.125 0 00-1.125 1.125v9.75c0 .621.504 1.125 1.125 1.125h9.75a1.125 1.125 0 001.125-1.125v-9.75a1.125 1.125 0 00-1.125-1.125z"
      />
    </svg>
  );
}

type Props = {
  /** 시각 편집: 에디터 HTML / HTML 모드: 소스 버퍼 */
  bodyHtml: string;
  onBodyHtmlChange: (nextHtml: string) => void;
};

export function EditorImageSidebar({ bodyHtml, onBodyHtmlChange }: Props) {
  const images = useMemo(
    () => extractImgEntriesFromHtml(bodyHtml),
    [bodyHtml],
  );

  const copyUrl = useCallback(async (src: string) => {
    if (!src) return;
    try {
      await navigator.clipboard.writeText(src);
    } catch {
      window.prompt("URL을 복사하세요 (Ctrl+C 후 닫기)", src);
    }
  }, []);

  const allImageUrls = useMemo(
    () => images.map((i) => i.src).filter((s) => s.length > 0),
    [images],
  );

  const copyAllImageUrls = useCallback(async () => {
    if (!allImageUrls.length) return;
    const text = allImageUrls.join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.prompt("URL을 복사하세요 (Ctrl+C 후 닫기)", text);
    }
  }, [allImageUrls]);

  const removeImageAtDomIndex = useCallback(
    (domIndex: number) => {
      if (!window.confirm("이 이미지를 본문에서 제거할까요?")) return;
      const next = removeImgAtIndexFromHtml(bodyHtml, domIndex);
      if (next !== bodyHtml) onBodyHtmlChange(next);
    },
    [bodyHtml, onBodyHtmlChange],
  );

  return (
    <aside
      className="flex max-h-[min(70vh,520px)] w-full max-w-full shrink-0 flex-col overflow-hidden rounded-xl border border-neutral-300 bg-white shadow-sm lg:w-max lg:shrink-0"
      aria-label="본문 이미지 목록"
    >
      <div className="flex shrink-0 items-center justify-between gap-1 border-b border-neutral-200 px-2 py-1.5">
        <p className="min-w-0 truncate text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-500">
          본문 이미지
        </p>
        <button
          type="button"
          title="본문에 있는 모든 이미지 URL을 한 번에 복사합니다. (한 줄에 하나씩)"
          aria-label="모든 이미지 URL 한 번에 복사"
          disabled={allImageUrls.length === 0}
          onClick={() => void copyAllImageUrls()}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-700 transition-colors hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CopyAllUrlsIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 w-full flex-1 overflow-y-auto px-1.5 py-2">
        {images.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-neutral-500">
            삽입된 이미지가 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col items-start gap-2">
            {images.map((item) => (
              <li
                key={`img-${item.domIndex}`}
                className="flex w-fit max-w-full items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 p-1.5"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                  {item.src ? (
                    // eslint-disable-next-line @next/next/no-img-element -- 동적 URL
                    <img
                      src={item.src}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col justify-center gap-1">
                  <button
                    type="button"
                    title={
                      item.src
                        ? "이미지 URL을 클립보드에 복사합니다."
                        : "복사할 URL이 없습니다."
                    }
                    aria-label="이미지 URL 복사"
                    disabled={!item.src}
                    onClick={() => void copyUrl(item.src)}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-700 transition-colors hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <CopyUrlIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="본문에서 이 이미지를 삭제합니다."
                    aria-label="본문에서 이미지 삭제"
                    onClick={() => removeImageAtDomIndex(item.domIndex)}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-800"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
