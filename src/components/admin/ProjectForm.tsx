"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { postAdminImageUpload } from "@/lib/admin-upload-xhr";
import {
  createProjectAction,
  updateProjectAction,
  type ProjectFormState,
} from "@/lib/actions/project-actions";
import type { AdminProjectEditPayload } from "@/lib/admin-project-shared";
import type { ProjectMeta } from "@/lib/project-types";
import { DEFAULT_META_LABELS } from "@/lib/project-types";
import { AdminSlugField } from "@/components/admin/AdminSlugField";
import { AdminSaveSuccessDialog } from "@/components/admin/AdminSaveSuccessDialog";
import { AdminSavingOverlay } from "@/components/admin/AdminSavingOverlay";

const initial: ProjectFormState = { error: null };

type Props =
  | { mode: "create"; menuId: string }
  | { mode: "edit"; initial: AdminProjectEditPayload };

export function ProjectForm(props: Props) {
  const isEdit = props.mode === "edit";
  const initialData = isEdit ? props.initial : null;
  const router = useRouter();

  const [state, formAction, pending] = useActionState(
    isEdit ? updateProjectAction : createProjectAction,
    initial,
  );

  const menuId = isEdit ? (initialData?.menu_id ?? "") : (props as { menuId: string }).menuId;
  const [images, setImages] = useState<string[]>(initialData?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [meta, setMeta] = useState<ProjectMeta[]>(
    initialData?.meta ??
      DEFAULT_META_LABELS.map((label) => ({ label, value: "" })),
  );
  const [savedUiDismissed, setSavedUiDismissed] = useState(false);

  useEffect(() => {
    if (pending) setSavedUiDismissed(false);
  }, [pending]);

  const savedSlug = state.savedSlug;
  const showSaveSuccess = Boolean(state.saved && savedSlug && !savedUiDismissed);

  const handleCloseSaveSuccess = () => {
    setSavedUiDismissed(true);
    if (savedSlug) {
      router.replace(`/admin/projects/modify?slug=${encodeURIComponent(savedSlug)}&category=${encodeURIComponent(menuId)}`);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await postAdminImageUpload(file, () => {});
      if (result.ok) {
        setImages((prev) => [...prev, result.url]);
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    const arr = [...images];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    setImages(arr);
  };

  const addMeta = () => {
    setMeta([...meta, { label: "", value: "" }]);
  };

  const removeMeta = (index: number) => {
    setMeta(meta.filter((_, i) => i !== index));
  };

  const updateMeta = (index: number, field: "label" | "value", val: string) => {
    const arr = [...meta];
    arr[index] = { ...arr[index], [field]: val };
    setMeta(arr);
  };

  return (
    <form
      action={formAction}
      className="relative w-full max-w-none space-y-8"
    >
      {isEdit && initialData && (
        <input type="hidden" name="originalSlug" defaultValue={initialData.slug} />
      )}
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input
        type="hidden"
        name="meta"
        value={JSON.stringify(meta.filter((m) => m.label.trim()))}
      />
      <input type="hidden" name="coverImageUrl" value={images[0] ?? ""} />
      <input type="hidden" name="menu_id" value={menuId} />

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-xs uppercase tracking-[0.12em] text-neutral-500">
          프로젝트 제목
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={initialData?.title}
          className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
        />
      </div>

      {/* Sub Title 1 */}
      <div>
        <label htmlFor="sub_title_1" className="block text-xs uppercase tracking-[0.12em] text-neutral-500">
          서브 타이틀 1
        </label>
        <input
          id="sub_title_1"
          name="sub_title_1"
          type="text"
          defaultValue={initialData?.sub_title_1}
          className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
        />
      </div>

      {/* Sub Title 2 */}
      <div>
        <label htmlFor="sub_title_2" className="block text-xs uppercase tracking-[0.12em] text-neutral-500">
          서브 타이틀 2
        </label>
        <input
          id="sub_title_2"
          name="sub_title_2"
          type="text"
          defaultValue={initialData?.sub_title_2}
          className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
        />
      </div>

      {/* Slug */}
      <AdminSlugField
        mode={isEdit ? "edit" : "create"}
        defaultSlug={initialData?.slug ?? ""}
        excludeId={isEdit && initialData ? initialData.id : undefined}
      />


      {/* Images */}
      <div>
        <label className="block text-xs uppercase tracking-[0.12em] text-neutral-500">
          이미지 (첫 번째가 대표 이미지)
        </label>
        <div className="mt-3 space-y-2">
          {images.map((url, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-2"
            >
              <div className="h-10 w-16 flex-shrink-0 overflow-hidden rounded bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </div>
              <span className="min-w-0 flex-1 truncate text-xs text-neutral-600">
                {i === 0 && <span className="mr-2 rounded bg-neutral-900 px-1.5 py-0.5 text-[10px] text-white">대표</span>}
                {url}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moveImage(i, "up")}
                  disabled={i === 0}
                  className="rounded p-1 text-xs text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(i, "down")}
                  disabled={i === images.length - 1}
                  className="rounded p-1 text-xs text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="rounded p-1 text-xs text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
            id="image-upload"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-dashed border-neutral-300 px-3 py-2 text-sm text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-700 disabled:opacity-50"
          >
            {uploading ? "업로드 중…" : "파일 선택"}
          </button>
          <span className="text-xs text-neutral-400">또는</span>
          <input
            type="text"
            placeholder="URL 직접 입력"
            id="image-url-input"
            className="min-w-[200px] flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const val = (e.target as HTMLInputElement).value.trim();
                if (val && !images.includes(val)) {
                  setImages([...images, val]);
                  (e.target as HTMLInputElement).value = "";
                }
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("image-url-input") as HTMLInputElement | null;
              if (!el) return;
              const val = el.value.trim();
              if (val && !images.includes(val)) {
                setImages([...images, val]);
                el.value = "";
              }
            }}
            className="rounded-lg bg-neutral-200 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-300"
          >
            추가
          </button>
        </div>
      </div>

      {/* Meta (title-value pairs) */}
      <div>
        <label className="block text-xs uppercase tracking-[0.12em] text-neutral-500">
          프로젝트 정보 (타이틀 — 값)
        </label>
        <div className="mt-3 space-y-2">
          {meta.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={m.label}
                onChange={(e) => updateMeta(i, "label", e.target.value)}
                placeholder="항목명"
                className="w-32 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
              />
              <input
                type="text"
                value={m.value}
                onChange={(e) => updateMeta(i, "value", e.target.value)}
                placeholder="값"
                className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
              />
              <button
                type="button"
                onClick={() => removeMeta(i)}
                className="rounded p-1 text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addMeta}
          className="mt-3 rounded-lg border border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-500 hover:border-neutral-400 hover:text-neutral-700"
        >
          + 항목 추가
        </button>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "저장 중…" : "저장"}
      </button>

      <AdminSavingOverlay
        open={pending}
        title="프로젝트 저장 중"
        subtitle="프로젝트 데이터를 서버에 저장하는 중입니다."
      />

      <AdminSaveSuccessDialog
        open={showSaveSuccess}
        message="프로젝트가 저장되었습니다."
        viewHref={`/projects/${savedSlug}`}
        viewLabel="보기"
        onClose={handleCloseSaveSuccess}
      />
    </form>
  );
}
