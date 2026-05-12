import { AdminInstagramForm } from "@/components/admin/AdminInstagramForm";
import { getInstagramHandle } from "@/lib/ignite-data";

export const metadata = {
  title: "Instagram",
};

export default async function AdminInstagramPage() {
  const initialInstagramId = await getInstagramHandle();

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight text-neutral-900 md:text-3xl">
        Instagram
      </h1>
      <p className="mt-3 max-w-xl text-sm text-neutral-500">
        사이트 헤더의 Instagram 링크 대상입니다. 비우면 해당 메뉴는 표시되지
        않습니다.
      </p>
      <div className="mt-10">
        <AdminInstagramForm initialInstagramId={initialInstagramId} />
      </div>
    </div>
  );
}
