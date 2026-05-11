"use client";

import { useActionState, useRef } from "react";
import {
  createProjectAction,
  updateProjectAction,
  type ProjectFormState,
} from "@/lib/actions/project-actions";
import type { AdminProjectEditPayload } from "@/lib/admin-project-queries";
import { ProjectCoverUpload } from "@/components/admin/ProjectCoverUpload";
import { ProjectHtmlEditor } from "@/components/admin/ProjectHtmlEditor";

const initial: ProjectFormState = { error: null };

type Props =
  | { mode: "create" }
  | { mode: "edit"; initial: AdminProjectEditPayload };

export function ProjectForm(props: Props) {
  const isEdit = props.mode === "edit";
  const initialData = isEdit ? props.initial : null;

  const [state, formAction, pending] = useActionState(
    isEdit ? updateProjectAction : createProjectAction,
    initial,
  );
  const getHtmlRef = useRef<() => string>(() => "");

  const editorKey =
    isEdit && initialData ? `edit-${initialData.slug}` : "create";

  return (
    <form
      action={formAction}
      className="max-w-3xl space-y-6"
      onSubmit={(e) => {
        const form = e.currentTarget;
        const el = form.elements.namedItem("contentHtml");
        if (el && el instanceof HTMLInputElement) {
          el.value = getHtmlRef.current();
        }
      }}
    >
      {isEdit && props.mode === "edit" ? (
        <input type="hidden" name="originalSlug" value={props.initial.slug} />
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
          className="mt-2 w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
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
          className="mt-2 w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
        />
      </div>
      <div>
        <label
          htmlFor="slug"
          className="block text-xs uppercase tracking-[0.12em] text-neutral-500"
        >
          Slug (URL)
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          readOnly={isEdit}
          defaultValue={initialData?.slug}
          placeholder="예: mega-phactory"
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          className="mt-2 w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none read-only:bg-neutral-100 read-only:text-neutral-600 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
        />
        <p className="mt-1 text-xs text-neutral-400">
          {isEdit
            ? "등록된 주소(slug)는 변경할 수 없습니다."
            : "영문 소문자, 숫자, 하이픈만 사용합니다. 상세 페이지 주소는 "}
          {!isEdit ? (
            <>
              <code className="text-neutral-600">/projects/&#123;slug&#125;</code>
              입니다.
            </>
          ) : null}
        </p>
      </div>

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
        className="bg-neutral-900 px-4 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "저장 중…" : "저장"}
      </button>
    </form>
  );
}
