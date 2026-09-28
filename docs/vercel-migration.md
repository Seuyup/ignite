# AWS(EC2) → Vercel 이관 가이드

작성 2026-09-01. 대상 도메인 `www.ignitearch.co.kr`.

## 이관 전 현황

| 항목 | 값 |
|---|---|
| 웹서버 | EC2 + nginx 1.28.3 + PM2 (`ignite`), 서울 리전 |
| 서버 IP | `3.35.114.6` (Elastic IP) |
| 배포 | GitHub Actions → SSH → `git pull` + `npm ci` + `npm run build` + `pm2 reload` |
| 네임서버 | `ns.gabia.co.kr`, `ns1.gabia.co.kr`, `ns.gabia.net` (가비아) |
| DNS 레코드 | `ignitearch.co.kr` A → `3.35.114.6` / `www` A → `3.35.114.6` |
| MX 레코드 | 없음 (도메인 메일 미사용 → DNS 변경 시 메일 영향 없음) |
| DB | MongoDB Atlas |
| 이미지 | Cloudflare R2 (`pub-018f9b0b7710469496ddc617031f5d52.r2.dev`) |

## 1. 코드 변경 (완료)

- **업로드 경로 전환**: Vercel Functions는 요청 본문이 4.5MB를 넘으면 함수에 닿기 전에
  `FUNCTION_PAYLOAD_TOO_LARGE`로 잘린다. 파일을 서버로 보내지 않고
  `/api/admin/upload/sign`에서 사전 서명 URL만 받아 브라우저 → R2로 직접 PUT 한다.
- **압축 위치 이동**: 서버 `sharp` 압축을 `src/lib/client-image-resize.ts`(canvas)로 이전.
  규칙은 동일(긴 변 2400px, 품질 0.72, 알파 없는 PNG는 JPEG, 원본보다 크면 원본 사용).
- **체크섬 비활성화**: AWS SDK v3의 기본 CRC32는 사전 서명 URL에 "빈 본문" 체크섬을 넣어
  실제 업로드를 R2가 거부한다. `requestChecksumCalculation: "WHEN_REQUIRED"`로 해제.
- **mongoose 서버리스 튜닝**: 프로덕션에서도 전역 커넥션 캐시 사용,
  `maxPoolSize: 5`, `bufferCommands: false`, `serverSelectionTimeoutMS: 20000`.
- **리전 고정**: `vercel.json`에 `"regions": ["icn1"]` (서울). Atlas·사용자와 같은 지역.
- **실행시간 명시**: 레거시 업로드 60초, contact(SMTP) 30초.
- **이미지 호스트 폴백**: `R2_PUBLIC_BASE_URL`은 빌드 타임에 읽히므로, 누락 시에도
  이미지가 전부 깨지지 않도록 `next.config.ts`에 R2 공개 호스트 폴백을 넣었다.
- **EC2 워크플로 중단**: `.github/workflows/deploy-ec2.yml`을 `workflow_dispatch` 전용으로 변경.
  (롤백 시 Actions 탭에서 수동 실행)

## 2. Cloudflare R2 (완료)

버킷 `ignite`에 CORS 적용 — 브라우저 직접 업로드에 필수.

```bash
npm run r2:cors
```

허용 Origin: `http://localhost:3000`, `https://localhost:3000`,
`https://www.ignitearch.co.kr`, `https://ignitearch.co.kr`.
Vercel 프리뷰 도메인에서 업로드를 테스트하려면 `scripts/set-r2-cors.mjs`의
`ORIGINS`에 해당 도메인을 추가하고 다시 실행한다.

## 3. Vercel 프로젝트 설정

1. **Import**: Vercel → Add New → Project → `Seuyup/ignite`
2. **Framework** Next.js 자동 감지, **Node.js Version 22.x** (`.nvmrc`와 일치)
3. **Environment Variables** — Production/Preview 모두 등록:

   ```
   MONGODB_URI
   ADMIN_PASSWORD
   ADMIN_SECRET
   R2_ACCOUNT_ID
   R2_ACCESS_KEY_ID
   R2_SECRET_ACCESS_KEY
   R2_BUCKET_NAME
   R2_PUBLIC_BASE_URL
   SMTP_HOST
   SMTP_PORT
   SMTP_USER
   SMTP_PASS
   CONTACT_TO_EMAIL
   NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
   NEXT_PUBLIC_SITE_URL      # https://www.ignitearch.co.kr
   ```

   `NEXT_PUBLIC_*`와 `R2_PUBLIC_BASE_URL`은 **빌드 타임**에 박히므로 값 변경 시 재배포 필요.
4. **Function Region**: `vercel.json`으로 `icn1` 고정됨. 대시보드에서도 Seoul인지 확인.
5. **MongoDB Atlas** → Network Access에 Vercel 함수의 유동 IP 허용(`0.0.0.0/0`) 추가.
   **EC2 IP(`3.35.114.6`) 항목은 컷오버 완료 후에 제거**한다(롤백 대비).
6. **네이버 지도**: Client ID의 웹 서비스 URL 목록에 Vercel 도메인 추가
   (`https://<project>.vercel.app`). 운영 도메인은 이미 등록되어 있어 그대로 유지.

## 4. DNS 컷오버 (가비아)

네임서버는 가비아 그대로 두고 **A/CNAME 레코드만** 교체한다. AWS Route 53은 사용하지 않으므로
AWS 쪽 DNS 작업은 없다.

**사전 준비**: 가비아 DNS 관리툴에서 `@`, `www` 레코드의 TTL을 600초로 낮추고 1시간 이상 기다린다.

