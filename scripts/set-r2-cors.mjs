/**
 * R2 버킷 CORS 설정 — 브라우저에서 R2로 직접 PUT(사전 서명 업로드) 하려면 필수.
 * 실행: npm run r2:cors
 *
 * 허용 Origin을 바꾸려면 ORIGINS 배열을 수정한다.
 * (Vercel 프리뷰 배포 도메인은 매번 달라지므로 필요할 때 추가할 것)
 */
import {
  S3Client,
  PutBucketCorsCommand,
  GetBucketCorsCommand,
} from "@aws-sdk/client-s3";

const ORIGINS = [
  "http://localhost:3000",
  "https://localhost:3000",
  "https://www.ignitearch.co.kr",
  "https://ignitearch.co.kr",
];

const bucket = process.env.R2_BUCKET_NAME;
const accountId = process.env.R2_ACCOUNT_ID;
if (!bucket || !accountId) {
  throw new Error("R2_BUCKET_NAME / R2_ACCOUNT_ID 환경 변수가 필요합니다.");
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const RULES = [
  {
    AllowedOrigins: ORIGINS,
    AllowedMethods: ["PUT", "GET", "HEAD"],
    AllowedHeaders: ["*"],
    ExposeHeaders: ["ETag"],
    MaxAgeSeconds: 3600,
  },
];

try {
  await s3.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: { CORSRules: RULES },
    }),
  );
  const current = await s3.send(new GetBucketCorsCommand({ Bucket: bucket }));
  console.log(`[r2:cors] ${bucket} 적용 완료`);
  console.log(JSON.stringify(current.CORSRules, null, 2));
} catch (e) {
  if (e.name === "AccessDenied" || e.$metadata?.httpStatusCode === 403) {
    console.error(
      `[r2:cors] 권한 없음 — 현재 R2 API 토큰이 오브젝트 읽기/쓰기 전용이라 버킷 설정을 바꿀 수 없습니다.\n` +
        `해결 (둘 중 하나):\n` +
        `  1) Cloudflare 대시보드 → R2 → ${bucket} → Settings → CORS Policy 에 아래 JSON 붙여넣기\n` +
        `  2) "Admin Read & Write" 권한의 R2 API 토큰으로 교체 후 재실행\n`,
    );
    console.error(JSON.stringify(RULES, null, 2));
    process.exit(1);
  }
  throw e;
}
