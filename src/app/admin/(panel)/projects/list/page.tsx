import Link from "next/link";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { listProjectsPaginated } from "@/lib/admin-project-queries";

export const metadata = {
  title: "프로젝트 목록",
};

const LIMITS = [10, 20, 50] as const;

function parseIntSafe(v: string | undefined, fallback: number): number {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}

function buildQuery(page: number, limit: number, q: string): string {
  const p = new URLSearchParams();
  p.set("page", String(page));
  p.set("limit", String(limit));
  if (q.trim()) p.set("q", q.trim());
  const s = p.toString();
  return s ? `?${s}` : "";
}

type Props = {
  searchParams: Promise<{ page?: string; limit?: string; q?: string }>;
};

export default async function AdminProjectListPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  let limit = parseIntSafe(sp.limit, 10);
  if (!LIMITS.includes(limit as (typeof LIMITS)[number])) limit = 10;
  const page = Math.max(1, parseIntSafe(sp.page, 1));

  const result = await listProjectsPaginated({
    page,
    limit,
    search: q,
  });

  const base = "/admin/projects/list";
  const buildHref = (p: number) => `${base}${buildQuery(p, limit, q)}`;

  if (!result.ok) {
    return (
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-neutral-900 md:text-3xl">
          프로젝트
        </h1>
        <div
          className="mt-8 rounded border border-red-200 bg-red-50 px-6 py-6"
          role="alert"
        >
          <pre className="max-h-[min(70vh,32rem)] overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-red-900 md:text-sm">
            {result.detail}
          </pre>
        </div>
      </div>
    );
  }

  const { items, total, page: safePage, totalPages } = result;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900 md:text-3xl">
            프로젝트
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            등록된 프로젝트를 검색·페이지 단위로 확인합니다.
          </p>
        </div>
        <Link
          href="/admin/projects/add"
          className="inline-flex shrink-0 items-center justify-center bg-neutral-900 px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
        >
          프로젝트 추가
        </Link>
      </div>

      <form
        method="get"
        action={base}
        className="mt-8 flex flex-col gap-3 border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <input type="hidden" name="page" value="1" />
        <div className="min-w-[200px] flex-1">
          <label
            htmlFor="q"
            className="block text-xs uppercase tracking-[0.12em] text-neutral-500"
          >
            검색 (제목)
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="제목으로 필터…"
            className="mt-1 w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
          />
        </div>
        <div>
          <label
            htmlFor="limit"
            className="block text-xs uppercase tracking-[0.12em] text-neutral-500"
          >
            페이지당 개수
          </label>
          <select
            id="limit"
            name="limit"
            defaultValue={String(limit)}
            className="mt-1 w-full min-w-[120px] border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 sm:w-auto"
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
          className="border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
        >
          적용
        </button>
      </form>

      {total === 0 ? (
        <div className="mt-12 rounded border border-dashed border-neutral-300 bg-neutral-50 px-8 py-16 text-center">
          <p className="text-sm font-medium text-neutral-800">
            등록된 프로젝트가 없습니다.
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            새 프로젝트를 추가하면 목록에 표시됩니다.
          </p>
          <Link
            href="/admin/projects/add"
            className="mt-6 inline-block bg-neutral-900 px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
          >
            프로젝트 추가
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded border border-neutral-200">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-100 text-xs uppercase tracking-[0.1em] text-neutral-500">
                  <th className="w-20 px-2 py-3 font-medium whitespace-nowrap">
                    이미지
                  </th>
                  <th className="px-4 py-3 font-medium">제목</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    작성일
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    작업
                  </th>
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
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.coverImageUrl}
                          alt=""
                          className="h-14 w-14 rounded-md border border-neutral-200 object-cover"
                        />
                      ) : (
                        <span
                          className="inline-flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-neutral-200 bg-neutral-50 text-[10px] text-neutral-400"
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
                      {row.createdAt.toLocaleString("ko-KR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Link
                          href={`/admin/projects/modify?slug=${encodeURIComponent(row.slug)}`}
                          className="text-xs font-medium text-neutral-900 underline underline-offset-2 hover:opacity-70"
                        >
                          수정
                        </Link>
                        <Link
                          href={`/projects/${row.slug}`}
                          className="text-xs text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          열기
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-neutral-500">
            총 {total}건 · {safePage} / {totalPages} 페이지
          </p>
          <AdminPagination
            page={safePage}
            totalPages={totalPages}
            buildHref={buildHref}
          />
        </>
      )}
    </div>
  );
}
