import Link from "next/link";
import { getIndividualPages } from "@/lib/ignite-data";
import { IndividualDeleteButton } from "@/components/admin/IndividualDeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  const pages = await getIndividualPages();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-neutral-900">
            개별 페이지 관리
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            individual 타입 페이지를 생성·편집합니다. URL은{" "}
            <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">/p/slug</code>{" "}
            형태로 접근됩니다.
          </p>
        </div>
        <Link
          href="/admin/pages/new"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
        >
          새 페이지
        </Link>
      </div>

      {pages.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-8 py-16 text-center">
          <p className="text-sm font-medium text-neutral-800">
            등록된 개별 페이지가 없습니다.
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            새 페이지를 추가하면 목록에 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {pages.map((page) => (
            <div
              key={page.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-5 py-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900">
                  {page.title}
                </p>
                <p className="mt-0.5 text-xs text-neutral-400">
                  /p/{page.type}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/p/${page.type}`}
                  target="_blank"
                  className="rounded border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-700"
                >
                  미리보기
                </Link>
                <Link
                  href={`/admin/pages/${page.id}`}
                  className="rounded border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-700"
                >
                  편집
                </Link>
                <IndividualDeleteButton id={page.id} title={page.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
