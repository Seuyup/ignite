import type { Project } from "@/lib/projects";
import { featuredProjects } from "@/lib/projects";
import { connectDB } from "@/lib/mongodb";
import { Project as ProjectModel } from "@/lib/models/Project";

export type ProjectDetail = Project & {
  contentHtml?: string;
};

function mapDoc(p: {
  title: string;
  subtitle?: string | null;
  slug: string;
  coverImageUrl?: string | null;
}): Project {
  const cover = p.coverImageUrl?.trim();
  return {
    title: p.title,
    subtitle: p.subtitle ?? undefined,
    slug: p.slug,
    ...(cover ? { coverImageUrl: cover } : {}),
  };
}

function mapDocDetail(p: {
  title: string;
  subtitle?: string | null;
  slug: string;
  contentHtml?: string | null;
  coverImageUrl?: string | null;
}): ProjectDetail {
  return {
    ...mapDoc(p),
    contentHtml: p.contentHtml ?? "",
  };
}

export async function getProjectsForPublic(): Promise<Project[]> {
  try {
    await connectDB();
    const docs = await ProjectModel.find().sort({ createdAt: -1 }).lean();
    if (docs.length > 0) {
      return docs.map((d) =>
        mapDoc({
          title: d.title,
          subtitle: d.subtitle,
          slug: d.slug,
          coverImageUrl: d.coverImageUrl,
        }),
      );
    }
  } catch {
    /* Mongo 미설정·연결 실패 시 정적 데이터 사용 */
  }
  return featuredProjects;
}

export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  try {
    await connectDB();
    const doc = await ProjectModel.findOne({ slug }).lean();
    if (doc) {
      return mapDocDetail({
        title: doc.title,
        subtitle: doc.subtitle,
        slug: doc.slug,
        contentHtml: doc.contentHtml,
        coverImageUrl: doc.coverImageUrl,
      });
    }
  } catch {
    /* fall through */
  }
  const fallback = featuredProjects.find((p) => p.slug === slug);
  return fallback
    ? { ...fallback, contentHtml: "", coverImageUrl: fallback.coverImageUrl }
    : null;
}

export async function getProjectSlugsForStaticParams(): Promise<string[]> {
  try {
    await connectDB();
    const docs = await ProjectModel.find().select("slug").lean();
    if (docs.length > 0) return docs.map((d) => d.slug);
  } catch {
    /* fallback */
  }
  return featuredProjects.map((p) => p.slug);
}
