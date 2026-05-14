import { HomeSlideshow } from "@/components/HomeSlideshow";
import { getHomeImages } from "@/lib/ignite-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const images = await getHomeImages();

  return <HomeSlideshow images={images} />;
}
