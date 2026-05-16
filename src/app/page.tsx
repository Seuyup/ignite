import type { Metadata } from "next";
import { HomeSlideshow } from "@/components/HomeSlideshow";
import {
  getHomeImages,
  getIgniteSeo,
  IGNITE_TYPE_HOME,
} from "@/lib/ignite-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getIgniteSeo(IGNITE_TYPE_HOME);
  if (!seo.title && !seo.description && !seo.ogImage) return {};
  const title = seo.title || undefined;
  const description = seo.description || undefined;
  return {
    ...(title ? { title: { absolute: title } } : {}),
    ...(description ? { description } : {}),
    openGraph: {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(seo.ogImage ? { images: [{ url: seo.ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(seo.ogImage ? { images: [seo.ogImage] } : {}),
    },
  };
}

export default async function HomePage() {
  const images = await getHomeImages();

  return <HomeSlideshow images={images} />;
}
