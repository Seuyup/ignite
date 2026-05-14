"use client";

import { useActionState, useRef, useState } from "react";
import { updateHomeImagesAction, type HomeFormState } from "@/lib/actions/home-actions";
import { postAdminImageUpload } from "@/lib/admin-upload-xhr";
import type { HomeImage } from "@/lib/ignite-data";

const initial: HomeFormState = { error: null };

type Props = { initialImages: HomeImage[] };

export function AdminHomeForm({ initialImages }: Props) {
  const [images, setImages] = useState<HomeImage[]>(initialImages);
  const [newUrl, setNewUrl] = useState("");
  const [state, formAction, pending] = useActionState(updateHomeImagesAction, initial);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await postAdminImageUpload(file, () => {});
      if (result.ok) {
        setImages((prev) => [...prev, { url: result.url, link: "" }]);
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const addImage = () => {
    const url = newUrl.trim();
    if (url && !images.some((img) => img.url === url)) {
      setImages([...images, { url, link: "" }]);
      setNewUrl("");
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    const next = [...images];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
  };

  const updateLink = (index: number, link: string) => {
    setImages(images.map((img, i) => (i === index ? { ...img, link } : img)));
  };

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      <div className="space-y-3">
        {images.map((img, i) => (
          <div
            key={i}
            className="rounded-lg border border-neutral-200 bg-white p-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-20 flex-shrink-0 overflow-hidden rounded bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </div>
              <p className="min-w-0 flex-1 truncate text-xs text-neutral-600">{img.url}</p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moveImage(i, "up")}
                  disabled={i === 0}
                  className="rounded p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(i, "down")}
                  disabled={i === images.length - 1}
                  className="rounded p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="rounded p-1 text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex-shrink-0 text-xs text-neutral-400">/</span>
              <input
                type="text"
                value={img.link}
                onChange={(e) => updateLink(i, e.target.value)}
                placeholder="projects/my-project"
                className="flex-1 rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-700 outline-none placeholder:text-neutral-300 focus:border-neutral-900"
              />
              <span className="flex-shrink-0 text-[10px] text-neutral-400">
                경로만 입력
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-dashed border-neutral-300 px-3 py-2 text-sm text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-700 disabled:opacity-50"
        >
          {uploading ? "업로드 중…" : "파일 선택"}
        </button>
        <span className="text-xs text-neutral-400">또는</span>
        <input
          type="text"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="URL 직접 입력"
          className="min-w-[200px] flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addImage();
            }
          }}
        />
        <button
          type="button"
          onClick={addImage}
          className="rounded-lg bg-neutral-200 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-300"
        >
          추가
        </button>
      </div>

      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state.saved && (
        <p className="text-sm text-green-600">저장되었습니다.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "저장 중…" : "저장"}
      </button>
    </form>
  );
}
