import type { ReactNode } from "react";

type Props = { title: string; children?: ReactNode };

export function SectionPage({ title, children }: Props) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <h1 className="text-2xl font-medium tracking-tight text-neutral-900 md:text-3xl">
        {title}
      </h1>
      {children ? (
        <div className="mt-8 max-w-2xl text-sm leading-relaxed text-neutral-600 md:text-base">
          {children}
        </div>
      ) : (
        <p className="mt-8 max-w-2xl text-sm text-neutral-500 md:text-base">
          이 섹션은 기본 틀입니다. 콘텐츠를 이 페이지에 연결하세요.
        </p>
      )}
    </div>
  );
}
