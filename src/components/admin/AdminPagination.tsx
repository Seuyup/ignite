import Link from "next/link";

type Props = {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
};

export function AdminPagination({ page, totalPages, buildHref }: Props) {
  if (totalPages <= 1) return null;

  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  if (end - start + 1 < windowSize) {
    start = Math.max(1, end - windowSize + 1);
  }

  const nums: number[] = [];
  for (let i = start; i <= end; i += 1) nums.push(i);

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm"
      aria-label="페이지 이동"
    >
      <PaginationLink
        href={buildHref(page - 1)}
        disabled={page <= 1}
        label="이전"
      />
      {nums.map((n) => (
        <Link
          key={n}
          href={buildHref(n)}
          className={`min-w-[2.25rem] rounded border px-2 py-1 text-center transition-colors ${
            n === page
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
          }`}
        >
          {n}
        </Link>
      ))}
      <PaginationLink
        href={buildHref(page + 1)}
        disabled={page >= totalPages}
        label="다음"
      />
    </nav>
  );
}

function PaginationLink({
  href,
  disabled,
  label,
}: {
  href: string;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return (
      <span className="rounded border border-neutral-100 px-3 py-1 text-neutral-300">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded border border-neutral-200 bg-white px-3 py-1 text-neutral-700 transition-colors hover:border-neutral-400"
    >
      {label}
    </Link>
  );
}
