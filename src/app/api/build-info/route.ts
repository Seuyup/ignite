import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/build-info — 지금 떠 있는 배포가 무엇인지 한 줄로 확인한다.
 *
 * 푸시했는데 화면이 그대로일 때, 배포가 실패한 것인지 코드가 덜 고쳐진 것인지
 * 밖에서는 구분할 수 없었다. 커밋 해시와 런타임 Node 버전만 돌려준다.
 *
 * 비밀값·환경 변수 유무는 넣지 않는다. 그건 `/api/admin/health/db` 쪽이다.
 */
export function GET() {
  return NextResponse.json({
    commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 7),
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    node: process.version,
    region: process.env.VERCEL_REGION ?? null,
    env: process.env.VERCEL_ENV ?? "development",
  });
}
