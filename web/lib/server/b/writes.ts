// 그룹 B(테마 참여 · 여행)의 쓰기 — 도메인 함수(flow · changes)에 없는 작은 동작들.
// DB를 인자로 받는다(운영 postgres.js · 시험 PGlite). 서버 액션(app/actions/b-*.ts)이 권한 확인 뒤 부른다.
import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import * as s from '@/lib/db/schema'
import { groupIds, propose } from '../domain/changes'
import { apply, memberIds } from '../domain/flow'
import { notify } from '../domain/notify'
import { type AnyDb, FlowError } from '../domain/types'
import { rules } from '../rules'
import { addDays, today } from '../time'

/** 대화 새 글 알림 채널(LISTEN foty_chat) — 내용은 테마 id */
export const CHAT_CHANNEL = 'foty_chat'

// ── 그룹 대화 ────────────────────────────────────────
/** 그룹(호스트 + 수락된 참여자)만 보낼 수 있다. 넣은 뒤 NOTIFY로 열린 화면에 알린다 */
export async function sendChat(db: AnyDb, input: { themeId: string; userId: string; body: string }) {
  const body = input.body.trim().slice(0, 1000)
  if (!body) throw new FlowError('empty', '보낼 말을 적어 주세요')
  const [t] = await db
    .select({ status: s.themes.status })
    .from(s.themes)
    .where(eq(s.themes.id, input.themeId))
  if (!t) throw new FlowError('not-found', '테마를 찾을 수 없어요')
  const group = await groupIds(db, input.themeId)
  if (!group.includes(input.userId)) throw new FlowError('not-member', '그룹 참여자만 대화할 수 있어요')
  if (t.status === '취소') throw new FlowError('closed', '취소된 테마예요')
  const [row] = await db
    .insert(s.messages)
    .values({ themeId: input.themeId, userId: input.userId, body })
    .returning()
  await db.execute(sql`select pg_notify(${CHAT_CHANNEL}, ${input.themeId})`)
  return row
}

// ── 테마 요청 ────────────────────────────────────────
const REQUEST_WHEN = ['이번 주말', '다음 주말', '평일도 좋아요'] as const

export async function submitRequest(
  db: AnyDb,
  input: { userId: string; body?: string; when: string; tags: string[] },
) {
  const tags = [...new Set(input.tags.map((x) => x.trim()).filter(Boolean))].slice(0, 6)
  const when = (REQUEST_WHEN as readonly string[]).includes(input.when) ? input.when : '언제든'
  const text = (input.body ?? '').trim().slice(0, 300)
  if (!text && !tags.length) throw new FlowError('empty', '하고 싶은 것을 하나 이상 골라 주세요')
  const [row] = await db
    .insert(s.themeRequests)
    .values({ userId: input.userId, body: text || `${tags.join('·')} 테마`, when, tags })
    .returning()
  return row
}

// ── 친구와 함께 ──────────────────────────────────────
/** 초대한 신청(신청 id) — 열린 상태일 때만 */
export async function inviterApplication(db: AnyDb, applicationId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(applicationId)) return null
  const [row] = await db
    .select({ a: s.applications, name: s.users.name })
    .from(s.applications)
    .innerJoin(s.users, eq(s.users.id, s.applications.userId))
    .where(eq(s.applications.id, applicationId))
  return row ?? null
}

/**
 * 친구가 초대 링크로 신청: 친구 본인의 신청(1명)을 만든다.
 * 초대한 사람의 신청이 '친구와 함께(2명)'로 잡아 둔 자리는 친구 신청으로 옮긴다 → 같은 자리를 두 번 세지 않는다.
 * 친구 신청의 inviteToken에 초대한 신청 id를 남겨 두 신청을 묶는다.
 */
export async function joinInvite(
  db: AnyDb,
  input: { themeId: string; inviterApplicationId: string; userId: string; now?: Date },
) {
  return db.transaction(async (tx) => {
    const inv = await inviterApplication(tx, input.inviterApplicationId)
    if (!inv || inv.a.themeId !== input.themeId) throw new FlowError('invite', '초대 링크가 맞지 않아요')
    if (inv.a.userId === input.userId) throw new FlowError('self', '내가 보낸 초대 링크예요')
    if (inv.a.status !== '신청 대기' && inv.a.status !== '수락')
      throw new FlowError('invite-closed', '초대한 신청이 취소돼서 함께 신청할 수 없어요')
    if (inv.a.party > 1)
      await tx.update(s.applications).set({ party: 1 }).where(eq(s.applications.id, inv.a.id))
    const r = await apply(tx, { themeId: input.themeId, userId: input.userId, party: 1, now: input.now })
    await tx
      .update(s.applications)
      .set({ inviteToken: inv.a.id })
      .where(eq(s.applications.id, r.applicationId))
    await notify(tx, [inv.a.userId], {
      title: '친구가 함께 신청했어요',
      body: '초대 링크로 같은 테마에 신청했어요',
      href: `/themes/${input.themeId}/invite`,
    })
    return r
  })
}

