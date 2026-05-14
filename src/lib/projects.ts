import type { ProjectMeta } from "@/lib/project-types";

export type Project = {
  title: string;
  sub_title_1: string;
  sub_title_2: string;
  slug: string;
  menu_id: string;
  coverImageUrl?: string;
  images: string[];
  meta: ProjectMeta[];
};

export type ProjectDetail = Project & {
  id: string;
};
