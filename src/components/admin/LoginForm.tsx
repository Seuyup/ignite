"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/actions/login-actions";

const initial: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="mx-auto max-w-sm space-y-6">
      <div>
        <label
          htmlFor="password"
          className="block text-xs uppercase tracking-[0.12em] text-neutral-500"
        >
          관리자 비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-2 w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none ring-neutral-900 focus:border-neutral-900 focus:ring-1"
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
        className="w-full bg-neutral-900 px-4 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "확인 중…" : "로그인"}
      </button>
    </form>
  );
}
