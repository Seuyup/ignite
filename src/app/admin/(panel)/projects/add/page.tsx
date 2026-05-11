import Link from "next/link";
import { AddProjectForm } from "@/components/admin/AddProjectForm";

export const metadata = {
  title: "프로젝트 추가",
};

export default function AdminAddProjectPage() {
  return (
    <div>
      <p>
        <Link
          href="/admin/projects/list"
          className="text-xs uppercase tracking-[0.12em] text-neutral-500 transition-colors hover:text-neutral-900"
        >
          ← 프로젝트 목록
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-medium tracking-tight text-neutral-900 md:text-3xl">
        프로젝트 추가
      </h1>
      <p className="mt-3 max-w-xl text-sm text-neutral-500">
        홈·프로젝트 목록에 노출되는 항목입니다. 저장 후 해당 slug의 상세 페이지로
        이동합니다.
      </p>
      <div className="mt-10">
        <AddProjectForm />
      </div>
    </div>
  );
}
