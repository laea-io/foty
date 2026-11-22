// foty DB 스키마 — 기획안 6장 상태 모델과 5장 기능을 그대로 옮겼다.
// 상태 이름은 화면에 보이는 한국어 그대로 쓴다(배지와 1:1).
import { sql } from 'drizzle-orm'
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

const now = () => timestamp({ withTimezone: true }).notNull().defaultNow()

// ── 상태 ──────────────────────────────────────────────
export const themeStatus = pgEnum('theme_status', [
  '모집 중',
  '모집 마감',
  '일정 조율 중',
  '일정 확정',
  '여행 완료',
  '취소',
])
export const applicationStatus = pgEnum('application_status', ['신청 대기', '수락', '거절', '신청 취소'])
export const changeStatus = pgEnum('change_status', ['제안됨', '변경 확인 중', '반영됨', '반려됨'])
export const attendanceStatus = pgEnum('attendance_status', [
  '확인 대기',
  '참여 확인',
  '불참 확인',
  '검토 중',
])
export const hostKind = pgEnum('host_kind', ['business', 'resident'])
export const hostStatus = pgEnum('host_status', ['확인 대기', '확인 완료', '보류', '정지'])
export const confirmMode = pgEnum('confirm_mode', ['auto', 'manual'])
export const postKind = pgEnum('post_kind', ['여행 후기', '코스 공유', '질문'])
export const reportStatus = pgEnum('report_status', ['검토 중', '처리 완료', '반려'])

// ── 사람 ──────────────────────────────────────────────
export type Prefs = {
  activities?: string[]
  pace?: string
  talk?: string
  plan?: string
  walk?: string
  food?: string
  /** 주로 타는 것: 대중교통 · 자차 */
  transport?: string
}
export type Privacy = {
  profilePublic?: boolean
  tripsPublic?: boolean
  photosPublic?: boolean
  /** 내가 쓴 후기 공개 */
  reviewsPublic?: boolean
}

export const users = pgTable(
  'users',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** 화면 주소에 쓰는 짧은 이름(/users/[handle]) */
    handle: text().notNull(),
    name: text().notNull(),
    email: text(),
    passwordHash: text(),
    kakaoId: text(),
    role: text({ enum: ['user', 'admin'] })
      .notNull()
      .default('user'),
    adult: boolean().notNull().default(false),
    /** 출발 권역(상봉·중랑 등) — 정확한 주소는 받지 않는다 */
    origin: text(),
    mbti: text(),
    mbtiPublic: boolean().notNull().default(false),
    prefs: jsonb().$type<Prefs>().notNull().default({}),
    privacy: jsonb().$type<Privacy>().notNull().default({}),
    onboarded: boolean().notNull().default(false),
    /** 시연 계정(스테이징 seed) */
    demo: boolean().notNull().default(false),
    /** 운영팀 정지 · 탈퇴 시각 — 있으면 로그인할 수 없다(탈퇴는 handle이 deleted-로 시작) */
    suspendedAt: timestamp({ withTimezone: true }),
    createdAt: now(),
  },
  (t) => [
    uniqueIndex('users_handle').on(t.handle),
    uniqueIndex('users_email').on(sql`lower(${t.email})`),
    uniqueIndex('users_kakao').on(t.kakaoId),
  ],
)

/** 로그인 세션 — 쿠키에는 원문 토큰, DB에는 sha256만 */
export const sessions = pgTable(
  'sessions',
  {
    id: text().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: now(),
  },
  (t) => [index('sessions_user').on(t.userId)],
)

export const hosts = pgTable(
  'hosts',
  {
    id: text().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: hostKind().notNull(),
    name: text().notNull(),
    area: text().notNull(),
    intro: text().notNull().default(''),
    /** 담당자 연락 수단 — 참여자에게 보이지 않는다 */
    contact: text().notNull().default(''),
    status: hostStatus().notNull().default('확인 대기'),
    /** 주민 호스트: 신청을 하나씩 수락할지 */
    confirmMode: confirmMode().notNull().default('auto'),
    submittedAt: now(),
    verifiedAt: timestamp({ withTimezone: true }),
  },
  (t) => [uniqueIndex('hosts_user').on(t.userId)],
)

