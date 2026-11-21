# foty 프론트 — 화면 만들기 규칙

디자인 원본: `design/project/*.dc.html` (claude.ai 디자인 캔버스 「foty 서비스 화면」, 2026-11-21 사본).
`X.dc.html` = 모바일(390px), `DX.dc.html` = 같은 화면의 데스크톱(1440px). **둘 다 한 라우트에서** 만든다.

## 디자인 읽기
```bash
cd design/project
python3 -I ../tools/text.py Detail.dc.html         # 글자·링크·이미지만 (구조 파악)
python3 -I ../tools/strip.py DDetail.dc.html        # 스타일 포함 마크업 (svg 생략, --svg 로 포함)
```
- 문구는 **디자인 그대로**(해요체, 띄어쓰기 포함). 숫자·이름·날짜도 그대로 — 시연 데이터.
- 색·크기·여백은 아트보드의 인라인 스타일 값을 Tailwind 임의값으로 옮긴다(`text-[15px]`, `rounded-[14px]`, `mt-[18px]`).
- `tokens.json`(라임색)은 옛 버전이다. 쓰지 않는다. 실제 색은 `app/globals.css`의 토큰.

## 토큰(`app/globals.css`)
| 클래스 | 값 | 쓰임 |
|---|---|---|
| `text-ink` `bg-ink` | #0b0d12 | 글자·주요 버튼·선택 칩 |
| `text-sub` | #5b5f69 | 보조 글자 |
| `text-label` | #4a4e57 | 꺼진 칩 글자 |
| `text-muted` | #8d929c | 캡션 |
| `text-faint` | #a9adb6 | 꺼진 큰 탭 |
| `bg-face` | #f3f4f5 | 면(칩·입력·카드) |
| `border-line` | #e9e9eb | 구분선 |
| `line-2` | #dcdee2 | 테두리 버튼·빈 진행 칸 (`shadow-[inset_0_0_0_1px_var(--color-line-2)]`) |
| `bg-avatar` | #e3e5e8 | 글자 아바타 |
| `accent` | #ff6a3d | 심볼 색 · 강조 버튼(한 화면 한 곳) · 알림 점 |
| `text-warn` `bg-warn-bg` | #d9480f / #ffeee8 | 성사까지 n명 · 확인 대기 · 재확인 필요 |
| `bg-kakao` | #fee500 | 카카오 버튼 |
그 밖의 색(#2a2d34 본문 진하게, #e6eaec 지도 바탕 등)은 임의값으로.

## 부품(먼저 이것부터 쓴다 — 새로 만들지 말 것)
- `components/ui/primitives.tsx`: `Button` `ButtonLink`(variant primary·accent·outline·soft, size lg54·md50·sm44, icon, block) · `buttonClass()` · `Chip`(selected, icon) · `Badge`(tone ink·soft·muted·warn) · `Tag`(행동 태그) · `Avatar` `AvatarStack` · `Progress`(성사 진행) · `Verified`(사업장 확인/남양주 주민 인증) · `Reason`(추천 이유) · `Photo` · `DemoNote` · `Segmented`(일정·대화·참여자) · `TextTabs`(큰 글자 탭) · `IconButton` · `SectionTitle` · `Note` · `StepNo`
- `components/ui/icon.tsx`: `<Icon name="back|chevron|bell|search|check|pin|more|share|plus|close|chat|user|flag|home|map|calendar|sparkle|send|people|edit|shield|filter|alert|logout|mail|settings" size weight />` — 디자인 svg와 같은 경로.
- `components/ui/mascot.tsx`: `Mascot`(tone orange·ink·gray·pale, face, color, size) · `Logo`. 디자인의 100×100 꽃 모양 svg는 전부 이것.
- `components/shell/mobile.tsx`: `MobileFrame`(tabbar, bottom) · `MobileTopBar`(host) · `BackBar`(title, back, right) · `BottomBar` · `MobileTabBar` · `DesktopFrame`
- `components/shell/desktop-header.tsx`: 데스크톱 머리·바닥(레이아웃에 이미 있음. `/host/*`는 자동으로 호스트 메뉴)
- `components/theme/cards.tsx`: `ThemeRow`(모바일 목록) · `ThemeTile`(데스크톱 격자) · `ThemeMini`(56px 요약)
- `components/theme/parts.tsx`: `StopList`(장소 카드) · `MapSketch`(코스 약도 svg) · `InfoRows`(집결·포함…) · `HostBlock` · `DetailHead` · `courseLength`
- `components/theme/empty.tsx`: `NoThemes` · `notify-button.tsx` · `share-button.tsx`

## 화면 틀
```tsx
export default function Page() {
  return (
    <>
      <MobileFrame tabbar>   {/* 1024px 미만: 폭 560까지 가운데 */}
        <BackBar title="…" />  또는 <MobileTopBar />
        <div className="px-5">…</div>
        <DemoNote />
      </MobileFrame>
      <DesktopFrame>…</DesktopFrame>   {/* 1024px 이상: max-w 1184, px-8, pt-10 */}
    </>
  )
}
```
- 모바일 아트보드의 `position:absolute;bottom:0` 버튼 줄 → `<BottomBar>` + `MobileFrame bottom`.
- 모바일 하단 메뉴가 있는 화면 → `MobileFrame tabbar`.
- 바텀시트(AI 도우미 등): 모바일은 `fixed` 시트 + 뒤 막(rgba(27,29,36,0.4)), 데스크톱 디자인대로.
- 데스크톱 1440 아트보드의 `<main style="max-width:1184px…">` 안쪽만 만들면 된다(머리·바닥은 레이아웃).
- **서버 컴포넌트가 기본**. 누르면 바뀌는 것(칩 선택, 탭, 입력, 펼치기)만 `'use client'` 작은 컴포넌트로.
- 입력은 진짜 `<input>`/`<textarea>`/`<label>`로(디자인의 회색 상자 = 입력칸). 버튼은 `<button>`, 이동은 `<Link>`.
- 디자인에서 `href="X.dc.html"`로 이어진 곳은 아래 **라우트 표**의 주소로 잇는다. `href="#"`는 시연에서 동작 없음(가능하면 상태만 바뀌게).

## 데이터
- 공통: `lib/demo/themes.ts`(테마 6개·사진·상태·`themeBadge`) · `lib/demo/people.ts`(me=강현, people, hosts) · `lib/demo/filters.ts`(홈 조건 쿼리)
- 그룹마다 자기 파일을 만든다: `lib/demo/<group>-*.ts` (예: `lib/demo/trips.ts`, `lib/demo/community.ts`). **공통 파일은 고치지 않는다** — 필요하면 자기 파일에서 감싸거나 보고.
- 사진은 `public/images/*.jpg`(themes.ts의 `img`). 새 사진 없음.
- 모든 화면 맨 아래 `DemoNote`(디자인에 있는 곳).

## 라우트 표 (디자인 파일 → 주소)
| 디자인 | 주소 | 그룹 |
|---|---|---|
| Main / Empty | `/` (조건이 없으면 빈 화면) | 완료 |
| Detail | `/themes/[id]` | 완료(B가 상태별 변형 추가) |
| Login | `/login` | A |
| EmailLogin · EmailSignup | `/login/email` · `/signup/email` | A |
| Onboarding · Onb2 · Onb3 · Mbti | `/onboarding` · `/onboarding/2` · `/onboarding/3` · `/onboarding/mbti` | A |
| My · Privacy · Blocks | `/my` · `/my/privacy` · `/my/blocks` | A |
| Stampbook · StampSeason · StampDetail | `/my/stamps` · `/my/stamps/season` · `/my/stamps/[place]` | A |
| StampRegion · StampRegionEmpty | `/my/stamps/region/[region]` (모집 중 테마 없으면 빈 화면) | A |
| Notifications · Search · SearchEmpty | `/notifications` · `/search` · `/search?q=…`(결과 없음) | A |
| Report · Credits · Admin · Components | `/report` · `/credits` · `/admin` · `/design/components` | A |
| UserProfile · HostProfile | `/users/[id]` · `/hosts/[id]` | A |
| Error · Loading | `app/error.tsx` + `/states/error` · `app/loading.tsx` + `/states/loading` | A |
| Filter · Request | `/filter` · `/request` | B |
| DetailClosed · DetailConfirmed · DetailDone · GuestDetail | `/themes/[id]` 상태별(모집 마감=sujongsa-tea, 일정 확정·여행 완료·비로그인은 `?view=confirmed|done|guest`) | B |
| Apply · Applied · Matched · Rejected | `/themes/[id]/apply` · `/applied` · `/matched` · `/rejected` | B |
| Cancelled · CancelDone · HostCancelled | `/themes/[id]/cancelled` · `/cancel-done` · `/host-cancelled` | B |
| FriendInvite · FriendJoin | `/themes/[id]/invite` · `/themes/[id]/join` | B |
| Trips · TripsUpcoming · TripsPast | `/trips` · `/trips/upcoming` · `/trips/past` | B |
| Space · Chat · Members · MemberMenu | `/trips/[id]` · `/trips/[id]/chat` · `/trips/[id]/members` · `/trips/[id]/members/[uid]` | B |
| AI · AIUnknown | `/trips/[id]/ai` · `/trips/[id]/ai/unknown` | B |
| Checkin · CheckinDone · History · Review | `/trips/[id]/checkin` · `/checkin/done` · `/history` · `/review` | B |
| Course · CourseMap · CorePick · SavedCourses | `/course` · `/course/map` · `/course/pick` · `/course/saved` | C |
| Community · PostDetail · WriteReview · AskWrite | `/community` · `/community/[id]` · `/community/write` · `/community/ask` | C |
| HostThemes · HostPast · HostRequests | `/host` · `/host/past` · `/host/requests` | C |
| HostJoin · ResidentJoin · HostEdit | `/host/join` · `/host/join/resident` · `/host/profile/edit` | C |
| HostNew · HostDraft | `/host/new` · `/host/new/draft` | C |
| HostApplicants · HostAddDate · HostCancel · HostSpace · HostReview | `/host/themes/[id]/applicants` · `/add-date` · `/cancel` · `/space` · `/review` | C |
| HostCheckin · HostSummary · RegionSummary | `/host/checkin` · `/host/summary` · `/host/region` | C |
`[id]`는 테마 id(themes.ts), 여행 공간 기본 예시는 `gwangneung-morning`. `[uid]`는 people id.

## 확인
- alpha에서 빌드·브라우저를 돌리지 않는다. 검사는 gamma runner:
  ```bash
  cd web && ~/projects/cortie-infra/guard/remote/laea-remote -m 3G -t 15m -e DATABASE_URL=postgres://x:x@127.0.0.1:1/x -e MIGRATE_ON_START=0 -- bash -c 'export COREPACK_ENABLE_DOWNLOAD_PROMPT=0 CI=1; corepack pnpm install --frozen-lockfile >/dev/null 2>&1; corepack pnpm exec biome check --write . ; corepack pnpm exec tsc --noEmit && corepack pnpm exec next build 2>&1 | tail -40'
  ```
  `biome check --write`는 runner에서 고친 뒤 `-g <폴더>`로 되가져와야 반영된다(아니면 alpha에서 `pnpm exec biome check --write <파일>`은 가벼우니 써도 된다).
- 화면 캡처(선택): `-i cortie-heavy-pw:1.64.1`로 빌드 → `node_modules/.bin/next start -p 4060 &` → `node ../design/tools/shot.cjs ../design/shots http://127.0.0.1:4060 /경로…` → `-g ../design/shots`. 캡처를 열어 디자인과 비교.
