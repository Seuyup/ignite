"use client";

import { type ReactNode, useState } from "react";
import type { IgniteSeo } from "@/lib/ignite-data";

type Props = {
  initial: IgniteSeo;
  pageName: string;
  children?: ReactNode;
};

export function AdminSeoFields({ initial, pageName, children }: Props) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [ogImage, setOgImage] = useState(initial.ogImage);

  return (
    <section className="rounded-lg border border-rose-200 bg-rose-50/60 p-5">
      <h2 className="mb-1 text-sm font-medium text-neutral-700">
        SEO 설정
      </h2>
      <p className="mb-4 text-xs text-neutral-400">
        {pageName} 페이지의 검색엔진 최적화 설정입니다. 비워두면 기본값이
        사용됩니다.
      </p>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="seo-title"
            className="mb-1 block text-xs text-neutral-500"
          >
            페이지 제목 (title)
          </label>
          <input
            id="seo-title"
            name="seoTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: IGNITE Studio"
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-neutral-400">
            브라우저 탭과 검색 결과에 표시됩니다.
          </p>
        </div>

        <div>
          <label
            htmlFor="seo-description"
            className="mb-1 block text-xs text-neutral-500"
          >
            설명 (description)
          </label>
          <textarea
            id="seo-description"
            name="seoDescription"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="예: IGNITE 건축 스튜디오 소개 및 위치 안내"
            className="w-full resize-none rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-neutral-400">
            검색 결과 요약에 표시됩니다. 150자 이내 권장.
          </p>
        </div>

        <div>
          <label
            htmlFor="seo-ogImage"
            className="mb-1 block text-xs text-neutral-500"
          >
            공유 이미지 URL (OG Image)
          </label>
          <input
            id="seo-ogImage"
            name="seoOgImage"
            type="text"
            value={ogImage}
            onChange={(e) => setOgImage(e.target.value)}
            placeholder="https://example.com/image.png"
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-neutral-400">
            SNS 공유 시 표시될 이미지 URL입니다. 비워두면 기본 로고가 사용됩니다.
          </p>
          {ogImage.trim() && (
            <div className="mt-2 overflow-hidden rounded border border-neutral-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ogImage}
                alt="OG 미리보기"
                className="h-auto max-h-40 w-full object-contain bg-neutral-50"
              />
            </div>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
