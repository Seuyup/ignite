import { NextRequest, NextResponse } from "next/server";
import { getAdjacentProjects, getProjectBySlug } from "@/lib/project-queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const project = await getProjectBySlug(slug);
  if (!project) {
    return NextResponse.json({ prev: null, next: null });
  }

  const menuId = request.nextUrl.searchParams.get("menu_id") || project.menu_id;
  const adjacent = await getAdjacentProjects(slug, menuId);
  return NextResponse.json(adjacent);
}
