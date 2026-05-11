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
- 파일 크기 제한은 약 **10MB**입니다 (코드 상 `MAX_BYTES`).
- 버킷을 완전히 비공개로 두고 싶다면 **서명 URL** 방식으로 바꿔야 하며, 현재 구현은 **공개 읽기 가능한 베이스 URL**을 전제로 합니다.

## 7. 문제 해결

| 증상 | 확인 |
|------|------|
| 503 + 환경 변수 오류 | 위 다섯 가지 `R2_*` 변수가 모두 채워졌는지 |
| 업로드는 되는데 이미지가 안 보임 | `R2_PUBLIC_BASE_URL`이 버킷의 공개 접근 방식과 일치하는지, 객체 경로가 브라우저에서 열리는지 |
| 401 | 관리자 로그인 후 같은 브라우저에서 업로드하는지 (쿠키 전송) |
| CORS | 같은 출처(`/api/admin/upload`)로 업로드하므로 일반적으로 추가 CORS 설정 불필요 |

자세한 최신 UI 이름은 [Cloudflare R2 문서](https://developers.cloudflare.com/r2/)를 참고하세요.
