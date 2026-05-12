"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  permanentDeleteProjectAction,
  restoreProjectAction,
  type IdActionState,
} from "@/lib/actions/admin-project-list-actions";

const initial: IdActionState = { error: null };

export function RestoreProjectButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-900 transition-colors hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
      onClick={() => {
        start(async () => {
          const fd = new FormData();
          fd.append("id", id);
          const r = await restoreProjectAction(initial, fd);
          if (r.error) window.alert(r.error);
          else router.refresh();
        });
      }}
    >
      {pending ? "복원 중…" : "복원"}
    </button>
  );
}

export function PermanentDeleteProjectButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-800 transition-colors hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
      onClick={() => {
        if (
          !window.confirm(
            "영구 삭제하면 복구할 수 없습니다. 정말 삭제할까요?",
          )
        ) {
          return;
        }
        start(async () => {
          const fd = new FormData();
          fd.append("id", id);
          const r = await permanentDeleteProjectAction(initial, fd);
          if (r.error) window.alert(r.error);
          else router.refresh();
        });
      }}
    >
      {pending ? "삭제 중…" : "영구 삭제"}
    </button>
  );
}
