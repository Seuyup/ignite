# MongoDB 연결 가이드 (ignite)

이 프로젝트는 **MongoDB**에 프로젝트 목록·연락처 본문을 저장합니다. 공개 페이지는 DB에 데이터가 없거나 연결에 실패하면 `src/lib/projects.ts`의 정적 샘플 데이터를 그대로 사용합니다.

## 1. 준비할 것

- MongoDB 인스턴스  
  - 로컬: [MongoDB Community Server](https://www.mongodb.com/try/download/community) 설치 후 기본 포트 `27017`  
  - 클라우드: [MongoDB Atlas](https://www.mongodb.com/atlas) 무료 클러스터 생성
- 이 저장소 루트에 `.env.local` 파일 (Git에 올리지 않음)

## 2. 연결 문자열 (`MONGODB_URI`)

프로젝트 루트에 `.env.local`을 만들고 다음 형식으로 설정합니다.

### 로컬 예시

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/ignite
```

데이터베이스 이름 `ignite`는 원하면 다른 이름으로 바꿔도 됩니다.

### Atlas 예시

Atlas → Database → Connect → Drivers 에서 제공하는 URI를 복사하고, 사용자 이름·비밀번호 자리를 채웁니다.

```bash
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/ignite?retryWrites=true&w=majority
```

**Atlas 사용 시**

- Network Access에서 현재 개발 PC의 IP(또는 임시로 `0.0.0.0/0`) 허용
- Database Access에서 읽기/쓰기 가능한 사용자 생성

## 3. 관리자 환경 변수

관리자 화면(`/admin/login`)과 쿠키 세션에 필요합니다. `.env.example`을 참고해 같은 파일(`.env.local`)에 넣습니다.

| 변수 | 설명 |
|------|------|
| `ADMIN_PASSWORD` | 로그인 폼에 입력하는 비밀번호 |
| `ADMIN_SECRET` | 쿠키 서명용 긴 임의 문자열 (유출되지 않게 관리) |

개발 서버를 한 번 재시작해야 적용됩니다.

## 4. 확인 방법

1. `.env.local` 저장 후 `npm run dev` 실행  
2. 브라우저에서 `/admin/login` 접속 → 로그인  
3. `/admin/projects/add`에서 프로젝트 추가 → 홈·`/projects/{slug}`에서 반영 여부 확인  
4. `/admin/contact`에서 연락처 본문 저장 → `/contact`에서 확인  

## 5. 라우팅 구조 (관리자)

URL은 유지하면서 폴더만 정리하기 위해 **Route Groups** `(panel)`을 사용했습니다.

| URL | 역할 |
|-----|------|
| `/admin/login` | 로그인 |
| `/admin/projects/add` | 프로젝트 추가 |
| `/admin/contact` | 연락처 편집 |

추후 `admin/projects/list`, `admin/projects/[slug]/edit` 같은 경로는 `src/app/admin/(panel)/projects/` 아래에 페이지만 추가하면 같은 레이아웃·인증을 공유할 수 있습니다.

## 6. 트러블슈팅

### `querySrv ECONNREFUSED` / `ENOTFOUND` (SRV·DNS)

`mongodb+srv://` 는 연결 전에 **`_mongodb._tcp....` DNS(SRV) 조회**를 합니다. 회사망·일부 VPN·DNS 설정에서는 이 조회가 **거절·실패**하면서 위와 같은 오류가 납니다. **연결 정보와 비밀번호는 맞는데도** 여기서만 막히는 경우가 많습니다.

**해결 A — Atlas에서 표준 URI 사용 (권장, SRV 없음)**

1. [Atlas](https://cloud.mongodb.com/) → **Database** → 클러스터 **Connect**
2. **Drivers** / **Connect your application** 선택 (라벨은 UI에 따라 다를 수 있음)
3. 연결 문자열 형식 중 **`mongodb://` 로 시작하는 문자열**(호스트가 `cluster0-shard-00-00....mongodb.net:27017` 처럼 **포트까지 나오는 형태**)을 선택합니다.  
   - UI에 **「SRV 연결 문자열」 / 「표준 연결 문자열」** 토글이 있으면 **표준(standard)** 을 고릅니다.
4. 복사한 문자열에서 `USER`, `PASSWORD` 자리를 채우고, 끝에 데이터베이스 이름·쿼리가 없으면 `/ignite?retryWrites=true&w=majority` 등을 붙입니다.
5. `.env.local` 의 **`MONGODB_URI` 전체를 이 `mongodb://...` 한 줄로 교체**하고 개발 서버를 재시작합니다.

표준 URI 예시(형식만 참고, 호스트·개수는 클러스터마다 다름):

```bash
MONGODB_URI=mongodb://USER:PASSWORD@cluster0-shard-00-00.xxxxx.mongodb.net:27017,cluster0-shard-00-01.xxxxx.mongodb.net:27017,cluster0-shard-00-02.xxxxx.mongodb.net:27017/ignite?ssl=true&authSource=admin
```

Atlas가 안내하는 **쿼리 파라미터(`ssl`/`tls`, `replicaSet`, `authSource` 등)** 는 복사본 그대로 두는 것이 안전합니다.

**해결 B — 네트워크·DNS**

- PC DNS를 **8.8.8.8 / 1.1.1.1** 등으로 바꿔 보기  
- **VPN 끄기** 또는 다른 네트워크에서 시도  
- Atlas **Network Access**에 현재 공인 IP(또는 개발용으로만 `0.0.0.0/0`) 허용

### `bad auth` / `Authentication failed`

**아이디·비밀번호가 틀렸거나**, URI에 비밀번호를 **잘못 붙인 경우**입니다(네트워크 문제가 아닙니다).

1. Atlas → **Database Access**에서 쓰는 **Database User** 이름이 URI의 `USER`와 같은지 확인합니다. (Atlas **로그인용 이메일**과 다를 수 있습니다.)
2. **비밀번호**를 맞게 넣었는지 확인합니다. 잊었으면 사용자에서 **Edit** → **Edit Password** 로 새 비밀번호를 만든 뒤 URI를 갱신합니다.
3. 비밀번호에 `@ : / ? # %` 등이 있으면 URI 한 줄 안에서는 **URL 인코딩**이 필요합니다. 수작업보다 Atlas → **Connect** → **Drivers**에서 받은 문자열에서 `<password>` 자리만 교체하는 편이 안전합니다.
4. 사용자 권한이 **Read and write to any database** 또는 해당 DB에 **readWrite** 인지 확인합니다.

---

- **`MONGODB_URI` 관련 오류 (일반)**  
  문자열 오타, Atlas IP 허용, 사용자 비밀번호(URL 인코딩 필요 시 특수문자)를 확인하세요.
- **로그인 후 바로 로그인 페이지로 돌아감**  
  `ADMIN_SECRET`이 비어 있거나, 로그인 전후로 값이 바뀌지 않았는지 확인하세요.
- **빌드·CI에서 DB 없음**  
  공개 페이지는 연결 실패 시 정적 프로젝트 목록으로 동작합니다. 관리자·쓰기 기능은 `MONGODB_URI`가 필요합니다.
