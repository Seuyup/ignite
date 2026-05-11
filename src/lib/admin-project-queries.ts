import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";

export type AdminProjectRow = {
  id: string;
  title: string;
  slug: string;
  createdAt: Date;
  coverImageUrl?: string;
};

export type AdminProjectEditPayload = {
  title: string;
  subtitle: string;
  slug: string;
  contentHtml: string;
  coverImageUrl: string;
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type ListProjectsResult =
  | {
      ok: true;
      items: AdminProjectRow[];
      total: number;
      page: number;
      totalPages: number;
    }
  | { ok: false; detail: string };

function formatCaughtError(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  const parts = [e.message];
  if (process.env.NODE_ENV === "development" && e.stack) {
    parts.push("", e.stack);
  }
  return parts.join("\n");
}

/** 관리자 수정 폼용: slug로 전체 필드 조회 */
export async function getProjectForEditBySlug(
  slug: string,
): Promise<AdminProjectEditPayload | null> {
  await connectDB();
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;
  const doc = await Project.findOne({ slug: normalized }).lean();
  if (!doc) return null;
  return {
    title: doc.title,
    subtitle: doc.subtitle ?? "",
    slug: doc.slug,
    contentHtml: doc.contentHtml ?? "",
    coverImageUrl: doc.coverImageUrl?.trim() ?? "",
  };
}

export async function listProjectsPaginated(options: {
  page: number;
  limit: number;
  search?: string;
}): Promise<ListProjectsResult> {
  try {
    await connectDB();

    const { page, limit, search } = options;
    const requestedPage = Math.max(1, page);
    const safeLimit = [10, 20, 50].includes(limit) ? limit : 10;

    const filter =
      search && search.trim()
        ? {
            title: { $regex: escapeRegex(search.trim()), $options: "i" },
          }
        : {};

    const total = await Project.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const safePage = Math.min(requestedPage, totalPages);
    const skip = (safePage - 1) * safeLimit;

    const rawItems = await Project.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .select("title slug createdAt coverImageUrl")
      .lean();

    const items: AdminProjectRow[] = rawItems.map((d) => ({
      id: String(d._id),
      title: d.title,
      slug: d.slug,
      createdAt: d.createdAt ?? new Date(0),
      coverImageUrl: d.coverImageUrl?.trim() || undefined,
    }));

    return { ok: true, items, total, page: safePage, totalPages };
  } catch (e: unknown) {
    return { ok: false, detail: formatCaughtError(e) };
  }
}