/** 초대 링크로 들어온 친구 신청(초대한 신청 id로 묶인 것) */
export async function invitedFriend(db: AnyDb, applicationId: string) {
  const [row] = await db
    .select({ a: s.applications, name: s.users.name })
    .from(s.applications)
    .innerJoin(s.users, eq(s.users.id, s.applications.userId))
    .where(
      and(
        eq(s.applications.inviteToken, applicationId),
        inArray(s.applications.status, ['신청 대기', '수락']),
      ),
    )
  return row ?? null
}

/** “혼자 신청으로 바꾸기” — 열린 신청의 인원을 1명으로 */
export async function makeSolo(db: AnyDb, input: { themeId: string; userId: string }) {
  const rows = await db
    .update(s.applications)
    .set({ party: 1 })
    .where(
      and(
        eq(s.applications.themeId, input.themeId),
        eq(s.applications.userId, input.userId),
        inArray(s.applications.status, ['신청 대기', '수락']),
      ),
    )
    .returning()
  if (!rows.length) throw new FlowError('none', '바꿀 신청이 없어요')
  return rows[0]
}

// ── AI 대안 → 코스 제안 ──────────────────────────────
const ORD = ['첫', '두', '세', '네', '다섯', '여섯', '일곱', '여덟']
export const stopLabel = (ord: number) => `${ORD[ord] ?? `${ord + 1}`} 번째 장소`

/** 고정이 아닌 장소 중 같은 종류(group)를 바꾼다. 없으면 고정이 아닌 마지막 장소 */
export async function proposeAiStop(db: AnyDb, input: { themeId: string; userId: string; placeId: string }) {
  const [place] = await db.select().from(s.places).where(eq(s.places.id, input.placeId))
  if (!place) throw new FlowError('not-found', '장소를 찾을 수 없어요')
  const stops = await db
    .select({ st: s.themeStops, p: s.places })
    .from(s.themeStops)
    .innerJoin(s.places, eq(s.places.id, s.themeStops.placeId))
    .where(eq(s.themeStops.themeId, input.themeId))
    .orderBy(asc(s.themeStops.ord))
  if (stops.some((x) => x.p.id === place.id)) throw new FlowError('already', '이미 코스에 있는 장소예요')
  const free = stops.filter((x) => !x.st.fixed)
  const target = free.find((x) => x.p.group === place.group) ?? free[free.length - 1]
  if (!target) throw new FlowError('fixed', '바꿀 수 있는 장소가 없어요')
  return propose(db, {
    themeId: input.themeId,
    userId: input.userId,
    kind: 'stop',
    label: stopLabel(target.st.ord),
    from: target.p.name,
    to: place.name,
    source: 'AI 대안',
    payload: { ord: target.st.ord, placeId: place.id },
  })
}

// ── 평가(행동 태그) ──────────────────────────────────
/** 평가 마감일: 여행 날 + rules.reviewDays */
export const reviewDeadline = (day: string) => addDays(day, rules.reviewDays)

/** 평가할 수 있는 사람: 호스트 + 체크인한 참여자(나 빼고). 나도 호스트이거나 체크인했어야 한다 */
export async function reviewTargets(db: AnyDb, themeId: string, userId: string) {
  const [t] = await db
    .select({ t: s.themes, hostUser: s.hosts.userId })
    .from(s.themes)
    .innerJoin(s.hosts, eq(s.hosts.id, s.themes.hostId))
    .where(eq(s.themes.id, themeId))
  if (!t) throw new FlowError('not-found', '테마를 찾을 수 없어요')
  const members = await memberIds(db, themeId)
  const checked = await db
    .select({ userId: s.checkins.userId })
    .from(s.checkins)
    .where(eq(s.checkins.themeId, themeId))
  const came = new Set(checked.map((c) => c.userId))
  const isHost = t.hostUser === userId
  const allowed = isHost || (members.includes(userId) && came.has(userId))
  const targets = [t.hostUser, ...members.filter((id) => came.has(id))].filter((id) => id !== userId)
  return { theme: t.t, hostUser: t.hostUser, allowed, targets }
}

