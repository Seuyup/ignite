"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  updateContactAction,
  type ContactFormState,
} from "@/lib/actions/contact-actions";
import { AdminSaveSuccessDialog } from "@/components/admin/AdminSaveSuccessDialog";
import { AdminSavingOverlay } from "@/components/admin/AdminSavingOverlay";
import { ProjectHtmlEditor } from "@/components/admin/ProjectHtmlEditor";

const initial: ContactFormState = { error: null };

type Props = { initialBody: string };

export function ContactEditorForm({ initialBody }: Props) {
  const [state, formAction, pending] = useActionState(
    updateContactAction,
    initial,
  );
  const getHtmlRef = useRef<() => string>(() => "");
  const [savedUiDismissed, setSavedUiDismissed] = useState(false);

  useEffect(() => {
    if (pending) setSavedUiDismissed(false);
  }, [pending]);

  const showSaveSuccess = Boolean(state.saved && !savedUiDismissed);

  return (
    <div className="relative max-w-3xl space-y-6">
      <form
        action={formAction}
        className="space-y-4"
        onSubmit={(e) => {
          const form = e.currentTarget;
          const el = form.elements.namedItem("body");
          if (el && el instanceof HTMLInputElement) {
            el.value = getHtmlRef.current();
          }
        }}
      >
        <div>
          <span className="block text-xs uppercase tracking-[0.12em] text-neutral-500">
            연락처 본문
          </span>
          <p className="mt-1 text-xs text-neutral-400">
            프로젝트 본문과 동일한 리치 텍스트·HTML 편집기입니다. 공개{" "}
            <code className="text-neutral-600">/contact</code> 페이지에
            반영됩니다.
          </p>
          <div className="mt-2">
            <ProjectHtmlEditor
              key="contact-body"
              getHtmlRef={getHtmlRef}
              initialHtml={initialBody}
            />
          </div>
          <input type="hidden" name="body" defaultValue="" />
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
      </form>

      <AdminSavingOverlay
        open={pending}
        title="연락처 저장 중"
        subtitle="공개 연락처 페이지에 반영하는 중입니다."
      />

      <AdminSaveSuccessDialog
        open={showSaveSuccess}
        message="연락처가 저장되었습니다."
        viewHref="/contact"
        viewLabel="보기"
        onClose={() => setSavedUiDismissed(true)}
      />
    </div>
  );
}
