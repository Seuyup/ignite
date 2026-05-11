import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin-session";

const MAX_BYTES = 10 * 1024 * 1024;

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
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "파일 크기는 10MB 이하여야 합니다." },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const key = `projects/${Date.now()}-${safeKeySegment(file.name)}`;

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
        Key: key,
        Body: buf,
        ContentType: file.type || "application/octet-stream",
      }),
    );
  } catch {
    return NextResponse.json(
      { error: "스토리지 업로드에 실패했습니다." },
      { status: 502 },
    );
  }

  const base = publicBase.replace(/\/$/, "");
  const url = `${base}/${key}`;

  return NextResponse.json({ url });
}
