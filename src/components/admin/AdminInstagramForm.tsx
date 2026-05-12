"use client";

import { useActionState, useEffect, useState } from "react";
import {
  updateInstagramAction,
  type InstagramFormState,
} from "@/lib/actions/instagram-actions";

const initial: InstagramFormState = { error: null };

type Props = {
  initialInstagramId: string;
};

export function AdminInstagramForm({ initialInstagramId }: Props) {
  const [state, formAction, pending] = useActionState(
    updateInstagramAction,
    initial,
  );
  const [dismissSaved, setDismissSaved] = useState(false);

  useEffect(() => {
    if (pending) setDismissSaved(false);
  }, [pending]);

  const showSaved = Boolean(state.saved && !dismissSaved);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <div>
        <label
          htmlFor="instagramId"
          className="block text-xs uppercase tracking-[0.12em] text-neutral-500"
        >
          Instagram 사용자명
        </label>
        <p className="mt-1 text-xs text-neutral-500">
          프로필 URL의 <code className="text-neutral-700">instagram.com/</code>{" "}
          뒤에 오는 이름만 입력합니다. (@ 없이, 예:{" "}
          <code className="text-neutral-700">wgnb.kr</code>)
        </p>
        <input
          id="instagramId"
          name="instagramId"
          type="text"
          defaultValue={initialInstagramId}
          placeholder="wgnb.kr"
          autoComplete="off"
          className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
        />
      </div>

      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}

      {showSaved ? (
        <p className="text-sm text-emerald-700">
          저장되었습니다. 헤더 링크는 새로고침 후 반영됩니다.
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => setDismissSaved(true)}
          >
            닫기
          </button>
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
  );
}
