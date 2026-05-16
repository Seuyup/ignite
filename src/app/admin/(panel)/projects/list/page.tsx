import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ProjectListHeaderActions } from "@/components/admin/ProjectListHeaderActions";
import { ProjectListSortableTable } from "@/components/admin/ProjectListSortableTable";
import { CategorySeoForm } from "@/components/admin/CategorySeoForm";
import {
  countTrashedProjects,
  listProjectsPaginated,
} from "@/lib/admin-project-queries";
import { getProjectCategories, getIgniteSeoById } from "@/lib/ignite-data";

export const metadata = {
  title: "프로젝트 목록",
};

const LIMITS = [10, 20, 50, 100] as const;

function parseIntSafe(v: string | undefined, fallback: number): number {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}

function buildQuery(page: number, limit: number, q: string, category?: string): string {
  const p = new URLSearchParams();
  p.set("page", String(page));
  p.set("limit", String(limit));
  if (q.trim()) p.set("q", q.trim());
  if (category) p.set("category", category);
  const s = p.toString();
  return s ? `?${s}` : "";
}

type Props = {
  searchParams: Promise<{ page?: string; limit?: string; q?: string; category?: string }>;
};

export default async function AdminProjectListPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  let category = sp.category ?? "";

  if (!category) {
    const categories = await getProjectCategories();
    if (categories.length > 0) {
      redirect(`/admin/projects/list?category=${categories[0].id}`);
    }
  }
  let limit = parseIntSafe(sp.limit, 10);
  if (!LIMITS.includes(limit as (typeof LIMITS)[number])) limit = 10;
  const page = Math.max(1, parseIntSafe(sp.page, 1));

  const [result, trashCount] = await Promise.all([
    listProjectsPaginated({
      page,
      limit,
      search: q,
      menu_id: category || undefined,
    }),
    countTrashedProjects(),
  ]);

  const base = "/admin/projects/list";
  const buildHref = (p: number) => `${base}${buildQuery(p, limit, q, category)}`;

  if (!result.ok) {
    return (
      <div>
        <h1 className="text-lg font-medium text-neutral-900">
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

  const categories = await getProjectCategories();
  const matchedCat = categories.find((c) => c.id === category);
  const categoryLabel = matchedCat
    ? matchedCat.type.charAt(0).toUpperCase() + matchedCat.type.slice(1)
    : "전체";

  const categorySeo = matchedCat
    ? await getIgniteSeoById(matchedCat.id)
    : null;

  return (
    <div>
      <div>
        <h1 className="text-lg font-medium text-neutral-900">
          {categoryLabel}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          등록된 리스트를 검색·페이지 단위로 확인합니다. 순서 열의 이동
          아이콘을 드래그해 순서를 맞춘 뒤, 목록 위쪽의{" "}
          <strong className="font-medium text-neutral-700">순서 저장</strong>
          으로 공개 목록 반영 순서를 적용합니다.
        </p>
      </div>

      <form
        method="get"
        action={base}
        className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50 p-4"
      >
        <input type="hidden" name="page" value="1" />
        <input type="hidden" name="limit" value={String(limit)} />
        {category && <input type="hidden" name="category" value={category} />}
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
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
              className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
          >
            적용
          </button>
        </div>
      </form>

      {total === 0 ? (
        <>
          <div className="mt-6 flex justify-end">
            <ProjectListHeaderActions trashCount={trashCount} />
          </div>
          <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-8 py-16 text-center">
          <p className="text-sm font-medium text-neutral-800">
            등록된 프로젝트가 없습니다.
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            새 프로젝트를 추가하면 목록에 표시됩니다.
          </p>
          <Link
            href={`/admin/projects/add${category ? `?category=${category}` : ""}`}
            className="mt-6 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
          >
            추가
          </Link>
        </div>
        </>
      ) : (
        <ProjectListSortableTable
          items={items}
          page={safePage}
          limit={limit}
          q={q}
          trashCount={trashCount}
        />
      )}

      <form
        method="get"
        action={base}
        className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4"
      >
        <input type="hidden" name="q" value={q} />
        <input type="hidden" name="page" value="1" />
        {category && <input type="hidden" name="category" value={category} />}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label
                htmlFor="list-page-limit"
                className="block text-xs uppercase tracking-[0.12em] text-neutral-500"
              >
                페이지당 개수
              </label>
              <select
                id="list-page-limit"
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

      {matchedCat && categorySeo && (
        <div className="mt-10">
          <CategorySeoForm
            key={matchedCat.id}
            categoryId={matchedCat.id}
            categoryLabel={categoryLabel}
            initialSeo={categorySeo}
          />
        </div>
      )}
    </div>
  );
}
