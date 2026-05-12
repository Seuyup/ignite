import Link from "next/link";

type Props = {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
  /** 지정 시 기본(목록 하단 중앙) 대신 이 클래스를 `nav`에 적용 */
  className?: string;
  /** true면 페이지가 1개뿐이어도 네비를 렌더하고, 이전/다음·끝 이동은 비활성 표시 */
  alwaysShow?: boolean;
};

const defaultNavClass =
  "mt-8 flex flex-wrap items-center justify-center gap-2 text-sm";

export function AdminPagination({
  page,
  totalPages,
  buildHref,
  className,
  alwaysShow = false,
}: Props) {
  const tp = Math.max(1, totalPages);
  if (!alwaysShow && tp <= 1) return null;

  const navClass = className?.trim() ? className.trim() : defaultNavClass;

  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(tp, start + windowSize - 1);
  if (end - start + 1 < windowSize) {
    start = Math.max(1, end - windowSize + 1);
  }

  const nums: number[] = [];
  for (let i = start; i <= end; i += 1) nums.push(i);

  return (
    <nav className={navClass} aria-label="페이지 이동">
      <PaginationLink
        href={buildHref(1)}
        disabled={page <= 1}
        label="첫 페이지"
        shortLabel="«"
      />
      <PaginationLink
        href={buildHref(page - 1)}
        disabled={page <= 1}
        label="이전"
        shortLabel="이전"
      />
      {nums.map((n) => (
        <Link
          key={n}
          href={buildHref(n)}
          className={`min-w-[2.25rem] rounded-lg border px-2 py-1 text-center transition-colors ${
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
        disabled={page >= tp}
        label="다음"
        shortLabel="다음"
      />
      <PaginationLink
        href={buildHref(tp)}
        disabled={page >= tp}
        label="마지막 페이지"
        shortLabel="»"
      />
    </nav>
  );
}

function PaginationLink({
  href,
  disabled,
  label,
  shortLabel,
}: {
  href: string;
  disabled: boolean;
  label: string;
  shortLabel: string;
}) {
  if (disabled) {
    return (
      <span
        className="rounded-lg border border-neutral-100 px-3 py-1 text-neutral-300"
        aria-disabled="true"
        aria-label={label}
        title={label}
      >
        {shortLabel}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-lg border border-neutral-200 bg-white px-3 py-1 text-neutral-700 transition-colors hover:border-neutral-400"
      title={label}
      aria-label={label}
    >
      {shortLabel}
    </Link>
  );
}
