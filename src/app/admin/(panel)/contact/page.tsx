import { getContactForAdmin } from "@/lib/ignite-data";
import { AdminContactForm } from "@/components/admin/AdminContactForm";

export const dynamic = "force-dynamic";

export default async function AdminContactPage() {
  const { body } = await getContactForAdmin();

  return (
    <div>
      <h1 className="text-lg font-medium text-neutral-900">
        Contact 페이지 편집
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Contact 페이지 하단에 표시될 HTML 콘텐츠를 편집합니다.
      </p>
      <div className="mt-8">
        <AdminContactForm initialBody={body} />
      </div>
    </div>
  );
}
