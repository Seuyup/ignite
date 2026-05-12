import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isSlugTakenByActiveProject } from "@/lib/admin-project-queries";
import { verifyAdminToken } from "@/lib/admin-session";

export async function GET(request: Request) {
  const token = (await cookies()).get("admin_token")?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim().toLowerCase() ?? "";
  const excludeId = searchParams.get("excludeId")?.trim() || undefined;
  if (!slug) {
    return NextResponse.json(
      { available: false, reason: "slug가 비어 있습니다." },
      { status: 400 },
    );
  }

  const taken = await isSlugTakenByActiveProject(slug, excludeId);
  return NextResponse.json({ available: !taken });
}
