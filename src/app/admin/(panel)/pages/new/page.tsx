import { AdminIndividualForm } from "@/components/admin/AdminIndividualForm";

export const dynamic = "force-dynamic";

export default function AdminNewPagePage() {
  return (
    <div>
      <h1 className="text-lg font-medium text-neutral-900">
        새 개별 페이지
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        새로운 individual 페이지를 생성합니다.
      </p>
      <div className="mt-8">
        <AdminIndividualForm />
      </div>
    </div>
  );
}
