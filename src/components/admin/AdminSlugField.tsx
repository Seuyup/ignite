"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  defaultSlug: string;
  /** 수정 시 Mongo _id — slug 중복 검사에서 본인 제외 */
  excludeId?: string;
};

export function AdminSlugField({ mode, defaultSlug, excludeId }: Props) {
  const [slug, setSlug] = useState(defaultSlug);
  const [hint, setHint] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "taken">(
    "idle",
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runCheck = useCallback(
    async (value: string) => {
      const v = value.trim().toLowerCase();
      if (!v) {
        setHint(null);
        setStatus("idle");
        return;
      }
      setStatus("checking");
      try {
        const p = new URLSearchParams({ slug: v });
        if (mode === "edit" && excludeId) p.set("excludeId", excludeId);
        const res = await fetch(`/api/admin/projects/slug-check?${p}`, {
          credentials: "include",
        });
        if (!res.ok) {
          setHint("확인 요청에 실패했습니다.");
          setStatus("idle");
          return;
        }
        const data = (await res.json()) as { available?: boolean };
        if (data.available) {
          setHint("사용 가능한 slug입니다.");
          setStatus("ok");
        } else {
          setHint("이미 사용 중인 slug입니다.");
          setStatus("taken");
        }
      } catch {
        setHint("네트워크 오류로 확인하지 못했습니다.");
        setStatus("idle");
      }
    },
    [excludeId, mode],
  );

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (slug.trim() === "") {
      setHint(null);
      setStatus("idle");
      return;
    }
    timer.current = setTimeout(() => {
      void runCheck(slug);
    }, 450);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [slug, runCheck]);

  return (
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
        value={slug}
        onChange={(e) =>
          setSlug(e.target.value.trim().toLowerCase().replace(/\s+/g, ""))
        }
        placeholder="예: mega-phactory"
        pattern="[a-z0-9]+(-[a-z0-9]+)*"
        autoComplete="off"
        className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
      />
      <p
        className={`mt-1 text-xs ${
          status === "taken"
            ? "text-red-600"
            : status === "ok"
              ? "text-emerald-700"
              : status === "checking"
                ? "text-neutral-500"
                : "text-neutral-400"
        }`}
      >
        {status === "checking" ? "중복 확인 중…" : null}
        {status !== "checking" && hint ? hint : null}
        {status === "idle" && !hint ? (
          <>
            영문 소문자·숫자·하이픈. 주소는{" "}
            <code className="text-neutral-600">/projects/&#123;slug&#125;</code>
            {mode === "edit"
              ? " — 변경 시 기존 URL은 더 이상 열리지 않으니 외부 링크를 갱신하세요."
              : " 형식입니다."}
          </>
        ) : null}
      </p>
    </div>
  );
}
