import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_UPLOAD_ALLOWED_TYPES,
  ADMIN_UPLOAD_EXT,
  ADMIN_UPLOAD_MAX_BYTES,
  ADMIN_UPLOAD_MAX_LABEL,
} from "@/lib/admin-upload";
import { verifyAdminToken } from "@/lib/admin-session";
import { presignPutUrl, readR2Config } from "@/lib/r2";

/**
 * 관리자 이미지 업로드용 사전 서명 URL 발급.
 * 파일 본문은 함수를 거치지 않고 브라우저에서 R2로 직접 PUT 된다.
 * (서버 경유 시 Vercel Functions의 요청 본문 4.5MB 제한에 걸린다)
 */
export const runtime = "nodejs";

function safeKeySegment(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return base || "image";
}

export async function POST(request: Request) {
  const token = (await cookies()).get("admin_token")?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const config = readR2Config();
  if (!config) {
    return NextResponse.json(
      {
        error:
          "R2 환경 변수가 설정되지 않았습니다. docs/cloudflare-r2.md 를 참고하세요.",
      },
      { status: 503 },
    );
  }

  let body: { filename?: string; contentType?: string; size?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const contentType = (body.contentType ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (!(ADMIN_UPLOAD_ALLOWED_TYPES as readonly string[]).includes(contentType)) {
    return NextResponse.json(
      { error: `지원하지 않는 형식입니다: ${contentType || "알 수 없음"}` },
      { status: 400 },
    );
  }

  const size = Number(body.size);
  if (!Number.isInteger(size) || size <= 0) {
    return NextResponse.json(
      { error: "파일 크기가 올바르지 않습니다." },
      { status: 400 },
    );
  }
  if (size > ADMIN_UPLOAD_MAX_BYTES) {
    return NextResponse.json(
      { error: `파일 크기는 ${ADMIN_UPLOAD_MAX_LABEL} 이하여야 합니다.` },
      { status: 400 },
    );
  }

  const ext = ADMIN_UPLOAD_EXT[contentType] ?? "bin";
  const stem = safeKeySegment(
    (body.filename ?? "image").replace(/\.[^/.]+$/i, "") || "image",
  );
  const key = `projects/${Date.now()}-${stem}.${ext}`;

  try {
    const signed = await presignPutUrl({ config, key, contentType, contentLength: size });
    return NextResponse.json(signed);
  } catch (e) {
    console.error("[admin/upload/sign] presign", e);
    return NextResponse.json(
      { error: "업로드 URL 발급에 실패했습니다. R2 설정을 확인해 주세요." },
      { status: 502 },
    );
  }
}
