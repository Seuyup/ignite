"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  updateContactAction,
  type ContactFormState,
} from "@/lib/actions/contact-actions";
import { ProjectHtmlEditor } from "@/components/admin/ProjectHtmlEditor";

const initial: ContactFormState = { error: null };

type Props = {
  initialBody: string;
};

export function AdminContactForm({ initialBody }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateContactAction,
    initial,
  );
  const getHtmlRef = useRef<() => string>(() => initialBody);

  useEffect(() => {
    if (state.saved) router.refresh();
  }, [state.saved, router]);

  return (
    <form
      action={formAction}
      className="space-y-8"
      onSubmit={(e) => {
        const form = e.currentTarget;
        const el = form.elements.namedItem("body");
        if (el && el instanceof HTMLInputElement) {
          el.value = getHtmlRef.current();
        }
      }}
    >
      <div className="rounded-lg border border-neutral-200 p-5">
        <h2 className="mb-4 text-sm font-medium text-neutral-700">
          하단 콘텐츠 (HTML)
        </h2>
        <p className="mb-4 text-xs text-neutral-500">
          Contact 페이지 문의 폼 아래에 표시될 HTML 콘텐츠를 편집합니다.
          비워두면 추가 영역이 표시되지 않습니다.
        </p>
        <ProjectHtmlEditor
          getHtmlRef={getHtmlRef}
          initialHtml={initialBody}
        />
        <input type="hidden" name="body" defaultValue={initialBody} />
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
