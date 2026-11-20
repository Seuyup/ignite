import { timingSafeEqual } from "node:crypto";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health — 사이트 점검 앱(Site Check)이 부르는 공개 상태 확인.
 * 규격: C:\Dev\site-check\HEALTH-SPEC.md
 *
 * 조회 함수가 실패를 삼켜서 DB 가 죽어도 화면은 200 으로 뜬다(볼트 Ignite.md
 * 「실패가 보이지 않는 구조」). 그래서 밖에서 보는 상태 코드만으로는 못 잡는 것을 여기서 본다.
 *
 *   db        연결 + ping. 죽으면 목록이 통째로 비므로 사이트 전체를 down 으로 본다
 *   sanitize  `sanitizeRichHtml` import — 2026-10-01 세 라우트 500 의 원인 자리
 *   env       필요한 환경 변수가 다 있는지 — 2026-09-28 이관 때 통째로 비어 있었다
 *
 * 누구나 `status` 와 항목별 `status` 는 본다. 오류 메시지 · 빠진 변수 이름은
 * `Authorization: Bearer <HEALTH_TOKEN>` 이 맞을 때만 준다. 값은 어떤 경우에도 내보내지 않는다.
 * 상세가 필요하면 관리자 `/api/admin/health/db` 를 본다.
 */

type Check = { status: "ok" | "down"; ms?: number; message?: string };

const PROBE_TIMEOUT_MS = 5000;
const REQUIRED_ENV = [
  "MONGODB_URI",
  "ADMIN_PASSWORD",
  "ADMIN_SECRET",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_BASE_URL",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
  "CONTACT_TO_EMAIL",
];
/** 이게 죽으면 사이트가 떠 있어도 쓸 수 없다 — 전체를 down 으로 */
const CRITICAL = new Set(["db"]);

async function probe(fn: () => Promise<unknown>): Promise<Check> {
  const started = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      fn(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${PROBE_TIMEOUT_MS / 1000}초 안에 응답 없음`)), PROBE_TIMEOUT_MS);
      }),
    ]);
    return { status: "ok", ms: Date.now() - started };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // 접속 문자열이 섞여 들어가지 않게 자격 증명 부분을 지운다
    return { status: "down", ms: Date.now() - started, message: message.replace(/\/\/[^@]+@/g, "//***@").slice(0, 200) };
  } finally {
    clearTimeout(timer);
  }
}

function authorized(req: Request): boolean {
  const token = process.env.HEALTH_TOKEN;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !given) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  const checks: Record<string, Check> = {
    db: await probe(async () => {
      await connectDB();
      await mongoose.connection.db!.command({ ping: 1 });
    }),
    sanitize: await probe(async () => {
      const mod = await import("@/lib/sanitize-html");
      const out = mod.sanitizeRichHtml('<p onclick="x">ok</p>');
      if (!out.includes("ok") || out.includes("onclick")) throw new Error("정제 결과가 이상함");
    }),
    env: missing.length ? { status: "down", message: `없음: ${missing.join(", ")}` } : { status: "ok" },
  };

  const entries = Object.entries(checks);
  const status = entries.some(([k, c]) => CRITICAL.has(k) && c.status !== "ok")
    ? "down"
    : entries.every(([, c]) => c.status === "ok")
      ? "ok"
      : "degraded";

  const detail = authorized(req);
  return NextResponse.json(
    {
      status,
      service: "ignite",
      version: (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 7),
      time: new Date().toISOString(),
      checks: detail
        ? checks
        : Object.fromEntries(entries.map(([k, c]) => [k, { status: c.status }])),
    },
    { status: status === "down" ? 503 : 200, headers: { "cache-control": "no-store" } },
  );
}
