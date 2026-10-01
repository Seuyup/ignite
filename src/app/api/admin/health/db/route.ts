import { cookies } from "next/headers";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin-session";
import { connectDB } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/health/db — DB 연결 점검.
 *
 * 조회 함수들이 실패를 삼키고 빈 배열을 돌려주기 때문에, 화면만 봐서는
 * "데이터가 없는 것"과 "DB에 못 붙은 것"을 구분할 수 없다.
 * 배포 직후 목록이 비면 여기부터 열어 본다.
 *
 * 관리자 쿠키로 막는다. 관리자 로그인은 `ADMIN_SECRET` HMAC 이라
 * **DB가 죽어 있어도** 통과한다.
 *
 * 자격 증명은 절대 돌려주지 않는다 — 스킴·호스트 수·DB 이름까지만.
 */
export async function GET() {
  const token = (await cookies()).get("admin_token")?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json(
      { ok: false, error: "관리자 로그인이 필요합니다." },
      { status: 401 },
    );
  }

  const uri = process.env.MONGODB_URI;
  const env = {
    MONGODB_URI: Boolean(uri),
    scheme: uri?.startsWith("mongodb+srv://")
      ? "srv"
      : uri?.startsWith("mongodb://")
        ? "standard"
        : null,
    hosts: uri ? (uri.match(/@([^/?]+)/)?.[1]?.split(",").length ?? 0) : 0,
    // URI 경로에 DB 이름이 없으면 `test` 에 붙는다 — 붙긴 하는데 데이터가 없다
    dbInUri: uri ? (uri.match(/@[^/]+\/([^?]*)/)?.[1] || null) : null,
    vercelRegion: process.env.VERCEL_REGION ?? null,
  };

  // 런타임 Node 버전 — jsdom(29) 은 ^20.19 || ^22.13 || >=24 를 요구한다.
  // 이보다 낮으면 `sanitizeRichHtml` 을 쓰는 라우트가 import 단계에서 터진다.
  const runtimeNode = process.version;
  let sanitize: { ok: boolean; error?: string };
  try {
    const mod = await import("@/lib/sanitize-html");
    const out = mod.sanitizeRichHtml("<p onclick=\"x\">ok</p>");
    sanitize = { ok: out.includes("ok") && !out.includes("onclick") };
  } catch (e) {
    const err = e as { name?: string; message?: string };
    sanitize = {
      ok: false,
      error: `${err?.name ?? "Error"}: ${(err?.message ?? String(e)).slice(0, 300)}`,
    };
  }

  if (!uri) {
    return NextResponse.json({
      ok: false,
      env,
      runtimeNode,
      sanitize,
      reason: "MONGODB_URI 환경 변수가 없습니다. Vercel → Settings → Environment Variables 에 넣고 재배포하세요.",
    });
  }

  const started = Date.now();
  try {
    await connectDB();
    const db = mongoose.connection.db;
    const names = db ? (await db.listCollections().toArray()).map((c) => c.name) : [];

    const counts: Record<string, number> = {};
    for (const name of names) {
      counts[name] = await db!.collection(name).countDocuments();
    }

    return NextResponse.json({
      ok: true,
      env,
      runtimeNode,
      sanitize,
      connectedDb: mongoose.connection.name,
      readyState: mongoose.connection.readyState,
      tookMs: Date.now() - started,
      counts,
    });
  } catch (err) {
    const e = err as { name?: string; message?: string };
    const message = e?.message ?? String(err);
    return NextResponse.json({
      ok: false,
      env,
      runtimeNode,
      sanitize,
      tookMs: Date.now() - started,
      errorName: e?.name ?? "Error",
      // 비밀번호가 섞여 들어가지 않도록 자격 증명 부분을 지운다
      error: message.replace(/\/\/[^@]+@/g, "//***@").slice(0, 400),
      hint: /ServerSelection|ETIMEDOUT|ENOTFOUND/i.test(message)
        ? "Atlas → Network Access 에 0.0.0.0/0 이 있는지, 클러스터가 Paused 는 아닌지 확인하세요."
        : /Authentication failed|bad auth/i.test(message)
          ? "사용자 이름·비밀번호를 확인하세요. 비밀번호에 @ : / 같은 문자가 있으면 URL 인코딩이 필요합니다."
          : null,
    });
  }
}
