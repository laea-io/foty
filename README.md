# newapp (임시 이름)

> 2026-11-21 서버 뼈대. 서비스 이름·내용이 정해지면 `newapp`을 한 번에 바꾼다(아래 "이름 바꾸기").

## 구성 한눈에

```
브라우저 ──https──▶ Cloudflare(주황) ──▶ gate nginx (TLS·차단·Umami 주입)
                                           │ 사설망 172.26.x
                                           ▼
                                  beta:4060  newapp-web (Next.js standalone, 384m)
                                           │ TLS
                                           ▼
                                  cortie-db (Postgres) · newapp_db / newapp_app
```

| 층 | 선택 | 이유 |
|---|---|---|
| 웹·API | **Next.js 16 (App Router) + React 19**, 한 컨테이너 | 화면·API(Route Handler·Server Action)를 한 프로세스로. 별도 API 서버는 필요해질 때(긴 작업·다른 언어) `api/`로 추가 |
| 언어 | TypeScript 5.9 strict | 7.x(네이티브)는 Next 지원 확인 뒤 |
| 스타일 | Tailwind 4 + laea ink 토큰(`app/globals.css`) | 밝은 종이·먹 흑백. 어두운 테마 없음 |
| DB | **cortie-db 전용 DB + Drizzle ORM**(postgres.js) | 이미 백업(금고)·감시가 붙은 관리형 Postgres. 새 DB 서버 비용 0 |
| 마이그레이션 | `drizzle-kit generate` → 서버 시작 시 자동 적용(`instrumentation.ts`) | 인스턴스 하나라 가장 단순. `MIGRATE_ON_START=0`으로 끔 |
| 환경변수 | `lib/env.ts`(zod)에서만 읽음 | 빠지면 시작하자마자 죽음 |
| 품질 | Biome(린트+포맷) · `tsc` · `next build` = `pnpm check` | 도구 하나로 빠르게 |
| 패키지 | pnpm 11 (lockfile 고정, `allowBuilds`로 설치 스크립트 허용 목록) | 공급망 |
| 이미지 | node:22-alpine 3단계, standalone, npm·corepack 제거, uid node | 다른 제품과 같은 방식(2026-11-03 취약점 정리) |
| 분석 | gate가 Umami를 주입 → 코드에 넣을 것 없음 | |
| 보안 헤더·요청 제한 | gate `site-common.conf` | 앱에 중복으로 안 넣음 |

인증·파일 업로드·백그라운드 작업은 **서비스가 정해지면** 고른다(예: 로그인 필요 → Auth.js/better-auth를 같은 DB에, 업로드 → 기존 버킷).

## 폴더

```
docker-compose.yml       운영(beta) — 첫 줄 주석이 배포 대상 표시
docker-compose.dev.yml   로컬 개발용 postgres(127.0.0.1:54060)
web/
  app/                   화면 + app/api/health(DB까지 확인)
  lib/env.ts             환경변수 검사
  lib/db/                schema.ts · index.ts(연결) · migrate.ts
  drizzle/               생성된 SQL 마이그레이션(커밋함)
  instrumentation.ts     시작 시 마이그레이션
  Dockerfile
```

## 개발

```bash
docker compose -f docker-compose.dev.yml up -d     # 로컬 postgres
cd web && cp .env.example .env && pnpm install && pnpm dev   # http://localhost:4060
pnpm db:generate --name <무엇>                        # schema.ts 바꾼 뒤 마이그레이션 생성
```
무거운 확인은 gamma runner로: `laea-remote -m 3G -e DATABASE_URL=postgres://x:x@127.0.0.1:1/x -e MIGRATE_ON_START=0 -- corepack pnpm check` (web/에서).

## 운영에 올리기 (사용자가 할 때 — `cortie-infra/docs/new-service.md` 순서)

- [ ] 이름 정하기 → 아래 "이름 바꾸기"
- [ ] cortie-db: `newapp_app` 계정 + `newapp_db` (REVOKE PUBLIC, GRANT cortie_backup 잊지 말 것)
- [ ] 비밀값: `sudo laea-secret set newapp DATABASE_URL …` → `apply newapp` → `web/.env.docker` (예시는 `web/.env.docker.example`)
- [ ] beta 방화벽: `ufw allow from 172.26.13.215 to any port 4060 proto tcp`
- [ ] `laea svc deploy newapp` → `curl beta 127.0.0.1:4060/api/health` = 200
- [ ] Cloudflare `newapp` A → gate, 주황 → `laea gate domain add newapp.laea.io beta:4060 --name newapp`
- [ ] `inventory/services.yaml` 한 줄 · `products.md` · `laea infra collect && push`
- [ ] GitHub 비공개 저장소 연결 여부 결정(지금은 로컬 git만)

## 확인한 것 (2026-11-21)

- gamma runner: `pnpm install --frozen-lockfile` · `tsc` · Biome · `next build` 통과, standalone에 `drizzle/` 포함
- alpha `laea-heavy`로 이미지 빌드(303MB) → 임시 postgres 17과 붙여 실행: 시작 시 마이그레이션 적용(`items` 생성), `/api/health` 200, `/` 200, DB를 끄면 `/api/health` 503, 메모리 41MiB
- 운영(beta·gate·cortie-db)에는 아무것도 하지 않음

## 이름 바꾸기

```bash
grep -rl newapp --exclude-dir={node_modules,.next,.git} . | xargs sed -i 's/newapp/<새이름>/g'
cd .. && mv newapp <새이름>
```
포트 4060은 그대로 써도 된다(beta에서 비어 있음을 11-21에 확인).