// ── 장소(검토된 장소만) ──────────────────────────────
export const places = pgTable('places', {
  id: text().primaryKey(),
  name: text().notNull(),
  /** 목록의 짧은 이름(여유당 → 다산 한정식 → 카페) */
  short: text(),
  area: text().notNull(),
  /** 문화 공간 · 점심 · 카페 … */
  kind: text().notNull(),
  /** 고르기 칩: 자연 · 카페 · 맛집 · 문화 공간 · 기타 */
  group: text().notNull(),
  /** 스탬프북 권역 */
  region: text(),
  /** 운영 정보 확인 날짜. null이면 재확인 필요 */
  checkedOn: date(),
  sourceUrl: text(),
  image: text().notNull(),
  imageAlt: text().notNull(),
  imageBg: text().notNull().default('#e6e1d8'),
  indoor: boolean().notNull().default(false),
  /** 1인 대략 비용(원) */
  cost: integer().notNull().default(0),
  /** 스탬프 칸으로 쓰는 핵심 장소 */
  stamp: boolean().notNull().default(false),
  /** 원본: 'tourapi'(관광공사, data/places-namyangju.json) · null(직접 넣음) */
  source: text(),
  sourceId: text(),
  address: text(),
  lat: doublePrecision(),
  lng: doublePrecision(),
  phone: text(),
  hours: text(),
  closed: text(),
  parking: text(),
  menu: text(),
  overview: text(),
  /** 사진 여러 장(첫 장 = image) */
  images: jsonb().$type<string[]>().notNull().default([]),
  /** 사진 이용 조건 — 관광공사 Type1(출처 표시) · Type3(출처 표시 + 변경 금지) */
  imageCredit: text(),
})

// ── 테마 ─────────────────────────────────────────────
export const themes = pgTable(
  'themes',
  {
    id: text().primaryKey(),
    hostId: text()
      .notNull()
      .references(() => hosts.id),
    corePlaceId: text()
      .notNull()
      .references(() => places.id),
    title: text().notNull(),
    intro: text().notNull().default(''),
    day: date().notNull(),
    start: text().notNull(),
    end: text().notNull(),
    min: integer().notNull(),
    max: integer().notNull(),
    deadline: timestamp({ withTimezone: true }).notNull(),
    /** 집결 역 · 이동 시간(분) */
    origin: text().notNull().default('상봉역'),
    travelMin: integer().notNull().default(45),
    transit: boolean().notNull().default(true),
    costWon: integer().notNull().default(0),
    meet: text().notNull().default(''),
    include: text().notNull().default(''),
    exclude: text().notNull().default(''),
    activities: text().array().notNull().default(sql`'{}'::text[]`),
    status: themeStatus().notNull().default('모집 중'),
    confirmMode: confirmMode().notNull().default('auto'),
    scheduleVersion: integer().notNull().default(1),
    /** 성사 뒤 공개되는 집결 상세 */
    meetDetail: text().notNull().default(''),
    cancelReason: text(),
    createdAt: now(),
  },
  (t) => [index('themes_day').on(t.day), index('themes_host').on(t.hostId)],
)

export const themeStops = pgTable(
  'theme_stops',
  {
    id: uuid().primaryKey().defaultRandom(),
    themeId: text()
      .notNull()
      .references(() => themes.id, { onDelete: 'cascade' }),
    ord: integer().notNull(),
    placeId: text()
      .notNull()
      .references(() => places.id),
    time: text().notNull(),
    stayMin: integer().notNull(),
    /** 다음 장소까지 이동: "도보 8분" */
    next: text(),
    fixed: boolean().notNull().default(false),
  },
  (t) => [uniqueIndex('stops_order').on(t.themeId, t.ord)],
)

