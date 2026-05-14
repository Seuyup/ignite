import type { ProjectMeta } from "@/lib/project-types";

export type AdminProjectRow = {
  id: string;
  title: string;
  slug: string;
  menu_id: string;
  createdAt: Date;
  updatedAt?: Date;
  coverImageUrl?: string;
};

export type AdminProjectEditPayload = {
  id: string;
  title: string;
  sub_title_1: string;
  sub_title_2: string;
  slug: string;
  menu_id: string;
  images: string[];
  coverImageUrl: string;
  meta: ProjectMeta[];
};

export function projectListDisplayDate(row: AdminProjectRow): Date {
  const u = row.updatedAt;
  if (u instanceof Date && !Number.isNaN(u.getTime())) return u;
  return row.createdAt;
}
