"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createProjectAction,
  updateProjectAction,
  type ProjectFormState,
} from "@/lib/actions/project-actions";
import type { AdminProjectEditPayload } from "@/lib/admin-project-queries";
import { AdminSaveSuccessDialog } from "@/components/admin/AdminSaveSuccessDialog";
import { AdminSavingOverlay } from "@/components/admin/AdminSavingOverlay";
import { AdminSlugField } from "@/components/admin/AdminSlugField";
import { ProjectCoverUpload } from "@/components/admin/ProjectCoverUpload";
import { ProjectHtmlEditor } from "@/components/admin/ProjectHtmlEditor";

const initial: ProjectFormState = { error: null };

type Props =
  | { mode: "create" }
  | { mode: "edit"; initial: AdminProjectEditPayload };

export function ProjectForm(props: Props) {
  const isEdit = props.mode === "edit";
  const initialData = isEdit ? props.initial : null;
  const router = useRouter();

  const [state, formAction, pending] = useActionState(
    isEdit ? updateProjectAction : createProjectAction,
    initial,
  );
  const getHtmlRef = useRef<() => string>(() => "");
  const [savedUiDismissed, setSavedUiDismissed] = useState(false);

  useEffect(() => {
    if (pending) setSavedUiDismissed(false);
  }, [pending]);

  const editorKey =
    isEdit && initialData ? `edit-${initialData.id}` : "create";

  const savedSlug = state.savedSlug;
  const showSaveSuccess = Boolean(
    state.saved && savedSlug && !savedUiDismissed,
  );

  const handleCloseSaveSuccess = () => {
    setSavedUiDismissed(true);
    if (isEdit && savedSlug) {
      router.replace(
        `/admin/projects/modify?slug=${encodeURIComponent(savedSlug)}`,
      );
    }
  };

  return (
    <form
      action={formAction}
      className="relative max-w-3xl space-y-6"
      onSubmit={(e) => {
        const form = e.currentTarget;
        const el = form.elements.namedItem("contentHtml");
        if (el && el instanceof HTMLInputElement) {
          el.value = getHtmlRef.current();
        }
      }}
    >
      {isEdit && props.mode === "edit" ? (
        <input type="hidden" name="originalSlug" defaultValue={props.initial.slug} />
      ) : null}

      <div>
        <label
          htmlFor="title"
          className="block text-xs uppercase tracking-[0.12em] text-neutral-500"
        >
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
      <div>
        <label
          htmlFor="subtitle"
          className="block text-xs uppercase tracking-[0.12em] text-neutral-500"
        >
          부제 (선택)
        </label>
        <input
          id="subtitle"
          name="subtitle"
          type="text"
          defaultValue={initialData?.subtitle}
          className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
        />
      </div>

      <AdminSlugField
        mode={isEdit ? "edit" : "create"}
        defaultSlug={initialData?.slug ?? ""}
        excludeId={isEdit && initialData ? initialData.id : undefined}
      />

      <ProjectCoverUpload
        key={editorKey}
        initialUrl={initialData?.coverImageUrl}
      />

      <div>
        <span className="block text-xs uppercase tracking-[0.12em] text-neutral-500">
          본문
        </span>
        <p className="mt-1 text-xs text-neutral-400">
          <a
            href="https://tiptap.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-600 underline"
          >
            Tiptap
          </a>{" "}
          기반 심플 에디터입니다. 「HTML」로 소스를 직접 편집하거나 「시각
          편집」으로 되돌릴 수 있습니다. 이미지는 R2 업로드 후 삽입됩니다.
        </p>
        <div className="mt-2">
          <ProjectHtmlEditor
            key={editorKey}
            getHtmlRef={getHtmlRef}
            initialHtml={initialData?.contentHtml ?? ""}
          />
        </div>
        <input
          type="hidden"
          name="contentHtml"
          defaultValue={initialData?.contentHtml ?? ""}
        />
      </div>
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
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
        subtitle="본문·표지·제목 등 프로젝트 데이터를 서버에 저장하는 중입니다."
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
