import { ContactEditorForm } from "@/components/admin/ContactEditorForm";
import { getContactForAdmin } from "@/lib/contact-data";

export const metadata = {
  title: "연락처 편집",
};

export default async function AdminContactPage() {
  const { body } = await getContactForAdmin();

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight text-neutral-900 md:text-3xl">
        연락처 편집
      </h1>
      <p className="mt-3 max-w-xl text-sm text-neutral-500">
        공개 페이지의 `/contact` 본문을 수정합니다.
      </p>
      <div className="mt-10">
        <ContactEditorForm initialBody={body} />
      </div>
    </div>
  );
}
