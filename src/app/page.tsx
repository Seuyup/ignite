import { ProjectShowcase } from "@/components/ProjectShowcase";
import { getProjectsForPublic } from "@/lib/project-queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await getProjectsForPublic();

  return (
    <>
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <p className="max-w-3xl text-balance text-sm uppercase leading-relaxed tracking-tagline text-neutral-700 md:text-base">
            ignite — WE MAY SEE THE SAME THING
            <span className="text-neutral-400"> but </span>
            WE THINK DIFFERENTLY!
          </p>
        </div>
      </section>
      <ProjectShowcase projects={projects} />
    </>
  );
}
