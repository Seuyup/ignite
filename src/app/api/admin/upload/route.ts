import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_UPLOAD_MAX_BYTES } from "@/lib/admin-upload";
import { verifyAdminToken } from "@/lib/admin-session";
import { optimizeAdminUploadImage } from "@/lib/optimize-upload-image";

function safeKeySegment(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return base || "image";
}

export async function POST(request: Request) {
  const token = (await cookies()).get("admin_token")?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBase = process.env.R2_PUBLIC_BASE_URL;

  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucket ||
    !publicBase
  ) {
    return NextResponse.json(
      {
        error:
          "R2 환경 변수가 설정되지 않았습니다. docs/cloudflare-r2.md 를 참고하세요.",
      },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (e) {
    console.error("[admin/upload] formData", e);
    return NextResponse.json(
      {
        error:
          "요청 본문을 읽는 중 오류가 발생했습니다. 파일이 너무 크거나 연결이 끊겼을 수 있습니다.",
      },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  if (file.size > ADMIN_UPLOAD_MAX_BYTES) {
    return NextResponse.json(
      { error: `파일 크기는 ${ADMIN_UPLOAD_MAX_BYTES / (1024 * 1024)}MB 이하여야 합니다.` },
      { status: 400 },
    );
  }

  let buf: Buffer;
  try {
    buf = Buffer.from(await file.arrayBuffer());
  } catch (e) {
    console.error("[admin/upload] arrayBuffer", e);
    return NextResponse.json(
      { error: "파일 데이터를 읽는 중 오류가 발생했습니다." },
      { status: 400 },
    );
  }

  const declaredType = (file.type || "application/octet-stream").split(";")[0]?.trim() ?? "";
  const optimized = await optimizeAdminUploadImage(buf, declaredType);
  let body: Buffer = buf;
  let contentType = declaredType || "application/octet-stream";
  let objectKey: string;
  if (optimized) {
    body = optimized.buffer;
    contentType = optimized.mime;
    const stem = safeKeySegment(
      file.name.replace(/\.[^/.]+$/i, "") || "image",
    );
    objectKey = `projects/${Date.now()}-${stem}.${optimized.extension}`;
  } else {
    objectKey = `projects/${Date.now()}-${safeKeySegment(file.name)}`;
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: body,
        ContentType: contentType || "application/octet-stream",
      }),
    );
  } catch (e) {
    console.error("[admin/upload] PutObject", e);
    let message = "스토리지 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.";
    if (e instanceof Error) {
      const m = e.message;
      if (/timeout|ETIMEDOUT|Timeout/i.test(m)) {
        message =
          "스토리지 응답 시간이 초과되었습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.";
      } else if (/ENOTFOUND|ECONNREFUSED|ECONNRESET|EAI_AGAIN/i.test(m)) {
        message =
          "스토리지 서버에 연결할 수 없습니다. R2 엔드포인트·방화벽·환경 변수를 확인해 주세요.";
      } else if (/AccessDenied|403|not authorized/i.test(m)) {
        message =
          "스토리지 접근이 거부되었습니다. R2 API 토큰 권한과 버킷 이름을 확인해 주세요.";
      }
    }
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const base = publicBase.replace(/\/$/, "");
  const url = `${base}/${objectKey}`;

  return NextResponse.json({ url });
}
