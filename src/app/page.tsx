import type { Metadata } from "next";
import { HomeSlideshow } from "@/components/HomeSlideshow";
import {
  getHomeImages,
  getIgniteSeo,
  IGNITE_TYPE_HOME,
} from "@/lib/ignite-data";
import { DEFAULT_OG_IMAGE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getIgniteSeo(IGNITE_TYPE_HOME);
  if (!seo.title && !seo.description && !seo.ogImage) return {};
  const title = seo.title || undefined;
  const description = seo.description || undefined;
  const ogImage = seo.ogImage || DEFAULT_OG_IMAGE;
  return {
    ...(title ? { title: { absolute: title } } : {}),
    ...(description ? { description } : {}),
    openGraph: {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      images: [ogImage],
    },
  };
}

export default async function HomePage() {
  const images = await getHomeImages();

  return <HomeSlideshow images={images} />;
}
