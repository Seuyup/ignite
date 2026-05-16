import { connectDB } from "@/lib/mongodb";
import { Menu as Ignite } from "@/lib/models/Menu";

export const IGNITE_TYPE_STUDIO = "studio" as const;
export const IGNITE_TYPE_HOME = "home" as const;
export const IGNITE_TYPE_CONTACT = "contact" as const;

export type IgniteSeo = {
  title: string;
  description: string;
  ogImage: string;
};

const EMPTY_SEO: IgniteSeo = { title: "", description: "", ogImage: "" };

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

/* ── SEO ── */

export async function getIgniteSeo(type: string): Promise<IgniteSeo> {
  try {
    await connectDB();
    const doc = await Ignite.findOne({ type: type.toLowerCase() }).lean();
    const seo = (doc as { seo?: Record<string, unknown> } | null)?.seo;
    if (!seo) return { ...EMPTY_SEO };
    return {
      title: (seo.title as string) || "",
      description: (seo.description as string) || "",
      ogImage: (seo.ogImage as string) || "",
    };
  } catch {
    return { ...EMPTY_SEO };
  }
}

export async function upsertIgniteSeo(
  type: string,
  seo: IgniteSeo,
): Promise<void> {
  await connectDB();
  await Ignite.findOneAndUpdate(
    { type: type.toLowerCase() },
    { $set: { seo } },
    { upsert: true, new: true },
  );
}

export async function getIgniteSeoById(id: string): Promise<IgniteSeo> {
  try {
    await connectDB();
    const doc = await Ignite.findById(id).lean();
    const seo = (doc as { seo?: Record<string, unknown> } | null)?.seo;
    if (!seo) return { ...EMPTY_SEO };
    return {
      title: (seo.title as string) || "",
      description: (seo.description as string) || "",
      ogImage: (seo.ogImage as string) || "",
    };
  } catch {
    return { ...EMPTY_SEO };
  }
}

export async function upsertIgniteSeoById(
  id: string,
  seo: IgniteSeo,
): Promise<void> {
  await connectDB();
  await Ignite.findByIdAndUpdate(id, { $set: { seo } });
}

/* ── Body ── */

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
  mapType: string;
  zoom: number;
  showZoomControl: boolean;
  showScaleControl: boolean;
  showMapTypeControl: boolean;
  scrollWheel: boolean;
  draggable: boolean;
} | null;

export async function getStudioBody(): Promise<string> {
  return getIgniteBody(IGNITE_TYPE_STUDIO);
}

export type StudioBodies = { bodyTop: string; bodyBottom: string };

export async function getStudioBodies(): Promise<StudioBodies> {
  try {
    await connectDB();
    const doc = await Ignite.findOne({ type: IGNITE_TYPE_STUDIO }).lean();
    const d = doc as { body?: string; bodyTop?: string; bodyBottom?: string } | null;
    return {
      bodyTop: d?.bodyTop || d?.body || "",
      bodyBottom: d?.bodyBottom || "",
    };
  } catch {
    return { bodyTop: "", bodyBottom: "" };
  }
}

export async function upsertStudioBodies(
  bodyTop: string,
  bodyBottom: string,
): Promise<void> {
  await connectDB();
  await Ignite.findOneAndUpdate(
    { type: IGNITE_TYPE_STUDIO },
    { $set: { bodyTop, bodyBottom } },
    { upsert: true, new: true },
  );
}

