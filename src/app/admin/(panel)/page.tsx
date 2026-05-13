export const metadata = {
  title: "관리자",
};

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight text-neutral-900 md:text-3xl">
        관리자
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-neutral-500">
        사이트 콘텐츠를 관리하는 영역입니다.
      </p>
    </div>
  );
}
