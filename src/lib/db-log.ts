/**
 * DB 조회 실패를 삼키되, **로그에는 남긴다.**
 *
 * 조회 함수들은 실패해도 빈 배열을 돌려준다. 화면이 통째로 죽는 것보다 낫지만,
 * 그 대가로 "데이터가 없는 것"과 "DB에 못 붙은 것"이 화면에서 똑같아 보인다.
 * 2026-09-28 Vercel 이관 직후 목록이 비어 있었을 때 원인을 밖에서 알 수 없었다.
 *
 * 이제 원인은 Vercel → 프로젝트 → Logs 에 남고,
 * 상태는 `/api/admin/health/db` 로 확인한다.
 */
export function logDbFailure(where: string, err: unknown): void {
  const e = err as { name?: string; message?: string; code?: unknown };
  console.error(
    `[db] ${where} 실패: ${e?.name ?? "Error"} ${e?.message ?? String(err)}`,
  );
}
