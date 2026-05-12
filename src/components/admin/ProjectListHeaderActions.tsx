"use client";

import Link from "next/link";

export function ProjectListHeaderActions({ trashCount }: { trashCount: number }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link
        href="/admin/projects/trash"
        aria-label="휴지통"
        title="휴지통"
        className="relative inline-flex h-[38px] min-w-[38px] items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 text-neutral-900 transition-colors hover:border-neutral-900"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
          />
        </svg>
        {trashCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-medium leading-none text-white tabular-nums">
            {trashCount > 99 ? "99+" : trashCount}
          </span>
        ) : null}
      </Link>
      <Link
        href="/admin/projects/add"
        className="inline-flex h-[38px] items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm text-white transition-opacity hover:opacity-90"
      >
        프로젝트 추가
      </Link>
    </div>
  );
}
