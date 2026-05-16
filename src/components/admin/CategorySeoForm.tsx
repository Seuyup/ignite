"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  updateCategorySeoAction,
  type CategorySeoFormState,
} from "@/lib/actions/project-actions";
import { AdminSeoFields } from "@/components/admin/AdminSeoFields";
import type { IgniteSeo } from "@/lib/ignite-data";

const initial: CategorySeoFormState = { error: null };

type Props = {
  categoryId: string;
  categoryLabel: string;
  initialSeo: IgniteSeo;
};

export function CategorySeoForm({
  categoryId,
  categoryLabel,
  initialSeo,
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateCategorySeoAction,
    initial,
  );

  useEffect(() => {
    if (state.saved) router.refresh();
  }, [state.saved, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="categoryId" value={categoryId} />
      <AdminSeoFields key={categoryId} initial={initialSeo} pageName={categoryLabel} />

      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state.saved && (
        <p className="text-sm text-green-600">SEO 설정이 저장되었습니다.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "저장 중…" : "SEO 저장"}
      </button>
    </form>
  );
}
