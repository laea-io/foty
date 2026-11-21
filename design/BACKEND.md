# foty 백엔드 — 화면 붙이기 규칙

화면은 이미 디자인대로 있다(`design/BUILD.md`). 이제 시연 데이터(`lib/demo/*`) 대신 DB를 읽고, 버튼이 실제로 동작하게 한다.
**화면 모양은 바꾸지 않는다.** 데이터 출처와 동작만 바꾼다.

## 이미 있는 것(공통 — 고치지 말 것, 필요하면 보고)
| 파일 | 내용 |
|---|---|
| `lib/db/schema.ts` | 모든 표. **스키마는 고치지 않는다**(마이그레이션이 갈라진다). 모자라면 보고 |
| `lib/db/seed-data.ts` | 시연 세계(사람·호스트·장소·테마·신청·체크인·대화·변경·후기·요청·알림·신고). 시연 계정 비밀번호 `foty-demo`, 나 = `kanghyun`(강현), 운영팀 = `admin`, 호스트: `dasan-owner`·`byeollae-owner`·`supgil-owner`·`harin`·`jiho`·`seoyeon` |
| `lib/server/rules.ts` | 미결 사항의 기본값(최소 3·최대 6, 친구 +1, 가게 선착순·주민 수락, 전원 확인, 평가 7일, 행동 태그, 신고 사유) |
| `lib/server/time.ts` | `dayLabel` 11.21 (토) · `deadlineLabel` · `dday` · `ago` · `hhmm` · `won` · `today` · `addDays` — 모두 한국 시간 |
| `lib/server/auth.ts` | `getViewer()`(없으면 null, 요청당 한 번) · `requireViewer(next)` · `requireHost()` · `requireAdmin()` · `startSession` · `endSession` · `safeNext` |
| `app/actions/auth.ts` | `loginAction` · `signupAction`(useActionState용) · `logoutAction` · `demoLoginAction`(DEMO_MODE=1) |
| `app/api/auth/kakao` | 카카오 로그인(KAKAO_REST_KEY 있을 때만. 없으면 `/login?kakao=off`로 돌아옴) |
| `lib/server/domain/flow.ts` | `apply` · `cancelApplication` · `decide`(호스트 수락·거절) · `hostCancel` · `confirmSchedule` · `tick` · `checkin` · `memberIds` · `acceptedCount` |
| `lib/server/domain/changes.ts` | `propose` · `confirmChange` · `decideChange` · `groupIds` · `MAJOR_KINDS` |
| `lib/server/domain/read.ts` | `loadThemes`/`loadTheme` → **기존 `Theme` 모양 + 추가 필드**(`ThemeView`: day, deadlineAt, pending, matched, hostName, hostKind, hostUserId, corePlaceId, intro, meetDetail, cancelReason, scheduleVersion, costWon, travelMin) · `relation(db, themeId, userId)` → guest/viewer/applicant/member/host |
| `lib/server/q/themes.ts` | `homeThemes(q)` · `themeDetail(id)` → {theme, viewer, rel} · `themesByIds` · `weekStrip()` · `weekend()` · `LISTED` |
| `lib/server/suggest.ts` | `suggestPlaces(db, {corePlaceId, ask})`(검토된 장소에서만) · `draftCourse` |
| `lib/server/checkin-token.ts` | `checkinToken`/`checkinUrl`/`readCheckinToken` · `inviteSig`/`inviteOk` |
| `lib/server/act.ts` | `act(fn)` → `{ok:true,data}` / `{ok:false,error}`(FlowError 문장을 그대로) |
| `lib/server/domain/notify.ts` | `notify(db, userIds, {title, body, href})` · `systemMessage` |

`db`는 `import { db, schema } from '@/lib/db'`. 도메인 함수 첫 인자에 `db`를 넘긴다.

## 패턴
- **읽기**: 페이지(서버 컴포넌트)에서 바로 `await`. 그룹마다 자기 읽기 모듈 `lib/server/q/<그룹>.ts`(`import 'server-only'`).
  화면 부품이 받는 타입(Theme 등)은 그대로 — 읽기 함수가 그 모양으로 만들어 준다.
