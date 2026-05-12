import Link from "next/link";
import { R2Image } from "@/components/R2Image";
import type { Project } from "@/lib/projects";

type Props = { projects: Project[] };

export function ProjectShowcase({ projects }: Props) {
  return (
    <section
      className="mx-auto max-w-6xl px-6 py-16 md:py-24"
      aria-label="Featured work"
    >
      <ul className="flex flex-col gap-12 md:gap-16">
        {projects.map((p) => (
          <li
            key={p.slug}
            className="group border-b border-neutral-200 pb-12 last:border-b-0 md:pb-16"
          >
            <Link
              href={`/projects/${p.slug}`}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
            >
              {p.coverImageUrl ? (
                <div className="relative mb-6 aspect-[21/9] max-h-[min(52vh,420px)] w-full overflow-hidden rounded-xl bg-neutral-100 md:aspect-[2.4/1]">
                  <R2Image
                    src={p.coverImageUrl}
                    alt=""
                    mode="fill"
                    className="object-cover transition duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, 1152px"
                  />
                </div>
              ) : null}
              <h2 className="text-2xl font-medium tracking-tight text-neutral-900 transition-opacity group-hover:opacity-70 md:text-3xl">
                {p.title}
              </h2>
              {p.subtitle ? (
                <p className="mt-2 text-sm uppercase tracking-tagline text-neutral-500 md:text-base">
                  <span aria-hidden="true" className="text-neutral-300">
                    {" "}
                    ❘{" "}
                  </span>
                  {p.subtitle}
                </p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
