export type Project = {
  title: string;
  subtitle?: string;
  slug: string;
};

/** Placeholder entries aligned with wgnb.kr homepage structure */
export const featuredProjects: Project[] = [
  { title: "MEGA PHACTORY", slug: "mega-phactory" },
  { title: "OLIVE BETTER", subtitle: "Gwanghwamun", slug: "olive-better" },
  { title: "NATIONAL MUSEUM", subtitle: "Buyeo", slug: "national-museum-buyeo" },
  { title: "KOHLER STUDIO", subtitle: "Flagship Store", slug: "kohler-studio" },
];
