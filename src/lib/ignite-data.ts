import { connectDB } from "@/lib/mongodb";
import { Menu as Ignite } from "@/lib/models/Menu";

export const IGNITE_TYPE_STUDIO = "studio" as const;
export const IGNITE_TYPE_HOME = "home" as const;
export const IGNITE_TYPE_CONTACT = "contact" as const;

export type MenuItem = {
  id: string;
  type: string;
  label: string;
  sort: "top_menu" | "child_menu";
  parent_id: string | null;
  children: MenuItem[];
};

/**
 * 메뉴 트리를 조회합니다.
 * top_menu인 항목을 부모로, child_menu 중 parent_id가 일치하는 것을 자식으로 매핑합니다.
 */
export async function getMenuTree(): Promise<MenuItem[]> {
  try {
    await connectDB();
    const docs = await Ignite.find({
      sort: { $in: ["top_menu", "child_menu"] },
    }).sort({ sortOrder: 1 }).lean();

    type IgniteDoc = {
      _id: { toString(): string };
      type: string;
      sort: "top_menu" | "child_menu";
      parent_id?: { toString(): string } | null;
    };

    const all = docs as unknown as IgniteDoc[];
    const topMenus = all.filter((d) => d.sort === "top_menu");
    const childMenus = all.filter((d) => d.sort === "child_menu");

    return topMenus.map((top) => {
      const topId = top._id.toString();
      const children = childMenus
        .filter((c) => c.parent_id?.toString() === topId)
        .map((c) => ({
          id: c._id.toString(),
          type: c.type,
          label: c.type.charAt(0).toUpperCase() + c.type.slice(1),
          sort: c.sort,
          parent_id: topId,
          children: [],
        }));

      return {
        id: topId,
        type: top.type,
        label: top.type.charAt(0).toUpperCase() + top.type.slice(1),
        sort: top.sort,
        parent_id: null,
        children,
      };
    });
  } catch {
    return [];
  }
}

/**
 * 프로젝트 카테고리 목록을 가져옵니다 (child_menu 중 parent가 "project" 타입인 것들)
 */
export async function getProjectCategories(): Promise<MenuItem[]> {
  try {
    await connectDB();

    type IgniteDoc = {
      _id: { toString(): string };
      type: string;
      sort: "top_menu" | "child_menu";
      parent_id?: { toString(): string } | string | null;
    };

    const projectParent = await Ignite.findOne({
      type: "project",
      sort: "top_menu",
    }).lean() as unknown as IgniteDoc | null;

    if (!projectParent) return [];

    const parentId = projectParent._id.toString();

    // child_menu 전체 조회 후 parent_id를 string 비교로 필터
    const allChildren = await Ignite.find({
      sort: "child_menu",
    }).sort({ sortOrder: 1 }).lean() as unknown as IgniteDoc[];

    const children = allChildren.filter((c) => {
      if (!c.parent_id) return false;
      const pid = typeof c.parent_id === "string"
        ? c.parent_id
        : c.parent_id.toString();
      return pid === parentId;
    });

    return children.map((c) => ({
      id: c._id.toString(),
      type: c.type,
      label: c.type.charAt(0).toUpperCase() + c.type.slice(1),
      sort: c.sort as "child_menu",
      parent_id: parentId,
      children: [],
    }));
  } catch {
    return [];
  }
}

export async function getIgniteBody(type: string): Promise<string> {
  try {
    await connectDB();
    const doc = await Ignite.findOne({ type: type.toLowerCase() }).lean();
    return (doc as { body?: string } | null)?.body ?? "";
  } catch {
    return "";
  }
}

export async function upsertIgniteBody(
  type: string,
  body: string,
): Promise<void> {
  await connectDB();
  await Ignite.findOneAndUpdate(
    { type: type.toLowerCase() },
    { $set: { body } },
    { upsert: true, new: true },
  );
}

export type StudioLocation = {
  lat: number;
  lng: number;
  address: string;
  mapTile: string;
  zoom: number;
} | null;

export async function getStudioBody(): Promise<string> {
  return getIgniteBody(IGNITE_TYPE_STUDIO);
}

export async function getStudioLocation(): Promise<StudioLocation> {
  try {
    await connectDB();
    const doc = await Ignite.findOne({ type: IGNITE_TYPE_STUDIO }).lean();
    const loc = (doc as {
      location?: { lat?: number; lng?: number; address?: string; mapTile?: string; zoom?: number };
    } | null)?.location;
    if (loc?.lat != null && loc?.lng != null) {
      return {
        lat: loc.lat,
        lng: loc.lng,
        address: loc.address ?? "",
        mapTile: loc.mapTile || "stadia_stamen_toner",
        zoom: loc.zoom ?? 16,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function upsertStudioLocation(
  data: { lat: number; lng: number; address: string; mapTile: string; zoom: number },
): Promise<void> {
  await connectDB();
  await Ignite.findOneAndUpdate(
    { type: IGNITE_TYPE_STUDIO },
    { $set: { location: data } },
    { upsert: true, new: true },
  );
}

export async function getStudioForAdmin(): Promise<{
  body: string;
  location: StudioLocation;
}> {
  const [body, location] = await Promise.all([
    getIgniteBody(IGNITE_TYPE_STUDIO),
    getStudioLocation(),
  ]);
  return { body, location };
}

export type HomeImage = { url: string; link: string };

export async function getHomeImages(): Promise<HomeImage[]> {
  const body = await getIgniteBody(IGNITE_TYPE_HOME);
  if (!body.trim()) return [];
  try {
    const parsed = JSON.parse(body);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: unknown) => {
      if (typeof item === "string") return { url: item, link: "" };
      if (item && typeof item === "object" && "url" in item) {
        const obj = item as Record<string, unknown>;
        return {
          url: String(obj.url ?? ""),
          link: String(obj.link ?? ""),
        };
      }
      return null;
    }).filter((v): v is HomeImage => v !== null && v.url.trim().length > 0);
  } catch {
    /* ignore */
  }
  return [];
}

export async function getHomeImagesForAdmin(): Promise<HomeImage[]> {
  return getHomeImages();
}

export async function upsertHomeImages(images: HomeImage[]): Promise<void> {
  await upsertIgniteBody(IGNITE_TYPE_HOME, JSON.stringify(images));
}

/* ── Contact ── */

export async function getContactBody(): Promise<string> {
  return getIgniteBody(IGNITE_TYPE_CONTACT);
}

export async function getContactForAdmin(): Promise<{ body: string }> {
  const body = await getIgniteBody(IGNITE_TYPE_CONTACT);
  return { body };
}
