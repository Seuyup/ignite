import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { reorderProjectsOnPage } from "@/lib/admin-project-queries";
import { verifyAdminToken } from "@/lib/admin-session";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const token = (await cookies()).get("admin_token")?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON 본문이 필요합니다." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const page = typeof o.page === "number" ? o.page : Number(o.page);
  const limit = typeof o.limit === "number" ? o.limit : Number(o.limit);
  const q = typeof o.q === "string" ? o.q : "";
  const orderedIds = Array.isArray(o.orderedIds)
    ? o.orderedIds.map((x) => String(x))
    : null;

  if (!Number.isFinite(page) || page < 1) {
    return NextResponse.json({ error: "page가 올바르지 않습니다." }, { status: 400 });
  }
  if (!Number.isFinite(limit) || limit < 1) {
    return NextResponse.json({ error: "limit가 올바르지 않습니다." }, { status: 400 });
  }
  if (!orderedIds?.length) {
    return NextResponse.json({ error: "orderedIds가 필요합니다." }, { status: 400 });
  }

  const result = await reorderProjectsOnPage({
    page: Math.floor(page),
    limit: Math.floor(limit),
    search: q,
    orderedIds,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  revalidatePath("/admin/projects/list");
  revalidatePath("/projects");
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
