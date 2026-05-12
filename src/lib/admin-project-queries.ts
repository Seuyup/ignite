import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";
import mongoose from "mongoose";

export type AdminProjectRow = {
  id: string;
  title: string;
  slug: string;
  createdAt: Date;
  coverImageUrl?: string;
};

export type AdminProjectEditPayload = {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  contentHtml: string;
  coverImageUrl: string;
};

const ACTIVE = { deletedAt: null } as const;
const LIMIT_OPTIONS = [10, 20, 50, 100] as const;

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

/** 기존 문서에 sortOrder·deletedAt 기본값 채우기 (요청당 1회 수준으로 호출) */
async function ensureProjectListFields(): Promise<void> {
  await Project.updateMany(
    { deletedAt: { $exists: false } },
    { $set: { deletedAt: null } },
  );
  const needsSort = await Project.countDocuments({
    $or: [{ sortOrder: { $exists: false } }, { sortOrder: null }],
  });
  if (needsSort === 0) return;
  const byCreated = await Project.find(ACTIVE)
    .sort({ createdAt: 1 })
    .select("_id")
    .lean();
  if (byCreated.length === 0) return;
  await Project.bulkWrite(
    byCreated.map((d, i) => ({
      updateOne: {
        filter: { _id: d._id },
        update: { $set: { sortOrder: (i + 1) * 10 } },
      },
    })),
  );
}

/** 관리자 수정 폼용: slug로 활성 프로젝트만 조회 */
export async function getProjectForEditBySlug(
  slug: string,
): Promise<AdminProjectEditPayload | null> {
  await connectDB();
  await ensureProjectListFields();
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;
  const doc = await Project.findOne({ slug: normalized, ...ACTIVE }).lean();
  if (!doc) return null;
  return {
    id: String(doc._id),
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
    await ensureProjectListFields();

    const { page, limit, search } = options;
    const requestedPage = Math.max(1, page);
    const safeLimit = LIMIT_OPTIONS.includes(limit as (typeof LIMIT_OPTIONS)[number])
      ? limit
      : 10;

    const filter: Record<string, unknown> = { ...ACTIVE };
    if (search && search.trim()) {
      filter.title = { $regex: escapeRegex(search.trim()), $options: "i" };
    }

    const total = await Project.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const safePage = Math.min(requestedPage, totalPages);
    const skip = (safePage - 1) * safeLimit;

    const rawItems = await Project.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
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

export type ListTrashedResult =
  | {
      ok: true;
      items: AdminProjectRow[];
      total: number;
      page: number;
      totalPages: number;
    }
  | { ok: false; detail: string };

/** 휴지통(소프트 삭제) 목록 */
export async function listTrashedProjectsPaginated(options: {
  page: number;
  limit: number;
}): Promise<ListTrashedResult> {
  try {
    await connectDB();
    await ensureProjectListFields();

    const requestedPage = Math.max(1, options.page);
    const safeLimit = LIMIT_OPTIONS.includes(
      options.limit as (typeof LIMIT_OPTIONS)[number],
    )
      ? options.limit
      : 10;

    const filter = { deletedAt: { $ne: null } };
    const total = await Project.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const safePage = Math.min(requestedPage, totalPages);
    const skip = (safePage - 1) * safeLimit;

    const rawItems = await Project.find(filter)
      .sort({ deletedAt: -1 })
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

export async function countTrashedProjects(): Promise<number> {
  await connectDB();
  return Project.countDocuments({ deletedAt: { $ne: null } });
}

/** 활성 프로젝트 slug 중복 여부 (수정 시 자기 자신 제외) */
export async function isSlugTakenByActiveProject(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  await connectDB();
  await ensureProjectListFields();
  const s = slug.trim().toLowerCase();
  if (!s) return true;
  const q: Record<string, unknown> = { slug: s, ...ACTIVE };
  if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
    q._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
  }
  const found = await Project.findOne(q).select("_id").lean();
  return Boolean(found);
}

export async function reorderProjectsOnPage(options: {
  page: number;
  limit: number;
  search?: string;
  orderedIds: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await connectDB();
    await ensureProjectListFields();

    const { page, limit, search, orderedIds } = options;
    const safeLimit = LIMIT_OPTIONS.includes(limit as (typeof LIMIT_OPTIONS)[number])
      ? limit
      : 10;
    const safePage = Math.max(1, page);

    const filter: Record<string, unknown> = { ...ACTIVE };
    if (search && search.trim()) {
      filter.title = { $regex: escapeRegex(search.trim()), $options: "i" };
    }

    const full = await Project.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .select("_id")
      .lean();
    const fullIds = full.map((d) => String(d._id));
    const start = (safePage - 1) * safeLimit;
    const end = start + safeLimit;
    const pageSlice = fullIds.slice(start, end);

    if (orderedIds.length !== pageSlice.length) {
      return { ok: false, error: "순서 정보가 목록과 일치하지 않습니다." };
    }
    const a = new Set(pageSlice);
    const b = new Set(orderedIds);
    if (a.size !== b.size || [...a].some((id) => !b.has(id))) {
      return { ok: false, error: "순서 변경 대상 행이 현재 페이지와 다릅니다." };
    }

    const merged = [...fullIds.slice(0, start), ...orderedIds, ...fullIds.slice(end)];
    const ops = merged.map((id, index) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(id) },
        update: { $set: { sortOrder: (index + 1) * 10 } },
      },
    }));
    if (ops.length) await Project.bulkWrite(ops);
    return { ok: true };
  } catch (e: unknown) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "순서 저장에 실패했습니다.",
    };
  }
}
