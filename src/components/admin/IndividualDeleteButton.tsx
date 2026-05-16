"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  deleteIndividualAction,
  type IndividualFormState,
} from "@/lib/actions/individual-actions";

const initial: IndividualFormState = { error: null };

type Props = { id: string; title: string };

export function IndividualDeleteButton({ id, title }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    deleteIndividualAction,
    initial,
  );

  useEffect(() => {
    if (state.deleted) router.refresh();
  }, [state.deleted, router]);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`"${title}" 페이지를 삭제하시겠습니까?`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-red-200 px-3 py-1.5 text-xs text-red-500 transition-colors hover:border-red-400 hover:text-red-700 disabled:opacity-50"
      >
        삭제
      </button>
    </form>
  );
}
