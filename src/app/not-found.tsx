import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24 text-center">
      <h1 className="text-2xl font-medium text-neutral-900">404</h1>
      <p className="mt-4 text-sm text-neutral-600">페이지를 찾을 수 없습니다.</p>
      <Link
        href="/"
        className="mt-8 inline-block text-xs uppercase tracking-[0.14em] text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
      >
        홈으로
      </Link>
    </div>
  );
}
