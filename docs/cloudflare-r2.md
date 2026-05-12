# Cloudflare R2 연결 가이드 (이미지 업로드)

이 프로젝트는 관리자 화면에서 **이미지 파일을 Cloudflare R2**에 올리고, 반환된 **공개 URL**을 본문(Tiptap)에 넣습니다. R2는 **S3 호환 API**를 제공하므로 `@aws-sdk/client-s3`로 업로드합니다.

## 1. R2 버킷 만들기

1. [Cloudflare 대시보드](https://dash.cloudflare.com/) → **R2** → **Create bucket**
2. 버킷 이름을 정합니다 (예: `ignite-assets`). 이 이름을 `.env`의 `R2_BUCKET_NAME`에 넣습니다.

## 2. Account ID

R2 개요 페이지 상단에 **Account ID**가 표시됩니다. 이 값을 `R2_ACCOUNT_ID`에 넣습니다.

## 3. API 자격 증명 (Access Key)

1. R2 → **Manage R2 API Tokens** (또는 **Overview**의 API 섹션)
2. **Create API token** → 권한은 해당 버킷에 대해 **Object Read & Write** 이상
3. 생성 후 표시되는 **Access Key ID** / **Secret Access Key**를 각각 `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`에 저장합니다.  
   **Secret은 한 번만 표시**되므로 안전한 곳에 보관하세요.

## 4. 공개 URL (`R2_PUBLIC_BASE_URL`)

브라우저에서 이미지를 불러오려면 객체에 접근할 수 있는 **공개 베이스 URL**이 필요합니다. 다음 중 하나를 선택합니다.

### A) R2 개발용 도메인 (빠른 테스트)

1. 버킷 → **Settings** → **Public access** 관련 메뉴에서 **R2.dev subdomain** 활성화 (UI는 Cloudflare 업데이트에 따라 다를 수 있음)
2. 제공되는 형태 예: `https://pub-xxxx.r2.dev`  
   → `.env`의 `R2_PUBLIC_BASE_URL`은 **슬래시 없이** 위 주소만 넣습니다.  
   업로드된 객체 URL은 `https://pub-xxxx.r2.dev/projects/타임스탬프-파일명` 형식이 됩니다.

### B) 커스텀 도메인 (운영 권장)

1. R2 버킷에 **Custom Domain**을 연결 (DNS가 Cloudflare에 있으면 마법사대로 진행)
2. 예: `https://cdn.example.com` → `R2_PUBLIC_BASE_URL=https://cdn.example.com`

앱은 업로드 후 다음처럼 URL을 만듭니다.

```text
{R2_PUBLIC_BASE_URL}/projects/{타임스탬프}-{안전한파일명}
```

## 5. `.env.local` 예시

```bash
R2_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=ignite-assets
R2_PUBLIC_BASE_URL=https://pub-xxxx.r2.dev
```

개발 서버를 **재시작**한 뒤 `/admin/projects/add`에서 **이미지** 버튼으로 업로드를 시험합니다.

## 6. 동작과 보안

- `POST /api/admin/upload`는 **관리자 쿠키**가 있을 때만 업로드를 허용합니다.
- 파일 크기 제한은 **30MB**입니다 (`ADMIN_UPLOAD_MAX_BYTES`).
- **JPEG / PNG / WebP** 업로드 시 서버에서 [sharp](https://sharp.pixelplumbing.com/)로 **긴 변 최대 2400px** 안으로 맞춘 뒤, **원본 파일보다 바이트가 줄어들 때만** 압축본을 R2에 저장합니다. (재인코딩만 하면 커지는 경우가 있어, 그때는 **원본 그대로** 둡니다.) 알파가 없는 PNG는 JPEG 후보로 비교합니다.
- 버킷을 완전히 비공개로 두고 싶다면 **서명 URL** 방식으로 바꿔야 하며, 현재 구현은 **공개 읽기 가능한 베이스 URL**을 전제로 합니다.

## 6-1. 화면에서 로딩을 줄이는 방법 (이 프로젝트)

1. **업로드 시 줄이기** — 위 sharp 처리로 저장 용량·픽셀 수가 줄어듭니다. **이미 올라간 예전 파일**은 DB·R2 URL이 그대로이므로, 필요하면 관리자에서 **다시 업로드**하면 새 정책이 적용됩니다.
2. **표시 시 줄이기** — 프로젝트 **대표 이미지** 등은 `R2_PUBLIC_BASE_URL` 아래 주소일 때 [next/image](https://nextjs.org/docs/app/api-reference/components/image)로 **WebP/AVIF·`sizes`에 맞는 해상도**를 내려받습니다. `next.config.ts`의 `images.remotePatterns`는 빌드 시점의 `R2_PUBLIC_BASE_URL` 호스트를 사용하므로, **EC2에서 `npm run build` 할 때** `.env.production`에 동일 값이 있어야 합니다.
3. **본문 HTML 안의 `<img>`** — Tiptap에 넣은 이미지는 그대로 `<img src="R2 URL">`로 렌더링됩니다. 용량을 줄이려면 **에디터에서 이미지를 다시 올리거나** URL을 바꾸는 방식이 필요합니다.

### Cloudflare만으로 할 수 있는 것

- **R2 공개 URL을 브라우저가 직접** 열 때(예: `*.r2.dev`)는 트래픽이 **사이트 도메인을 거치지 않아** 대시보드의 **Polish**가 적용되지 않는 경우가 많습니다.
- **커스텀 도메인을 Cloudflare에 프록시(주황 구름)** 하고 R2/Workers로 연결한 뒤 그 도메인으로 이미지를 제공하면 **Polish** 등을 검토할 수 있습니다. (유료·설정 난이도에 따라 [Cloudflare Images](https://developers.cloudflare.com/images/)도 선택지입니다.)

## 7. 문제 해결

| 증상 | 확인 |
|------|------|
| 503 + 환경 변수 오류 | 위 다섯 가지 `R2_*` 변수가 모두 채워졌는지 |
| 업로드는 되는데 이미지가 안 보임 | `R2_PUBLIC_BASE_URL`이 버킷의 공개 접근 방식과 일치하는지, 객체 경로가 브라우저에서 열리는지 |
| 401 | 관리자 로그인 후 같은 브라우저에서 업로드하는지 (쿠키 전송) |
| CORS | 같은 출처(`/api/admin/upload`)로 업로드하므로 일반적으로 추가 CORS 설정 불필요 |
| 로컬만 되고 EC2(실서버)에서만 실패, 알림이 **「업로드 중 오류가 발생했습니다.」** | Nginx 기본 `client_max_body_size`가 **1MB**인 경우가 많아, 큰 이미지는 **413 HTML**을 돌려 JSON 파싱이 실패함. `server { ... }` 안에 `client_max_body_size 35m;` 이상 추가 후 `sudo nginx -t && sudo systemctl reload nginx` |

자세한 최신 UI 이름은 [Cloudflare R2 문서](https://developers.cloudflare.com/r2/)를 참고하세요.
