import { getStudioForAdmin } from "@/lib/ignite-data";
import { AdminStudioForm } from "@/components/admin/AdminStudioForm";

export const dynamic = "force-dynamic";

export default async function AdminStudioPage() {
  const { body, location } = await getStudioForAdmin();

  return (
    <div>
      <h1 className="text-lg font-medium text-neutral-900">
        Studio 페이지 편집
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Studio 페이지에 표시될 HTML 콘텐츠와 위치 정보를 편집합니다.
      </p>
      <div className="mt-8">
        <AdminStudioForm initialBody={body} initialLocation={location} />
      </div>
    </div>
  );
}
