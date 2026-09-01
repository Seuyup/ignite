import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ADMIN_UPLOAD_CACHE_CONTROL } from "@/lib/admin-upload";

/**
 * Cloudflare R2 (S3 호환) 클라이언트.
 * env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *      R2_BUCKET_NAME, R2_PUBLIC_BASE_URL
 */

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBase: string;
};

/** 환경 변수가 모두 있으면 설정을, 하나라도 없으면 null을 반환한다. */
export function readR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBase = process.env.R2_PUBLIC_BASE_URL;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBase) {
    return null;
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, publicBase };
}

let client: S3Client | null = null;

export function getR2Client(config: R2Config): S3Client {
  if (client) return client;
  client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    // SDK v3의 기본 CRC32 체크섬은 사전 서명 URL에 "빈 본문" 체크섬을 넣어
    // 실제 파일 업로드를 R2가 거부하게 만든다. 필요할 때만 계산하도록 끈다.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return client;
}

export function r2PublicUrl(config: R2Config, key: string): string {
  return `${config.publicBase.replace(/\/$/, "")}/${key}`;
}

/**
 * 브라우저가 R2로 직접 PUT 할 수 있는 사전 서명 URL 발급.
 * Vercel Functions의 요청 본문 4.5MB 제한을 우회하는 경로.
 * ContentLength가 서명에 포함되므로 신고한 크기와 실제 파일 크기가 달라지면 거부된다.
 */
export async function presignPutUrl(params: {
  config: R2Config;
  key: string;
  contentType: string;
  contentLength: number;
  expiresIn?: number;
}): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const command = new PutObjectCommand({
    Bucket: params.config.bucket,
    Key: params.key,
    ContentType: params.contentType,
    ContentLength: params.contentLength,
    CacheControl: ADMIN_UPLOAD_CACHE_CONTROL,
  });
  const uploadUrl = await getSignedUrl(getR2Client(params.config), command, {
    expiresIn: params.expiresIn ?? 300,
  });
  return {
    uploadUrl,
    key: params.key,
    publicUrl: r2PublicUrl(params.config, params.key),
  };
}
