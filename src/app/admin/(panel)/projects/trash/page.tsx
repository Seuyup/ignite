import Link from "next/link";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { R2Image } from "@/components/R2Image";
import {
  PermanentDeleteProjectButton,
  RestoreProjectButton,
} from "@/components/admin/TrashProjectRowActions";
import { listTrashedProjectsPaginated } from "@/lib/admin-project-queries";
import { projectListDisplayDate } from "@/lib/admin-project-shared";

export const metadata = {
  title: "프로젝트 휴지통",
};

const LIMITS = [10, 20, 50, 100] as const;

function parseIntSafe(v: string | undefined, fallback: number): number {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}

function buildQuery(page: number, limit: number): string {
  const p = new URLSearchParams();
  p.set("page", String(page));
  p.set("limit", String(limit));
  const s = p.toString();
  return s ? `?${s}` : "";
}

type Props = {
  searchParams: Promise<{ page?: string; limit?: string }>;
};

export default async function AdminTrashProjectsPage({ searchParams }: Props) {
  const sp = await searchParams;
  let limit = parseIntSafe(sp.limit, 10);
  if (!LIMITS.includes(limit as (typeof LIMITS)[number])) limit = 10;
  const page = Math.max(1, parseIntSafe(sp.page, 1));

  const result = await listTrashedProjectsPaginated({ page, limit });
  const base = "/admin/projects/trash";
  const buildHref = (p: number) => `${base}${buildQuery(p, limit)}`;

  if (!result.ok) {
    return (
      <div>
        <h1 className="text-2xl font-medium text-neutral-900">휴지통</h1>
        <pre className="mt-6 max-h-[min(70vh,32rem)] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-red-200 bg-red-50 p-4 font-mono text-xs text-red-900">
          {result.detail}
        </pre>
      </div>
    );
  }

  const { items, total, page: safePage, totalPages } = result;

  return (
    <div>
      <p>
        <Link
          href="/admin/projects/list"
          className="inline-block rounded-md px-2 py-1 text-xs uppercase tracking-[0.12em] text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          ← 프로젝트 목록
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-medium tracking-tight text-neutral-900 md:text-3xl">
        휴지통
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        삭제한 프로젝트를 복원하거나 영구 삭제할 수 있습니다.
      </p>

      {total === 0 ? (
        <p className="mt-12 text-sm text-neutral-500">휴지통이 비어 있습니다.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-100 text-xs uppercase tracking-[0.1em] text-neutral-500">
                <th className="w-20 px-2 py-3 font-medium whitespace-nowrap">
                  이미지
                </th>
                <th className="px-4 py-3 font-medium">제목</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  수정일
                </th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">작업</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/80"
                >
                  <td className="px-2 py-2 align-middle">
                    {row.coverImageUrl ? (
                      <R2Image
                        src={row.coverImageUrl}
                        alt=""
                        mode="fixed"
                        width={56}
                        height={56}
                        className="rounded-lg border border-neutral-200 object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <span
                        className="inline-flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-[10px] text-neutral-400"
                        aria-label="이미지 없음"
                      >
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {row.title}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    <code className="text-xs">{row.slug}</code>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-600">
                    {projectListDisplayDate(row).toLocaleString("ko-KR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <RestoreProjectButton id={row.id} />
                      <PermanentDeleteProjectButton id={row.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form
        method="get"
        action={base}
        className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4"
      >
        <input type="hidden" name="page" value="1" />
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label
                htmlFor="trash-page-limit"
                className="block text-xs uppercase tracking-[0.12em] text-neutral-500"
              >
                페이지당 개수
              </label>
              <select
                id="trash-page-limit"
                name="limit"
                defaultValue={String(limit)}
                className="mt-1 w-full min-w-[120px] rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 sm:w-auto"
              >
                {LIMITS.map((n) => (
                  <option key={n} value={n}>
                    {n}개
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-lg border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
            >
              적용
            </button>
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-stretch gap-2 sm:items-end">
            <p className="text-right text-xs whitespace-nowrap text-neutral-500 tabular-nums sm:max-w-full">
              총 {total}건 · {safePage} / {Math.max(1, totalPages)} 페이지
            </p>
            <AdminPagination
              page={safePage}
              totalPages={totalPages}
              buildHref={buildHref}
              alwaysShow
              className="mt-0 flex flex-wrap items-center justify-end gap-1.5 text-sm"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
