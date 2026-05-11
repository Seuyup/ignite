"use client";

import { useRef, useState } from "react";

type Props = {
  initialUrl?: string;
};

export function ProjectCoverUpload({ initialUrl = "" }: Props) {
  const [coverUrl, setCoverUrl] = useState(initialUrl);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        window.alert(data.error ?? "업로드에 실패했습니다.");
        return;
      }
      if (data.url) setCoverUrl(data.url);
    } catch {
      window.alert("업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <input type="hidden" name="coverImageUrl" value={coverUrl} readOnly />
      <span className="block text-xs uppercase tracking-[0.12em] text-neutral-500">
        대표 이미지
      </span>
      <p className="text-xs text-neutral-400">
        프로젝트 목록에 크게 표시됩니다. R2에 업로드하거나 아래에 공개 URL을
        입력하세요.
      </p>

      {coverUrl ? (
        <div className="relative overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
          {/* eslint-disable-next-line @next/next/no-img-element -- 외부 R2 URL */}
          <img
            src={coverUrl}
            alt=""
            className="mx-auto max-h-52 w-full object-contain"
          />
        </div>
      ) : (
        <div className="flex min-h-[140px] items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-400">
          등록된 이미지 없음
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-800 transition-colors hover:border-neutral-900 disabled:opacity-50"
        >
          {uploading ? "업로드 중…" : "파일 업로드"}
        </button>
        <button
          type="button"
          disabled={!coverUrl}
          onClick={() => setCoverUrl("")}
          className="border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 transition-colors hover:border-red-300 hover:text-red-700 disabled:opacity-40"
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
          className="mt-1 w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
        />
      </div>
    </div>
  );
}
