import { getStudioForAdmin } from "@/lib/ignite-data";
import { AdminStudioForm } from "@/components/admin/AdminStudioForm";

export const dynamic = "force-dynamic";

export default async function AdminStudioPage() {
  const { bodyTop, bodyBottom, location } = await getStudioForAdmin();

  return (
    <div>
      <h1 className="text-lg font-medium text-neutral-900">
        Studio 페이지 편집
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Studio 페이지는 <strong>상단 HTML → 지도 → 하단 HTML</strong> 순서로
        표시됩니다. 각 영역은 비워두면 노출되지 않습니다.
      </p>
      <div className="mt-8">
        <AdminStudioForm
          initialBodyTop={bodyTop}
          initialBodyBottom={bodyBottom}
          initialLocation={location}
        />
      </div>
    </div>
  );
}
