import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-6xl font-light text-neutral-900">404</h1>
      <p className="mt-4 text-sm text-neutral-500">
        페이지를 찾을 수 없습니다.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
      >
        홈으로 돌아가기
      </Link>
    </section>
  );
}
