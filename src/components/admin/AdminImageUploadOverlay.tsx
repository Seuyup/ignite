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

/** 현재 파일 기준 전송 % */
function filePercent(progress: AdminUploadProgress): number | null {
  const isUpload = progress.phase === "uploading";
  if (!isUpload || progress.total <= 0) return null;
  return Math.min(100, Math.round((progress.loaded / progress.total) * 100));
}

/** 여러 장일 때 전체 작업 대비 대략적인 % (완료된 파일 + 현재 파일 진행) */
function overallPercent(progress: AdminUploadProgress): number | null {
  const bt = progress.batchTotal;
  if (!bt || bt < 2) return null;
  const bi = progress.batchIndex ?? 1;
  const filePart =
    progress.phase === "uploading" && progress.total > 0
      ? progress.loaded / progress.total
      : 1;
  return Math.min(100, Math.round(((bi - 1 + filePart) / bt) * 100));
}

export function AdminImageUploadOverlay({ progress }: Props) {
  if (!progress) return null;

  const isUpload = progress.phase === "uploading";
  const title = isUpload ? "서버로 전송 중" : "압축·저장 중";
  const subtitle = isUpload
    ? "네트워크로 파일을 보내는 단계입니다."
    : "서버에서 이미지를 줄이고 스토리지(R2)에 저장하는 중입니다.";

  const pct = filePercent(progress);
  const overall = overallPercent(progress);
  const batchLine =
    progress.batchTotal && progress.batchTotal >= 2 && progress.batchIndex
      ? `${progress.batchIndex} / ${progress.batchTotal}번째 이미지`
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
            {batchLine ? (
              <p className="mt-1 text-xs font-medium tabular-nums text-neutral-800">
                {batchLine}
              </p>
            ) : null}
            <p
              id="admin-upload-overlay-desc"
              className="mt-1 text-xs leading-relaxed text-neutral-500"
            >
              {subtitle}
            </p>
            {overall !== null ? (
              <>
                <p className="mt-3 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                  전체 진행
                </p>
                <div
                  className="mt-1 h-2 w-full overflow-hidden rounded-full bg-neutral-200"
                  aria-hidden
                >
                  <div
                    className="h-full rounded-full bg-neutral-400 transition-[width] duration-150 ease-out"
                    style={{ width: `${overall}%` }}
                  />
                </div>
                <p className="mt-0.5 text-[10px] tabular-nums text-neutral-500">
                  {overall}%
                </p>
              </>
            ) : null}
            {isUpload && progress.total > 0 ? (
              <p className="mt-2 text-xs tabular-nums text-neutral-600">
                {formatMb(progress.loaded)}MB / {formatMb(progress.total)}MB
                {pct !== null ? ` · ${pct}%` : null}
              </p>
            ) : null}
            {isUpload && pct !== null ? (
              <>
                {overall !== null ? (
                  <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                    현재 파일
                  </p>
                ) : null}
                <div
                  className={`h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 ${overall !== null ? "mt-1" : "mt-2"}`}
                  aria-hidden
                >
                  <div
                    className="h-full rounded-full bg-neutral-900 transition-[width] duration-150 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </>
            ) : !isUpload ? (
              <p className="mt-2 text-xs text-neutral-400">잠시만 기다려 주세요…</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
