import type { Project, ProjectDetail } from "@/lib/projects";
import { connectDB } from "@/lib/mongodb";
import { List as ProjectModel } from "@/lib/models/List";

const ACTIVE = { deletedAt: null } as const;

type DocLean = Record<string, unknown>;

function mapDoc(d: DocLean): Project {
  const cover = (d.coverImageUrl as string | undefined)?.trim();
  return {
    title: d.title as string,
    sub_title_1: (d.sub_title_1 as string) ?? "",
    sub_title_2: (d.sub_title_2 as string) ?? "",
    slug: d.slug as string,
    menu_id: (d.menu_id as string) ?? "",
    images: Array.isArray(d.images) ? d.images : [],
    meta: Array.isArray(d.meta) ? d.meta : [],
    ...(cover ? { coverImageUrl: cover } : {}),
  };
}

function mapDocDetail(d: DocLean): ProjectDetail {
  return {
    ...mapDoc(d),
    id: (d._id as { toString(): string }).toString(),
  };
}

export async function getProjectsForPublic(): Promise<Project[]> {
  try {
    await connectDB();
    const docs = await ProjectModel.find(ACTIVE)
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    return docs.map(mapDoc);
  } catch {
    return [];
  }
}

export async function getProjectsByMenuId(
  menuId: string,
): Promise<Project[]> {
  try {
    await connectDB();
    const docs = await ProjectModel.find({ ...ACTIVE, menu_id: menuId })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    return docs.map(mapDoc);
  } catch {
    return [];
  }
}

export async function getProjectDetailsByMenuId(
  menuId: string,
): Promise<ProjectDetail[]> {
  try {
    await connectDB();
    const docs = await ProjectModel.find({ ...ACTIVE, menu_id: menuId })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    return docs.map(mapDocDetail);
  } catch {
    return [];
  }
}

export async function getProjectBySlug(
  slug: string,
): Promise<ProjectDetail | null> {
  try {
    await connectDB();
    const doc = await ProjectModel.findOne({ slug, ...ACTIVE }).lean();
    if (doc) return mapDocDetail(doc);
  } catch {
    /* fall through */
  }
  return null;
}

export async function getProjectSlugsForStaticParams(): Promise<string[]> {
  try {
    await connectDB();
    const docs = await ProjectModel.find(ACTIVE).select("slug").lean();
    return docs.map((d) => (d as DocLean).slug as string);
  } catch {
    return [];
  }
}

export async function getAdjacentProjects(
  slug: string,
  menuId: string,
): Promise<{ prev: ProjectDetail | null; next: ProjectDetail | null }> {
  try {
    await connectDB();
    const docs = await ProjectModel.find({ ...ACTIVE, menu_id: menuId })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    const idx = docs.findIndex((d: any) => d.slug === slug);
    if (idx === -1) return { prev: null, next: null };

    const prev = idx > 0 ? mapDocDetail(docs[idx - 1]) : null;
    const next = idx < docs.length - 1 ? mapDocDetail(docs[idx + 1]) : null;
    return { prev, next };
  } catch {
    return { prev: null, next: null };
  }
}
