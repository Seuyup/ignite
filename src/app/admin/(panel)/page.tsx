import Link from "next/link";

export const metadata = {
  title: "관리자",
};

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight text-neutral-900 md:text-3xl">
        관리자
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-neutral-500">
        사이트 콘텐츠를 관리하는 영역입니다. 아래에서 작업을 선택하세요.
      </p>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2">
        <li className="border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-medium text-neutral-900">프로젝트</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            홈과 프로젝트 상세에 노출되는 작업 목록을 추가·조회합니다. 제목,
            부제, URL용 slug, 본문(리치 텍스트/HTML)을 저장합니다.
          </p>
          <Link
            href="/admin/projects/list"
            className="mt-4 inline-block text-sm text-neutral-900 underline underline-offset-4 hover:opacity-70"
          >
            프로젝트 목록으로 →
          </Link>
        </li>
        <li className="border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-medium text-neutral-900">연락처</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            공개 페이지의 연락처 섹션 본문을 수정합니다. 저장 후 방문자에게
            반영됩니다.
          </p>
          <Link
            href="/admin/contact"
            className="mt-4 inline-block text-sm text-neutral-900 underline underline-offset-4 hover:opacity-70"
          >
            연락처 편집으로 →
          </Link>
        </li>
      </ul>
    </div>
  );
}