export const applications = pgTable(
  'applications',
  {
    id: uuid().primaryKey().defaultRandom(),
    themeId: text()
      .notNull()
      .references(() => themes.id, { onDelete: 'cascade' }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** 혼자 1 · 친구와 함께 2 */
    party: integer().notNull().default(1),
    message: text().notNull().default(''),
    status: applicationStatus().notNull().default('신청 대기'),
    /** 친구와 함께 신청 — 초대 링크 토큰 */
    inviteToken: text(),
    createdAt: now(),
    decidedAt: timestamp({ withTimezone: true }),
  },
  (t) => [uniqueIndex('applications_once').on(t.themeId, t.userId), index('applications_user').on(t.userId)],
)

export const messages = pgTable(
  'messages',
  {
    id: uuid().primaryKey().defaultRandom(),
    themeId: text()
      .notNull()
      .references(() => themes.id, { onDelete: 'cascade' }),
    /** null이면 시스템 안내 */
    userId: uuid().references(() => users.id, { onDelete: 'set null' }),
    body: text().notNull(),
    createdAt: now(),
  },
  (t) => [index('messages_theme').on(t.themeId, t.createdAt)],
)

/** 일정 변경 제안 — 주요 변경(날짜·집결·예산·핵심 시간)은 참여자 확인이 필요하다 */
export const changes = pgTable(
  'changes',
  {
    id: uuid().primaryKey().defaultRandom(),
    themeId: text()
      .notNull()
      .references(() => themes.id, { onDelete: 'cascade' }),
    proposerId: uuid()
      .notNull()
      .references(() => users.id),
    /** stop · meet_time · date · budget · core_time */
    kind: text().notNull(),
    label: text().notNull(),
    fromText: text().notNull(),
    toText: text().notNull(),
    /** 어디서 왔나: 직접 · AI 대안 */
    source: text().notNull().default('직접'),
    major: boolean().notNull().default(false),
    status: changeStatus().notNull().default('제안됨'),
    payload: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    createdAt: now(),
    decidedAt: timestamp({ withTimezone: true }),
  },
  (t) => [index('changes_theme').on(t.themeId)],
)

export const changeConfirms = pgTable(
  'change_confirms',
  {
    changeId: uuid()
      .notNull()
      .references(() => changes.id, { onDelete: 'cascade' }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    note: text(),
    createdAt: now(),
  },
  (t) => [primaryKey({ columns: [t.changeId, t.userId] })],
)

/** 현장 체크인 — 방문 집계·스탬프·참여 확인의 근거 */
export const checkins = pgTable(
  'checkins',
  {
    id: uuid().primaryKey().defaultRandom(),
    themeId: text()
      .notNull()
      .references(() => themes.id, { onDelete: 'cascade' }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    placeId: text()
      .notNull()
      .references(() => places.id),
    /** qr · host(호스트 직접 확인) */
    method: text().notNull().default('qr'),
    /** 이번이 남양주 첫 방문이라고 답했나 */
    firstVisit: boolean(),
    createdAt: now(),
  },
  (t) => [uniqueIndex('checkins_once').on(t.themeId, t.userId), index('checkins_place').on(t.placeId)],
)

export const attendance = pgTable(
  'attendance',
  {
    themeId: text()
      .notNull()
      .references(() => themes.id, { onDelete: 'cascade' }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: attendanceStatus().notNull().default('확인 대기'),
    note: text(),
    updatedAt: now(),
  },
  (t) => [primaryKey({ columns: [t.themeId, t.userId] })],
)

/** 상호 평가 — 행동 태그만(점수 없음) */
export const peerReviews = pgTable(
  'peer_reviews',
  {
    themeId: text()
      .notNull()
      .references(() => themes.id, { onDelete: 'cascade' }),
    fromUser: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    toUser: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tags: text().array().notNull().default(sql`'{}'::text[]`),
    createdAt: now(),
  },
  (t) => [primaryKey({ columns: [t.themeId, t.fromUser, t.toUser] })],
)

// ── 커뮤니티 ─────────────────────────────────────────
export const posts = pgTable(
  'posts',
  {
    id: text().primaryKey(),
    kind: postKind().notNull(),
    authorId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    themeId: text().references(() => themes.id, { onDelete: 'set null' }),
    placeId: text().references(() => places.id),
    title: text().notNull(),
    body: text().notNull(),
    photos: text().array().notNull().default(sql`'{}'::text[]`),
    /** 이동수단 · 바꾼 장소 · 실제 지출 */
    transport: text(),
    changedPlace: text(),
    spentWon: integer(),
    public: boolean().notNull().default(true),
    allowCopy: boolean().notNull().default(true),
    visitedOn: date(),
    /** 운영팀이 숨긴 시각 — 있으면 목록·글에서 빠진다 */
    hiddenAt: timestamp({ withTimezone: true }),
    createdAt: now(),
  },
  (t) => [index('posts_created').on(t.createdAt)],
)

export const comments = pgTable('comments', {
  id: uuid().primaryKey().defaultRandom(),
  postId: text()
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  authorId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  body: text().notNull(),
  /** 운영팀이 숨긴 시각 */
  hiddenAt: timestamp({ withTimezone: true }),
  createdAt: now(),
})

export const savedCourses = pgTable('saved_courses', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  corePlaceId: text()
    .notNull()
    .references(() => places.id),
  title: text().notNull(),
  day: date(),
  /** 장소 id 순서 */
  stops: text().array().notNull(),
  /** 가져온 후기 */
  fromPostId: text().references(() => posts.id, { onDelete: 'set null' }),
  createdAt: now(),
})

/** "이런 테마가 있으면 가고 싶어요" — 요청한 사람은 호스트에게 보이지 않는다 */
export const themeRequests = pgTable('theme_requests', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  body: text().notNull(),
  when: text().notNull(),
  tags: text().array().notNull().default(sql`'{}'::text[]`),
  /** 같은 요청을 남긴 사람 수(비슷한 요청을 묶을 때) */
  same: integer().notNull().default(1),
  createdAt: now(),
})

export const requestSkips = pgTable(
  'request_skips',
  {
    hostId: text()
      .notNull()
      .references(() => hosts.id, { onDelete: 'cascade' }),
    requestId: uuid()
      .notNull()
      .references(() => themeRequests.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.hostId, t.requestId] })],
)