export async function submitPeerReviews(
  db: AnyDb,
  input: {
    themeId: string
    fromUser: string
    reviews: { toUser: string; tags: string[] }[]
    firstVisit?: boolean
    now?: Date
  },
) {
  const { theme, allowed, targets } = await reviewTargets(db, input.themeId, input.fromUser)
  if (theme.status !== '여행 완료') throw new FlowError('not-done', '여행이 끝난 뒤에 평가할 수 있어요')
  if (!allowed) throw new FlowError('not-member', '함께 다녀온 참여자만 평가할 수 있어요')
  if (today(input.now) > reviewDeadline(theme.day)) throw new FlowError('late', '평가 기간이 끝났어요')
  const tagsOk = new Set(rules.behaviorTags)
  for (const r of input.reviews) {
    if (!targets.includes(r.toUser)) throw new FlowError('not-target', '함께 다녀온 사람만 평가할 수 있어요')
    if (r.tags.some((x) => !tagsOk.has(x))) throw new FlowError('tag', '정해진 태그만 고를 수 있어요')
  }
  return db.transaction(async (tx) => {
    for (const r of input.reviews) {
      const tags = [...new Set(r.tags)]
      if (!tags.length) {
        await tx
          .delete(s.peerReviews)
          .where(
            and(
              eq(s.peerReviews.themeId, input.themeId),
              eq(s.peerReviews.fromUser, input.fromUser),
              eq(s.peerReviews.toUser, r.toUser),
            ),
          )
        continue
      }
      await tx
        .insert(s.peerReviews)
        .values({ themeId: input.themeId, fromUser: input.fromUser, toUser: r.toUser, tags })
        .onConflictDoUpdate({
          target: [s.peerReviews.themeId, s.peerReviews.fromUser, s.peerReviews.toUser],
          set: { tags },
        })
    }
    // “남양주는 이번이 처음이었나요?” — 체크인 기록에 남긴다(방문 요약의 첫 방문 수)
    if (input.firstVisit !== undefined)
      await tx
        .update(s.checkins)
        .set({ firstVisit: input.firstVisit })
        .where(and(eq(s.checkins.themeId, input.themeId), eq(s.checkins.userId, input.fromUser)))
    return { saved: input.reviews.filter((r) => r.tags.length).length }
  })
}

// ── 차단 ─────────────────────────────────────────────
export async function blockUser(db: AnyDb, input: { userId: string; blockedId: string }) {
  if (input.userId === input.blockedId) throw new FlowError('self', '나를 차단할 수는 없어요')
  await db.insert(s.blocks).values({ userId: input.userId, blockedId: input.blockedId }).onConflictDoNothing()
}

// ── 참여 확인 · 체크인 도움 ──────────────────────────
/** 체크인 기록이 없어 검토 중일 때 “참여했다고 알리기” — 메모를 남기고 호스트에게 알린다 */
export async function tellAttended(db: AnyDb, input: { themeId: string; userId: string }) {
  const [row] = await db
    .select({ att: s.attendance, title: s.themes.title, hostUser: s.hosts.userId })
    .from(s.attendance)
    .innerJoin(s.themes, eq(s.themes.id, s.attendance.themeId))
    .innerJoin(s.hosts, eq(s.hosts.id, s.themes.hostId))
    .where(and(eq(s.attendance.themeId, input.themeId), eq(s.attendance.userId, input.userId)))
  if (row?.att.status !== '검토 중') throw new FlowError('none', '확인 중인 참여 기록이 없어요')
  await db
    .update(s.attendance)
    .set({ note: '참여했다고 알렸어요', updatedAt: new Date() })
    .where(and(eq(s.attendance.themeId, input.themeId), eq(s.attendance.userId, input.userId)))
  await notify(db, [row.hostUser], {
    title: '참여 확인 요청이 왔어요',
    body: `${row.title} · 체크인 기록이 없는 참여자`,
    href: `/host/themes/${input.themeId}/review`,
  })
}

/** “QR이 안 돼요” — 호스트에게 직접 확인을 부탁한다 */
export async function askHostCheckin(db: AnyDb, input: { themeId: string; userId: string }) {
  const ids = await memberIds(db, input.themeId)
  if (!ids.includes(input.userId)) throw new FlowError('not-member', '이 테마의 참여자가 아니에요')
  const [row] = await db
    .select({ title: s.themes.title, hostUser: s.hosts.userId, name: s.users.name })
    .from(s.themes)
    .innerJoin(s.hosts, eq(s.hosts.id, s.themes.hostId))
    .innerJoin(s.users, eq(s.users.id, input.userId))
    .where(eq(s.themes.id, input.themeId))
  await notify(db, [row?.hostUser], {
    title: '체크인 확인을 부탁했어요',
    body: `${row?.name ?? '참여자'} 님 · QR이 안 돼요`,
    href: '/host/checkin',
  })
}

// ── 새 날짜 알림(호스트 구독) ────────────────────────
export async function setHostSubscription(db: AnyDb, input: { userId: string; hostId: string; on: boolean }) {
  if (input.on)
    await db
      .insert(s.subscriptions)
      .values({ userId: input.userId, kind: 'host', key: input.hostId })
      .onConflictDoNothing()
  else
    await db
      .delete(s.subscriptions)
      .where(
        and(
          eq(s.subscriptions.userId, input.userId),
          eq(s.subscriptions.kind, 'host'),
          eq(s.subscriptions.key, input.hostId),
        ),
      )
  return input.on
}
