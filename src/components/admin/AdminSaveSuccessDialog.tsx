"use client";

type Props = {
  open: boolean;
  /** 기본: 저장되었습니다. */
  message?: string;
  /** 새 창으로 열 공개 페이지 URL (절대·상대 모두 가능) */
  viewHref: string;
  /** 기본: 보기 */
  viewLabel?: string;
  onClose: () => void;
};

/**
 * 저장 성공 후 화면 중앙 알림. 닫기 / 보기(새 창).
 */
export function AdminSaveSuccessDialog({
  open,
  message = "저장되었습니다.",
  viewHref,
  viewLabel = "보기",
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-save-success-title"
    >
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-xl">
        <p
          id="admin-save-success-title"
          className="text-sm font-semibold text-neutral-900"
        >
          {message}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-neutral-500">
          「보기」는 공개 페이지를 새 창에서 엽니다.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-800 transition-colors hover:bg-neutral-50"
          >
            닫기
          </button>
          <a
            href={viewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
          >
            {viewLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
