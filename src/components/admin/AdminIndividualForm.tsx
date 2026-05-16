"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateIndividualAction,
  type IndividualFormState,
} from "@/lib/actions/individual-actions";
import { ProjectHtmlEditor } from "@/components/admin/ProjectHtmlEditor";
import { AdminSeoFields } from "@/components/admin/AdminSeoFields";
import type { IgniteSeo } from "@/lib/ignite-data";

const initial: IndividualFormState = { error: null };

type Props = {
  id?: string;
  initialType?: string;
  initialTitle?: string;
  initialBody?: string;
  initialSeo?: IgniteSeo;
};

export function AdminIndividualForm({
  id,
  initialType = "",
  initialTitle = "",
  initialBody = "",
  initialSeo = { title: "", description: "", ogImage: "" },
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateIndividualAction,
    initial,
  );
  const getHtmlRef = useRef<() => string>(() => initialBody);
  const [type, setType] = useState(initialType);
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    if (state.saved) router.refresh();
  }, [state.saved, router]);

  return (
    <form
      action={formAction}
      className="space-y-6"
      onSubmit={(e) => {
        const form = e.currentTarget;
        const el = form.elements.namedItem("body");
        if (el && el instanceof HTMLInputElement) {
          el.value = getHtmlRef.current();
        }
      }}
    >
      {id && <input type="hidden" name="id" value={id} />}

      <div className="rounded-lg border border-neutral-200 p-5">
        <h2 className="mb-4 text-sm font-medium text-neutral-700">
          페이지 기본 정보
        </h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="ind-type"
              className="mb-1 block text-xs text-neutral-500"
            >
              URL slug
            </label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-neutral-400">/p/</span>
              <input
                id="ind-type"
                name={id ? undefined : "type"}
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="privacy"
                readOnly={!!id}
                className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none read-only:bg-neutral-100 read-only:text-neutral-500"
              />
              {id && <input type="hidden" name="type" value={type} />}
            </div>
            <p className="mt-1 text-[11px] text-neutral-400">
              영문 소문자, 숫자, 하이픈만 사용 가능. 생성 후 변경 불가.
            </p>
          </div>

          <div>
            <label
              htmlFor="ind-title"
              className="mb-1 block text-xs text-neutral-500"
            >
              페이지 제목 (좌측 라벨)
            </label>
            <input
              id="ind-title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="개인정보 처리방침"
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 p-5">
        <h2 className="mb-4 text-sm font-medium text-neutral-700">
          콘텐츠 (HTML)
        </h2>
        <ProjectHtmlEditor
          getHtmlRef={getHtmlRef}
          initialHtml={initialBody}
        />
        <input type="hidden" name="body" defaultValue={initialBody} />
      </div>

      <AdminSeoFields initial={initialSeo} pageName={title || "개별 페이지"} />

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