- **쓰기**: `app/actions/<그룹>.ts`(`'use server'`). 시작에서 `requireViewer`/`requireHost`로 권한, 입력은 zod로 검사, 도메인 함수는 `act()`로 감싸 실패 문장을 돌려준다. 성공 뒤 `revalidatePath` 또는 `redirect`.
- **폼**: 클라이언트 부품에서 `useActionState(action, undefined)` 또는 `<form action={...}>`. 실패 문장은 버튼 위에 `text-[13px] text-warn`으로. 진행 중엔 버튼 `disabled`.
- **로그인 필요**: 신청·내 여행·마이·호스트·그룹 공간·알림. 비로그인은 `/login?next=<지금 주소>`. 둘러보기(홈·상세·코스·커뮤니티 목록·글)는 로그인 없이.
- **공개 범위(기획안 9장)**: 그룹 대화·집결 상세·다른 참여자 프로필은 **성사 후 그 테마의 참여자·호스트만**. MBTI는 본인이 공개한 경우만. 정확한 집 주소는 받지 않는다. 호스트 연락 수단은 참여자에게 안 보인다.
- **점수·순위 금지**: 평가는 행동 태그 횟수만, 스탬프는 개인 기록만.
- **시연 데이터 표시**: `DemoNote`는 그대로 둔다(스테이징은 시연 데이터).
- `lib/demo/*`는 타입·고정 목록(지역·활동·예산 칩 등) 용도로만 남기고, 화면 데이터는 DB에서. 다 옮긴 시연 모듈은 지우지 말고 둔다(다른 그룹이 아직 쓸 수 있음) — 마지막에 정리.
- 오류: 없는 id → `notFound()`. 권한 없음 → `redirect`(로그인) 또는 `notFound()`(남의 것).

## 확인
- 도메인 시험: `test/*.test.ts`(vitest + PGlite, 시연 세계가 들어간 메모리 DB — `test/db.ts`의 `testDb()`). 새 쓰기 동작은 시험을 하나 이상.
- runner에서: `cd web && ~/projects/cortie-infra/guard/remote/laea-remote -m 3G -t 15m -e DATABASE_URL=postgres://x:x@127.0.0.1:1/x -e MIGRATE_ON_START=0 -e JOBS=0 -- bash -c 'export COREPACK_ENABLE_DOWNLOAD_PROMPT=0 CI=1; corepack pnpm install --frozen-lockfile >/dev/null 2>&1; corepack pnpm exec biome check --write . >/dev/null; corepack pnpm check 2>&1 | tail -40'` (`-g app -g components -g lib -g test`로 서식 고친 것 되가져오기)
- 실제 DB로 화면 확인(브라우저): runner에 그룹 전용 Postgres를 띄운다(runner 작업 컨테이너는 도커 기본망이라 `172.17.0.1`로 닿는다):
  `ssh gamma-runner 'docker run -d --rm --name foty-pg-<그룹> -e POSTGRES_PASSWORD=x -p 172.17.0.1:<포트>:5432 postgres:17-alpine'`
  그 뒤 laea-remote(`-i cortie-heavy-pw:1.64.1`, `-e DATABASE_URL=postgres://postgres:x@172.17.0.1:<포트>/postgres -e DATABASE_SSL=disable -e DEMO_MODE=1 -e JOBS=0`)에서 `node_modules/.bin/next build && (node_modules/.bin/next start -p 4060 &)` → 시작할 때 마이그레이션 + 시연 데이터. 데이터를 처음으로 되돌리려면 `ssh gamma-runner docker restart`가 아니라 컨테이너를 내렸다 다시 띄운다(`--rm`이라 지워짐).
  시연 계정 로그인: `/login/email`에 `kanghyun@demo.foty.kr` / `foty-demo`(A가 "시연 계정으로 보기"도 만든다). 브라우저 시험은 playwright로 로그인 → 동작 → 결과 확인. 끝나면 `ssh gamma-runner docker stop foty-pg-<그룹>`.
- 포트: A 15432 · B 25432 · C 35432.
