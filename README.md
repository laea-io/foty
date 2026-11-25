# foty

> 2026-11-21 서버 뼈대. 남양주 당일 테마 여행 서비스 — 기획: 「foty 서비스 디자인 기획안」(2026-11-21, 강현).

## 구성 한눈에

```
브라우저 ──https──▶ Cloudflare(주황) ──▶ gate nginx (TLS·차단·Umami 주입)
                                           │ 사설망 172.26.x
                                           ▼
                                  beta:4060  foty-web (Next.js standalone, 384m)
                                           │ TLS
                                           ▼
                                  cortie-db (Postgres) · foty_db / foty_app
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

기능(테마 · 여행 · 호스트 · 커뮤니티 · 계정 · 운영팀) 이름으로 나눈다. 같은 기능은 화면 · 부품 · 서버 액션 · 읽기 · 쓰기가 같은 이름을 쓴다.

```
docker-compose.yml        운영(beta) — 첫 줄 주석이 배포 대상 표시
docker-compose.dev.yml    로컬 개발용 postgres(127.0.0.1:54060)
ops/                      스테이징(stg-up.sh) · 장소/큐레이션 데이터 만들기 · 시연 데이터
design/                   디자인 문서 · 화면 사진 · e2e 스크립트(design/tools)
web/
  app/                    화면(주소 = 폴더) + app/api(health · 카카오 로그인 · 파일 · 길찾기 · 대화 스트림)
  app/actions/            서버 액션 — auth · password-reset · account · admin · themes · trips · host · community
  components/
    ui/                   공통 부품(primitives · icon · mascot · states · parts · toggle · chip-pick)
    forms/                서버 액션 폼(action-form · locked-form) · 입력 칸(fields)
    shell/                머리말 · 모바일 틀 · 보는 사람 정보
    auth/ onboarding/     로그인 · 비밀번호 재설정 · 가입 단계
    home/ theme/ trips/   홈 조건 · 테마 상세/신청 · 내 여행/그룹 공간
    host/ community/ course/ my/ admin/ search/ legal/ map/
  lib/
    env.ts                환경변수 검사(zod) — 여기서만 읽는다
    shared/               서버 · 브라우저 공용 타입과 고정 목록(theme · people · stamps · filters · stations)
    client/               브라우저 전용 도구
    db/                   schema · index(연결) · migrate · sync/(장소 · 큐레이션 테마) · seed/(스테이징 시연 세계)
    demo/                 /design 쇼케이스(DEMO_MODE)에서만 쓰는 예시 데이터
    server/
      auth/               세션 · 비밀번호 · 재설정 · 서명 토큰(체크인 QR · 초대)
      services/           바깥 서비스 — OpenAI(ai) · 카카오모빌리티(directions) · 메일 · 업로드
      util/               act(액션 결과) · form(FormData 읽기) · rules(서비스 규칙) · time(한국 시간)
      queries/            읽기 — themes · theme-screens · theme-view · trips · host · places · community · my · stamps · profiles · safety · search · admin
      domain/             쓰기(db를 인자로 받아 PGlite로 시험) — flow(신청~체크인 상태) · changes · trips · host · community · account · admin · notify · suggest
      jobs.ts             1분마다 마감 · 성사 · 알림(tick)
  drizzle/                생성된 SQL 마이그레이션(커밋함)
  test/                   vitest(PGlite) — account · trips · host-community · flow · admin · ai · places · fixes
  instrumentation.ts      시작 시 마이그레이션 → 장소 · 큐레이션 동기화 → 작업 시작
  proxy.ts                로그인 확인(로그인 · 가입 · 약관 · health만 열림)
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

- [ ] cortie-db: `foty_app` 계정 + `foty_db` (REVOKE PUBLIC, GRANT cortie_backup 잊지 말 것)
- [ ] 비밀값: `sudo laea-secret set foty DATABASE_URL …` → `apply foty` → `web/.env.docker` (예시는 `web/.env.docker.example`)
- [ ] beta 방화벽: `ufw allow from 172.26.13.215 to any port 4060 proto tcp`
- [ ] `laea svc deploy foty` → `curl beta 127.0.0.1:4060/api/health` = 200
- [ ] Cloudflare `foty` A → gate, 주황 → `laea gate domain add foty.laea.io beta:4060 --name foty`
- [ ] `inventory/services.yaml` 한 줄 · `products.md` · `laea infra collect && push`
- [ ] GitHub 비공개 저장소 연결 여부 결정(지금은 로컬 git만)

## 확인한 것 (2026-11-21)

- gamma runner: `pnpm install --frozen-lockfile` · `tsc` · Biome · `next build` 통과, standalone에 `drizzle/` 포함
- alpha `laea-heavy`로 이미지 빌드(303MB) → 임시 postgres 17과 붙여 실행: 시작 시 마이그레이션 적용(`items` 생성), `/api/health` 200, `/` 200, DB를 끄면 `/api/health` 503, 메모리 41MiB
- 운영(beta·gate·cortie-db)에는 아무것도 하지 않음
