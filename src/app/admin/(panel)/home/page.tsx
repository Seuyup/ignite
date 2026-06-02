import { getHomeForAdmin } from "@/lib/ignite-data";
import { AdminHomeForm } from "@/components/admin/AdminHomeForm";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const { logoHtml, images, seo } = await getHomeForAdmin();

  return (
    <div>
      <h1 className="text-lg font-medium text-neutral-900">
        홈 관리
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        헤더 로고 및 슬라이드쇼 이미지를 관리합니다.
      </p>
      <div className="mt-8">
        <AdminHomeForm initialLogoHtml={logoHtml} initialImages={images} initialSeo={seo} />
      </div>
    </div>
  );
}
