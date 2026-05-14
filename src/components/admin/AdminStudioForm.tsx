"use client";

import { useActionState, useRef } from "react";
import { updateStudioAction, type StudioFormState } from "@/lib/actions/studio-actions";
import { ProjectHtmlEditor } from "@/components/admin/ProjectHtmlEditor";

const initial: StudioFormState = { error: null };

type Props = { initialBody: string };

export function AdminStudioForm({ initialBody }: Props) {
  const [state, formAction, pending] = useActionState(updateStudioAction, initial);
  const getHtmlRef = useRef<() => string>(() => initialBody);

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
      <div>
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
