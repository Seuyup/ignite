import { notFound } from "next/navigation";
import { getIndividualPages } from "@/lib/ignite-data";
import { AdminIndividualForm } from "@/components/admin/AdminIndividualForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditPagePage({ params }: Props) {
  const { id } = await params;
  const pages = await getIndividualPages();
  const page = pages.find((p) => p.id === id);
  if (!page) notFound();

  return (
    <div>
      <h1 className="text-lg font-medium text-neutral-900">
        페이지 편집 — {page.title}
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        /p/{page.type} 페이지를 편집합니다.
      </p>
      <div className="mt-8">
        <AdminIndividualForm
          id={page.id}
          initialType={page.type}
          initialTitle={page.title}
          initialBody={page.body}
          initialSeo={page.seo}
        />
      </div>
    </div>
  );
}
