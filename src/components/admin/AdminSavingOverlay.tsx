"use client";

type Props = {
  open: boolean;
  title: string;
  subtitle: string;
};

/**
 * {@link AdminImageUploadOverlay}와 동일한 톤의 전역 저장 중 UI (진행률 없음).
 */
export function AdminSavingOverlay({ open, title, subtitle }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="alertdialog"
      aria-busy="true"
      aria-labelledby="admin-saving-overlay-title"
      aria-describedby="admin-saving-overlay-desc"
    >
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white px-5 py-5 shadow-xl">
        <div className="flex gap-4">
          <div
            className="h-10 w-10 shrink-0 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p
              id="admin-saving-overlay-title"
              className="text-sm font-semibold text-neutral-900"
            >
              {title}
            </p>
            <p
              id="admin-saving-overlay-desc"
              className="mt-1 text-xs leading-relaxed text-neutral-500"
            >
              {subtitle}
            </p>
            <p className="mt-2 text-xs text-neutral-400">잠시만 기다려 주세요…</p>
          </div>
        </div>
      </div>
    </div>
  );
}
