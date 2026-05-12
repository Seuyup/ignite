"use client";

import type { AdminUploadProgress } from "@/lib/admin-upload-xhr";

type Props = {
  /** null 이면 숨김 */
  progress: AdminUploadProgress | null;
};

function formatMb(n: number): string {
  if (n <= 0) return "0";
  return (n / (1024 * 1024)).toFixed(1);
}

export function AdminImageUploadOverlay({ progress }: Props) {
  if (!progress) return null;

  const isUpload = progress.phase === "uploading";
  const title = isUpload ? "서버로 전송 중" : "압축·저장 중";
  const subtitle = isUpload
    ? "네트워크로 파일을 보내는 단계입니다."
    : "서버에서 이미지를 줄이고 스토리지(R2)에 저장하는 중입니다.";

  const pct =
    isUpload && progress.total > 0
      ? Math.min(100, Math.round((progress.loaded / progress.total) * 100))
      : null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="alertdialog"
      aria-busy="true"
      aria-labelledby="admin-upload-overlay-title"
      aria-describedby="admin-upload-overlay-desc"
    >
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white px-5 py-5 shadow-xl">
        <div className="flex gap-4">
          <div
            className="h-10 w-10 shrink-0 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p
              id="admin-upload-overlay-title"
              className="text-sm font-semibold text-neutral-900"
            >
              {title}
            </p>
            <p
              id="admin-upload-overlay-desc"
              className="mt-1 text-xs leading-relaxed text-neutral-500"
            >
              {subtitle}
            </p>
            {isUpload && progress.total > 0 ? (
              <p className="mt-2 text-xs tabular-nums text-neutral-600">
                {formatMb(progress.loaded)}MB / {formatMb(progress.total)}MB
                {pct !== null ? ` · ${pct}%` : null}
              </p>
            ) : null}
            {isUpload && pct !== null ? (
              <div
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200"
                aria-hidden
              >
                <div
                  className="h-full rounded-full bg-neutral-900 transition-[width] duration-150 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            ) : !isUpload ? (
              <p className="mt-2 text-xs text-neutral-400">잠시만 기다려 주세요…</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
