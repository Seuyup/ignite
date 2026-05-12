/**
 * 클라이언트 컴포넌트에서도 import 가능 (mongoose 미사용).
 * DB 조회는 `admin-project-queries`만 사용하세요.
 */

export type AdminProjectRow = {
  id: string;
  title: string;
  slug: string;
  createdAt: Date;
  /** Mongoose timestamps — 목록에는 수정일 우선 표시용 */
  updatedAt?: Date;
  coverImageUrl?: string;
};

export type AdminProjectEditPayload = {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  contentHtml: string;
  coverImageUrl: string;
};

/** 목록·휴지통: `updatedAt`이 있으면 사용, 없으면 `createdAt` */
export function projectListDisplayDate(row: AdminProjectRow): Date {
  const u = row.updatedAt;
  if (u instanceof Date && !Number.isNaN(u.getTime())) return u;
  return row.createdAt;
}