// ── 알림 · 신고 · 차단 · 구독 ─────────────────────────
export const notifications = pgTable(
  'notifications',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text().notNull(),
    body: text().notNull().default(''),
    href: text().notNull().default('/'),
    readAt: timestamp({ withTimezone: true }),
    createdAt: now(),
  },
  (t) => [index('notifications_user').on(t.userId, t.createdAt)],
)

export const reports = pgTable('reports', {
  id: uuid().primaryKey().defaultRandom(),
  reporterId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  targetUserId: uuid().references(() => users.id, { onDelete: 'set null' }),
  targetThemeId: text().references(() => themes.id, { onDelete: 'set null' }),
  reason: text().notNull(),
  detail: text().notNull().default(''),
  status: reportStatus().notNull().default('검토 중'),
  createdAt: now(),
  resolvedAt: timestamp({ withTimezone: true }),
})

export const blocks = pgTable(
  'blocks',
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    blockedId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: now(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.blockedId] })],
)

/** 새 테마 알림: kind = all · host · place */
export const subscriptions = pgTable(
  'subscriptions',
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text().notNull(),
    key: text().notNull().default(''),
    createdAt: now(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.kind, t.key] })],
)

// ── 비밀번호 재설정 ─────────────────────────────────
/** 재설정 링크(토큰은 해시만 저장, 30분, 한 번만) */
export const passwordResets = pgTable('password_resets', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text().notNull().unique(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  usedAt: timestamp({ withTimezone: true }),
  createdAt: now(),
})
