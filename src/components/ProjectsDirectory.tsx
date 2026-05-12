import Link from "next/link";
import { R2Image } from "@/components/R2Image";
import type { Project } from "@/lib/projects";

type Props = { projects: Project[] };

export function ProjectsDirectory({ projects }: Props) {
  if (projects.length === 0) {
    return (
      <section
        className="mx-auto max-w-6xl px-6 py-20 md:py-28"
        aria-label="프로젝트 목록"
      >
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/80 px-8 py-20 text-center">
          <p className="text-sm font-medium text-neutral-800">
            등록된 프로젝트가 없습니다.
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            곧 작업이 이곳에 표시됩니다.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="mx-auto max-w-6xl px-6 pb-20 pt-4 md:pb-28 md:pt-8"
      aria-label="프로젝트 목록"
    >
      <ul className="flex flex-col gap-10 md:gap-14">
        {projects.map((p, i) => (
          <li key={p.slug} className="min-h-0">
            <Link
              href={`/projects/${p.slug}`}
              className="group grid overflow-hidden rounded-3xl border border-neutral-200/90 bg-white shadow-[0_2px_24px_-8px_rgba(0,0,0,0.08)] outline-none ring-offset-2 transition duration-300 hover:border-neutral-300 hover:shadow-[0_20px_50px_-16px_rgba(0,0,0,0.14)] focus-visible:ring-2 focus-visible:ring-neutral-900 md:min-h-[280px] md:grid-cols-12"
            >
              <div className="relative aspect-[4/3] min-h-[200px] md:col-span-7 md:aspect-auto md:min-h-[320px] lg:min-h-[360px]">
                {p.coverImageUrl ? (
                  <R2Image
                    src={p.coverImageUrl}
                    alt=""
                    mode="fill"
                    className="object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 60vw"
                  />
                ) : (
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-200"
                    aria-hidden
                  />
                )}
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent md:bg-gradient-to-r md:from-black/20 md:via-transparent md:to-transparent"
                  aria-hidden
                />
                <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-700 shadow-sm backdrop-blur-sm md:left-6 md:top-6">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="flex flex-col justify-center gap-4 p-6 md:col-span-5 md:p-10 lg:p-12">
                <div>
                  <h2 className="text-2xl font-medium leading-tight tracking-tight text-neutral-900 transition-colors group-hover:text-neutral-700 md:text-3xl lg:text-[2rem]">
                    {p.title}
                  </h2>
                  {p.subtitle ? (
                    <p className="mt-3 text-xs uppercase tracking-[0.14em] text-neutral-500 md:text-sm">
                      {p.subtitle}
                    </p>
                  ) : null}
                </div>
                <p className="max-w-sm text-sm leading-relaxed text-neutral-500">
                  상세 페이지에서 본문과 크레딧을 확인할 수 있습니다.
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900">
                  <span className="border-b border-neutral-900/30 pb-px transition-colors group-hover:border-neutral-900">
                    프로젝트 보기
                  </span>
                  <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M2 6h8M7 3l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
