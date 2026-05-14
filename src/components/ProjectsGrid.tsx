"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { R2Image } from "@/components/R2Image";
import type { Project } from "@/lib/projects";

type Props = { projects: Project[] };

const BATCH_SIZE = 9;

export function ProjectsGrid({ projects }: Props) {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, projects.length));
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [projects.length]);

  const visible = projects.slice(0, visibleCount);

  if (projects.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/80 px-8 py-20 text-center">
          <p className="text-sm font-medium text-neutral-800">
            등록된 프로젝트가 없습니다.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => (
          <Link
            key={p.slug}
            href={`/projects/${p.slug}`}
            className="group block"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-neutral-200">
              {p.coverImageUrl ? (
                <R2Image
                  src={p.coverImageUrl}
                  alt={p.title}
                  mode="fill"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-100" />
              )}
            </div>
            <div className="mt-3">
              <h3 className="text-base font-medium uppercase leading-tight tracking-wide text-neutral-900 md:text-lg">
                {p.title}
              </h3>
              {p.sub_title_1 && (
                <p className="mt-1 text-xs text-neutral-900">{p.sub_title_1}</p>
              )}
              {p.sub_title_2 && (
                <p className="text-xs text-neutral-900">{p.sub_title_2}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
      {visibleCount < projects.length && (
        <div ref={loaderRef} className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
        </div>
      )}
    </section>
  );
}
