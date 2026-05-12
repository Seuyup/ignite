"use client";

import { AdminImageUploadOverlay } from "@/components/admin/AdminImageUploadOverlay";
import { R2Image } from "@/components/R2Image";
import {
  ADMIN_UPLOAD_MAX_BYTES,
  ADMIN_UPLOAD_MAX_LABEL,
} from "@/lib/admin-upload";
import { postAdminImageUpload, type AdminUploadProgress } from "@/lib/admin-upload-xhr";
import { useRef, useState } from "react";

type Props = {
  initialUrl?: string;
};

export function ProjectCoverUpload({ initialUrl = "" }: Props) {
  const [coverUrl, setCoverUrl] = useState(initialUrl);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<AdminUploadProgress | null>(
    null,
  );

  const busy = uploadProgress !== null;

  const uploadFile = async (file: File) => {
    if (file.size > ADMIN_UPLOAD_MAX_BYTES) {
      window.alert(
        `파일 크기는 ${ADMIN_UPLOAD_MAX_LABEL} 이하여야 합니다. (현재 ${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
      );
      return;
    }
    setUploadProgress({ phase: "uploading", loaded: 0, total: file.size });
    try {
      const result = await postAdminImageUpload(file, setUploadProgress);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      setCoverUrl(result.url);
    } catch (e) {
      const msg =
        e instanceof Error
          ? `업로드 중 오류: ${e.message}`
          : "업로드 중 알 수 없는 오류가 발생했습니다.";
      window.alert(msg);
    } finally {
      setUploadProgress(null);
    }
  };

  return (
    <div className="space-y-3">
      <AdminImageUploadOverlay progress={uploadProgress} />
      <input type="hidden" name="coverImageUrl" value={coverUrl} readOnly />
      <span className="block text-xs uppercase tracking-[0.12em] text-neutral-500">
        대표 이미지
      </span>
      <p className="text-xs text-neutral-400">
        프로젝트 목록에 크게 표시됩니다. R2에 업로드하거나 아래에 공개 URL을
        입력하세요. (이미지당 최대 {ADMIN_UPLOAD_MAX_LABEL})
      </p>

      {coverUrl ? (
        <div className="relative aspect-[21/10] max-h-[min(70vh,520px)] w-full overflow-hidden rounded-2xl bg-neutral-100 md:aspect-[2.5/1]">
          <R2Image
            src={coverUrl}
            alt=""
            mode="fill"
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1152px"
          />
        </div>
      ) : (
        <div className="relative flex aspect-[21/10] max-h-[min(70vh,520px)] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-neutral-300 bg-neutral-100 md:aspect-[2.5/1] text-xs text-neutral-400">
          등록된 이미지 없음
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-800 transition-colors hover:border-neutral-900 disabled:opacity-50"
        >
          {busy ? "처리 중…" : "파일 업로드"}
        </button>
        <button
          type="button"
          disabled={!coverUrl}
          onClick={() => setCoverUrl("")}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 transition-colors hover:border-red-300 hover:text-red-700 disabled:opacity-40"
        >
          제거
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void uploadFile(f);
          }}
        />
      </div>

      <div>
        <label
          htmlFor="cover-url-input"
          className="block text-xs uppercase tracking-[0.12em] text-neutral-500"
        >
          이미지 URL (선택)
        </label>
        <input
          id="cover-url-input"
          type="url"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
        />
      </div>
    </div>
  );
}