export async function getStudioLocation(): Promise<StudioLocation> {
  try {
    await connectDB();
    const doc = await Ignite.findOne({ type: IGNITE_TYPE_STUDIO }).lean();
    const loc = (doc as {
      location?: Record<string, unknown>;
    } | null)?.location;
    if (loc?.lat != null && loc?.lng != null) {
      return {
        lat: loc.lat as number,
        lng: loc.lng as number,
        mapType: (loc.mapType as string) || (loc.mapTile as string) || "NORMAL",
        zoom: (loc.zoom as number) ?? 16,
        showZoomControl: loc.showZoomControl !== false,
        showScaleControl: loc.showScaleControl !== false,
        showMapTypeControl: loc.showMapTypeControl === true,
        scrollWheel: loc.scrollWheel === true,
        draggable: loc.draggable !== false,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function upsertStudioLocation(
  data: Omit<NonNullable<StudioLocation>, never>,
): Promise<void> {
  await connectDB();
  await Ignite.findOneAndUpdate(
    { type: IGNITE_TYPE_STUDIO },
    { $set: { location: data } },
    { upsert: true, new: true },
  );
}

export async function getStudioForAdmin(): Promise<{
  bodyTop: string;
  bodyBottom: string;
  location: StudioLocation;
  seo: IgniteSeo;
}> {
  const [bodies, location, seo] = await Promise.all([
    getStudioBodies(),
    getStudioLocation(),
    getIgniteSeo(IGNITE_TYPE_STUDIO),
  ]);
  return { ...bodies, location, seo };
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

export async function getContactForAdmin(): Promise<{
  body: string;
  seo: IgniteSeo;
}> {
  const [body, seo] = await Promise.all([
    getIgniteBody(IGNITE_TYPE_CONTACT),
    getIgniteSeo(IGNITE_TYPE_CONTACT),
  ]);
  return { body, seo };
}

export async function getHomeForAdmin(): Promise<{
  images: HomeImage[];
  seo: IgniteSeo;
}> {
  const [images, seo] = await Promise.all([
    getHomeImages(),
    getIgniteSeo(IGNITE_TYPE_HOME),
  ]);
  return { images, seo };
}

/* ── Individual Pages ── */

export type IndividualPage = {
  id: string;
  type: string;
  title: string;
  body: string;
  seo: IgniteSeo;
};

export async function getIndividualPages(): Promise<IndividualPage[]> {
  try {
    await connectDB();
    const docs = await Ignite.find({ sort: "individual" })
      .sort({ sortOrder: 1 })
      .lean();
    type Doc = Record<string, unknown> & {
      _id: { toString(): string };
      seo?: Record<string, unknown>;
    };
    return (docs as unknown as Doc[]).map((d) => ({
      id: d._id.toString(),
      type: (d.type as string) || "",
      title: (d.title as string) || "",
      body: (d.body as string) || "",
      seo: {
        title: (d.seo?.title as string) || "",
        description: (d.seo?.description as string) || "",
        ogImage: (d.seo?.ogImage as string) || "",
      },
    }));
  } catch {
    return [];
  }
}

export async function getIndividualPageByType(
  type: string,
): Promise<IndividualPage | null> {
  try {
    await connectDB();
    const doc = await Ignite.findOne({
      sort: "individual",
      type: type.toLowerCase(),
    }).lean();
    if (!doc) return null;
    const d = doc as Record<string, unknown> & {
      _id: { toString(): string };
      seo?: Record<string, unknown>;
    };
    return {
      id: d._id.toString(),
      type: (d.type as string) || "",
      title: (d.title as string) || "",
      body: (d.body as string) || "",
      seo: {
        title: (d.seo?.title as string) || "",
        description: (d.seo?.description as string) || "",
        ogImage: (d.seo?.ogImage as string) || "",
      },
    };
  } catch {
    return null;
  }
}

export async function upsertIndividualPage(data: {
  id?: string;
  type: string;
  title: string;
  body: string;
  seo: IgniteSeo;
}): Promise<void> {
  await connectDB();
  if (data.id) {
    await Ignite.findByIdAndUpdate(data.id, {
      $set: {
        type: data.type.toLowerCase(),
        title: data.title,
        body: data.body,
        sort: "individual",
        seo: data.seo,
      },
    });
  } else {
    await Ignite.create({
      type: data.type.toLowerCase(),
      title: data.title,
      body: data.body,
      sort: "individual",
      seo: data.seo,
    });
  }
}

export async function deleteIndividualPage(id: string): Promise<void> {
  await connectDB();
  await Ignite.findByIdAndDelete(id);
}