**Vercel에 도메인 등록**: Project → Settings → Domains
- `www.ignitearch.co.kr` 추가 (Primary)
- `ignitearch.co.kr` 추가 → `www`로 리다이렉트 설정

**가비아 DNS 관리툴에서 레코드 교체** — 값은 반드시 **Vercel Domains 탭에 표시된 것**을 사용한다
(계정·프로젝트마다 다르며 Vercel이 값을 변경하기도 한다). 일반적인 형태는 다음과 같다.

| 호스트 | 타입 | 값 | 비고 |
|---|---|---|---|
| `@` | A | Vercel이 안내하는 A 레코드 IP | 기존 `3.35.114.6` 삭제 |
| `www` | CNAME | Vercel이 안내하는 CNAME 호스트 | 기존 A 레코드 삭제 |

가비아는 apex(`@`)에 CNAME을 넣을 수 없으므로 apex는 A 레코드를 사용한다.
`www`는 기존 A 레코드를 지우고 CNAME으로 바꾼다(A와 CNAME 공존 불가).

**확인**:

```bash
nslookup -type=A ignitearch.co.kr 8.8.8.8
nslookup -type=CNAME www.ignitearch.co.kr 8.8.8.8
curl -sSI https://www.ignitearch.co.kr/ | head -5   # Server 헤더가 nginx가 아니면 전환 완료
```

Vercel이 도메인 검증 후 인증서를 자동 발급한다(보통 수 분).

## 5. 컷오버 후 검증

- [ ] 메인/프로젝트 목록/상세/individual(`/p/[slug]`)/스튜디오/컨택트 렌더링
- [ ] R2 이미지 표시 및 `next/image` 최적화
- [ ] 관리자 로그인 → 대용량 이미지 업로드 → 프로젝트 저장 → 순서 변경 → 휴지통
- [ ] 문의 폼 메일 수신 (SMTP는 Vercel에서 첫 검증)
- [ ] OG 태그의 도메인이 `www.ignitearch.co.kr`인지
- [ ] 네이버 지도 정상 로드

## 5-1. 배포는 됐는데 데이터가 안 보일 때

조회 함수는 실패를 삼키고 빈 배열을 돌려준다. 그래서 화면만 보면
**"데이터가 없는 것"과 "DB에 못 붙은 것"이 똑같아 보인다.** 순서대로 확인한다.

1. **관리자로 로그인**한 뒤 `/api/admin/health/db` 를 연다.
   (관리자 로그인은 `ADMIN_SECRET` HMAC이라 DB가 죽어 있어도 통과한다)

   ```jsonc
   { "ok": true, "connectedDb": "ignite", "counts": { "list": 15, "menu": 8, … } }
   ```

   | 응답 | 원인과 조치 |
   |---|---|
   | `env.MONGODB_URI: false` | 변수가 없다. Vercel에 넣고 **재배포**한다 |
   | `env.dbInUri: null` | URI 끝에 `/ignite` 가 없다. DB 이름이 없으면 `test` 에 붙어 **연결은 되는데 비어 있다** |
   | `errorName: "MongoServerSelectionError"` | Atlas → Network Access 에 `0.0.0.0/0`, 클러스터 Paused 여부 |
   | `Authentication failed` | 사용자/비밀번호. 비밀번호의 `@ : / ?` 는 URL 인코딩해야 한다 |
   | `ok: true` 인데 `counts` 가 0 | 다른 클러스터를 보고 있다. 로컬과 같은 클러스터인지 확인 |

2. **Vercel → 프로젝트 → Logs** 에서 `[db]` 로 시작하는 줄을 본다.
   어느 함수에서 무슨 오류가 났는지 그대로 남는다.

> **환경 변수는 배포 시점에 스냅샷된다.** 값을 추가·수정한 뒤에는 반드시 재배포해야
> 반영된다. 이미 떠 있는 배포는 예전 값을 그대로 들고 있다.

> 로컬 `.env.local` 은 표준 URI(`mongodb://` + 샤드 3개)를 쓸 수 있지만,
> **Vercel에는 `mongodb+srv://` 를 넣는다.** Atlas가 클러스터를 옮기면
> 샤드 호스트명이 바뀌어 표준 URI는 조용히 끊긴다.

## 6. AWS 정리 (컷오버 1~2주 후)

롤백 여지를 남기기 위해 **바로 삭제하지 않는다**. 트래픽이 완전히 넘어온 것을 확인한 뒤:

- [ ] EC2 인스턴스 중지 → 이상 없으면 종료
- [ ] **Elastic IP `3.35.114.6` 해제(Release)** — 인스턴스 종료 후 붙잡고 있으면 계속 과금된다
- [ ] EBS 볼륨/스냅샷 정리
- [ ] 보안 그룹 정리
- [ ] MongoDB Atlas Network Access에서 EC2 IP 항목 제거
- [ ] GitHub Secrets `EC2_HOST` / `EC2_USER` / `EC2_SSH_KEY` 삭제
- [ ] `.github/workflows/deploy-ec2.yml` 파일 삭제 (롤백 필요 없다고 판단되면)
- [ ] 레거시 업로드 라우트(`/api/admin/upload`)와 `sharp` 의존성 제거 검토

## 롤백

DNS 레코드를 `@`/`www` A → `3.35.114.6`으로 되돌린다(TTL 600초면 10분 내 복구).
EC2 인스턴스가 살아 있어야 하므로 위 정리 작업은 충분히 관찰한 뒤 진행한다.
