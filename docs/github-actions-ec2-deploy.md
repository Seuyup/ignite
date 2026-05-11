# GitHub Actions → EC2 배포 가이드

Amazon Linux 2023, 사용자 `ec2-user`, PM2로 `next start` 하는 경우를 기준으로 합니다.

## 사전 준비 (EC2에서 한 번)

### 1. 패키지

```bash
sudo dnf update -y
sudo dnf install -y git
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs
sudo npm i -g pm2
```

### 2. 앱 디렉터리 & Git（필수）

워크플로는 **`git fetch` / `git reset`** 으로 배포합니다. 서버 경로(기본 `/home/ec2-user/ignite`)는 **반드시 `git clone` 한 저장소 루트**여야 합니다.  
(zip 업로드만 해 두거나 빈 폴더면 `fatal: not a git repository` 가 납니다.

```bash
cd ~
git clone https://github.com/<조직>/<저장소>.git ignite
cd ~/ignite
```

이미 `ignite` 폴더에 파일만 있고 `.git` 이 없다면 **`.env.production` 등 백업 후** 폴더를 비우거나 이름을 바꾼 다음 위처럼 `clone` 하세요.

SSH clone(Deploy key)을 쓰는 경우:

```bash
git clone git@github.com:<조직>/<저장소>.git ignite
```

**Private 저장소**라면 EC2에 [Deploy key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys#deploy-keys)를 등록하거나, Actions에서 `rsync`로 파일만 보내는 방식을 쓰세요.

### 3. 환경 변수

서버에만 존재하게:

```bash
nano ~/ignite/.env.production
# MONGODB_URI, ADMIN_*, R2_* 등 입력 후 저장
chmod 600 ~/ignite/.env.production
```

### 4. 첫 빌드 & PM2

```bash
cd ~/ignite
npm ci
npm run build
pm2 start npm --name ignite -- start
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
```

### 5. 보안 그룹

EC2 콘솔 → 인스턴스 → 보안 그룹 → **인바운드 규칙**에 최소한:

| 유형 | 포트 | 소스 |
|------|------|------|
| SSH | 22 | 내 IP만 (또는 GitHub Actions IP — 유지보수 부담 큼) |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

GitHub Hosted Runner IP는 매번 바뀌므로, **22를 전 세계에 열어두면 위험**합니다. 권장:

- **Self-hosted runner**를 EC2에 두고 같은 머신에서 배포, 또는  
- **SSM Run Command**로 배포(SSH 22 닫기), 또는  
- 22는 **본인 IP만** 허용하고, 배포는 **수동 SSH + 스크립트** / **self-hosted**로 처리  

이 문서의 예시 워크플로는 **SSH(22)** 를 사용합니다. 운영 정책에 맞게 조정하세요.

### 6. Elastic IP (권장)

퍼블릭 IP가 바뀌면 DNS·GitHub Secrets를 매번 고쳐야 하므로 **Elastic IP**를 연결해 고정합니다.

---

## GitHub 저장소 설정

### Secrets

**Settings → Secrets and variables → Actions → New repository secret**

| 이름 | 값 예시 |
|------|---------|
| `EC2_HOST` | Elastic IP 또는 도메인 (예: `3.xx.xx.xx`) |
| `EC2_USER` | `ec2-user` |
| `EC2_SSH_KEY` | 로컬에서 쓰는 `.pem` 파일 **전체 내용** (BEGIN~END 줄 포함) |

`EC2_SSH_KEY` 복사 시 **앞뒤 공백 없이** 넣고, 저장 후 Actions 로그에 키가 노출되지 않게 주의하세요.

### 브랜치

워크플로는 기본으로 **`main`** 에 `push` 될 때 동작합니다. `master` 등이면 YAML의 `branches`를 바꾸세요.

---

## 배포 스크립트 (서버)

저장소에 `scripts/deploy-remote.sh` 가 있다면 Actions가 SSH로 이 파일을 실행합니다.  
없으면 워크플로 안에 **인라인 스크립트**를 두어도 됩니다 (현재 예시는 인라인).

서버에서 실행되는 내용 요지:

1. `cd ~/ignite` (또는 `DEPLOY_PATH` 환경 변수)
2. `git pull` (또는 `fetch` + `reset --hard origin/main`)
3. `npm ci`
4. `npm run build`
5. `pm2 reload ignite` (없으면 `pm2 start ...`)

---

## 트러블슈팅

- **`dial tcp …:22: i/o timeout`**: 보안 그룹에서 SSH(22) 인바운드가 막힘. GitHub Actions용으로 잠시 소스 `0.0.0.0/0` 허용 여부 확인.
- **`fatal: not a git repository`**: 배포 경로가 **git clone 루트가 아님**. 위「앱 디렉터리 & Git」대로 `ignite`에 clone. 워크플로의 `DEPLOY_PATH`가 실제 clone 경로와 같은지 확인 (`/home/ec2-user/ignite`).
- **`Host key verification failed`**: 첫 SSH 시 known_hosts 필요. 워크플로에서 `ssh-keyscan` 사용(예시 포함).
- **`Permission denied (publickey)`**: Secrets의 키·사용자명·호스트 오타, 또는 인스턴스에 붙인 키 페어가 다른 경우.
- **`npm run build` OOM**: t3.micro는 빌드 메모리 부족할 수 있음 → 인스턴스 타입 상향 또는 GitHub에서 빌드 후 아티팩트만 scp.
- **`.env.production`**: 저장소에 넣지 말고 서버에만 유지.

---

## 관련 파일

- `.github/workflows/deploy-ec2.yml` — 예시 워크플로

배포 후 **Nginx 리버스 프록시 + certbot(HTTPS)** 는 서버에서 별도로 구성하면 됩니다. (80/443 → localhost:3000)
