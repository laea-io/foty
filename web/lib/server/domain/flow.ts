// 신청 · 수락 · 취소 · 성사 · 일정 확정 · 체크인 — 기획안 6장 상태 모델.
// 정원은 행 잠금(SELECT … FOR UPDATE) 안에서 다시 세서 정원 초과·중복 확정을 막는다.
import { and, eq, inArray, lt, sql } from 'drizzle-orm'
import * as s from '@/lib/db/schema'
import { notify, systemMessage } from '@/lib/server/domain/notify'
import { type AnyDb, FlowError } from '@/lib/server/domain/types'
import { rules } from '@/lib/server/util/rules'

type Tx = AnyDb

const OPEN_APPS = ['신청 대기', '수락'] as const

/** 수락된 인원(본인 + 친구) */
export async function acceptedCount(db: Tx, themeId: string) {
  const r = await db
    .select({ n: sql<number>`coalesce(sum(${s.applications.party}), 0)::int` })
    .from(s.applications)
    .where(and(eq(s.applications.themeId, themeId), eq(s.applications.status, '수락')))
  return Number(r[0]?.n ?? 0)
}

async function lockTheme(db: Tx, themeId: string) {
  const [t] = await db.select().from(s.themes).where(eq(s.themes.id, themeId)).for('update')
  if (!t) throw new FlowError('not-found', '테마를 찾을 수 없어요')
  return t
}

async function hostUserId(db: Tx, hostId: string) {
  const [h] = await db.select({ userId: s.hosts.userId }).from(s.hosts).where(eq(s.hosts.id, hostId))
  return h?.userId
}

/** 이 테마에 수락된 참여자 id */
export async function memberIds(db: Tx, themeId: string) {
  const rows = await db
    .select({ userId: s.applications.userId })
    .from(s.applications)
    .where(and(eq(s.applications.themeId, themeId), eq(s.applications.status, '수락')))
  return rows.map((r) => r.userId)
}

/** 최소 인원을 막 넘었으면 성사 알림 */
async function announceIfMatched(db: Tx, t: typeof s.themes.$inferSelect, before: number, after: number) {
  if (before < t.min && after >= t.min) {
    const ids = await memberIds(db, t.id)
    await notify(db, [...ids, await hostUserId(db, t.hostId)], {
      title: `${t.title} 테마가 성사됐어요`,
      body: '그룹 공간에서 집결과 일정을 함께 정해요.',
      href: `/themes/${t.id}/matched`,
    })
    await systemMessage(db, t.id, '최소 인원이 모여 테마가 성사됐어요. 집결과 일정을 함께 정해요.')
  }
  if (after >= t.max && t.status === '모집 중') {
    await db.update(s.themes).set({ status: '모집 마감' }).where(eq(s.themes.id, t.id))
  }
}

// ── 신청 ─────────────────────────────────────────────
export async function apply(
  db: AnyDb,
  input: {
    themeId: string
    userId: string
    party?: number
    message?: string
    now?: Date
    /** 초대 링크로 들어온 친구: 초대한 사람이 잡아 둔 자리를 넘겨받는다(마감·모집 마감이어도 된다) */
    seatFrom?: '수락' | '신청 대기'
  },
): Promise<{ status: '수락' | '신청 대기'; applicationId: string }> {
  const party = Math.min(Math.max(input.party ?? 1, 1), rules.partyMax)
  const now = input.now ?? new Date()
  return db.transaction(async (tx) => {
    const t = await lockTheme(tx, input.themeId)
    if (input.seatFrom) {
      if (t.status === '취소' || t.status === '여행 완료') throw new FlowError('closed', '이미 끝난 테마예요')
    } else {
      if (t.status !== '모집 중') throw new FlowError('closed', '모집이 끝난 테마예요')
      if (t.deadline <= now) throw new FlowError('closed', '모집 마감 시간이 지났어요')
    }
    const hostUser = await hostUserId(tx, t.hostId)
    if (hostUser === input.userId) throw new FlowError('self', '내가 연 테마에는 신청할 수 없어요')
    const [prev] = await tx
      .select()
      .from(s.applications)
      .where(and(eq(s.applications.themeId, t.id), eq(s.applications.userId, input.userId)))
    if (prev && (OPEN_APPS as readonly string[]).includes(prev.status))
      throw new FlowError('duplicate', '이미 신청한 테마예요')
    if (prev?.status === '거절') throw new FlowError('rejected', '이 테마에는 다시 신청할 수 없어요')
    const before = await acceptedCount(tx, t.id)
    if (before + party > t.max) throw new FlowError('full', '남은 자리가 없어요')
    const status = input.seatFrom === '수락' || t.confirmMode === 'auto' ? '수락' : '신청 대기'
    const values = {
      party,
      message: input.message ?? '',
      status,
      decidedAt: status === '수락' ? now : null,
    } as const
    const [row] = prev
      ? await tx
          .update(s.applications)
          .set({ ...values, createdAt: now })
          .where(eq(s.applications.id, prev.id))
          .returning()
      : await tx
          .insert(s.applications)
          .values({ themeId: t.id, userId: input.userId, ...values })
          .returning()
    if (status === '수락') {
      await announceIfMatched(tx, t, before, before + party)
      if (!input.seatFrom)
        await notify(tx, [hostUser], {
          title: '새 참여자가 함께해요',
          body: `${t.title} · ${before + party}/${t.max}명`,
          href: `/host/themes/${t.id}/applicants`,
        })
    } else
      await notify(tx, [hostUser], {
        title: '새 신청이 왔어요',
        body: t.title,
        href: `/host/themes/${t.id}/applicants`,
      })
    return { status, applicationId: row.id }
  })
}

/** 신청 취소 — 성사 전에만(성사 뒤 빠지는 처리는 기획안 미결 → 호스트에게 문의) */
export async function cancelApplication(db: AnyDb, input: { themeId: string; userId: string }) {
  return db.transaction(async (tx) => {
    const t = await lockTheme(tx, input.themeId)
    const [a] = await tx
      .select()
      .from(s.applications)
      .where(and(eq(s.applications.themeId, t.id), eq(s.applications.userId, input.userId)))
    if (!a || !(OPEN_APPS as readonly string[]).includes(a.status))
      throw new FlowError('none', '취소할 신청이 없어요')
    const accepted = await acceptedCount(tx, t.id)
    if (a.status === '수락' && accepted >= t.min)
      throw new FlowError('matched', '성사된 뒤에는 그룹 공간에서 호스트에게 먼저 알려 주세요')
    await tx
      .update(s.applications)
      .set({ status: '신청 취소', decidedAt: new Date() })
      .where(eq(s.applications.id, a.id))
    if (t.status === '모집 마감' && t.deadline > new Date())
      await tx.update(s.themes).set({ status: '모집 중' }).where(eq(s.themes.id, t.id))
    if (a.status === '수락')
      await notify(tx, [await hostUserId(tx, t.hostId)], {
        title: '참여자 한 명이 신청을 취소했어요',
        body: `${t.title} · ${accepted - a.party}/${t.max}명`,
        href: `/host/themes/${t.id}/applicants`,
      })
    // 이 신청의 초대 링크로 들어온 친구에게도 알린다(친구 신청은 그대로 둔다)
    const friends = await tx
      .select({ userId: s.applications.userId })
      .from(s.applications)
      .where(and(eq(s.applications.inviteToken, a.id), inArray(s.applications.status, [...OPEN_APPS])))
    await notify(
      tx,
      friends.map((f) => f.userId),
      {
        title: '함께 신청한 친구가 취소했어요',
        body: `${t.title} · 내 신청은 그대로예요`,
        href: `/themes/${t.id}`,
      },
    )
  })
}

/** 호스트의 수락·거절. 거절 사유는 신청자에게 전하지 않는다 */
export async function decide(
  db: AnyDb,
  input: { applicationId: string; hostUserId: string; accept: boolean },
) {
  return db.transaction(async (tx) => {
    const [a] = await tx.select().from(s.applications).where(eq(s.applications.id, input.applicationId))
    if (!a) throw new FlowError('not-found', '신청을 찾을 수 없어요')
    const t = await lockTheme(tx, a.themeId)
    if ((await hostUserId(tx, t.hostId)) !== input.hostUserId)
      throw new FlowError('forbidden', '이 테마의 호스트가 아니에요')
    if (a.status !== '신청 대기') throw new FlowError('decided', '이미 처리한 신청이에요')
    if (!input.accept) {
      await tx
        .update(s.applications)
        .set({ status: '거절', decidedAt: new Date() })
        .where(eq(s.applications.id, a.id))
      await notify(tx, [a.userId], {
        title: '이번 테마는 함께하지 못하게 됐어요',
        body: t.title,
        href: `/themes/${t.id}/rejected`,
      })
      return { status: '거절' as const }
    }
    const before = await acceptedCount(tx, t.id)
    if (before + a.party > t.max) throw new FlowError('full', '남은 자리가 없어요')
    await tx
      .update(s.applications)
      .set({ status: '수락', decidedAt: new Date() })
      .where(eq(s.applications.id, a.id))
    await notify(tx, [a.userId], { title: '신청이 수락됐어요', body: t.title, href: `/themes/${t.id}` })
    await announceIfMatched(tx, t, before, before + a.party)
    return { status: '수락' as const }
  })
}

/** 호스트가 테마 취소 */
export async function hostCancel(
  db: AnyDb,
  input: { themeId: string; hostUserId: string; reason: string; message?: string },
) {
  return db.transaction(async (tx) => {
    const t = await lockTheme(tx, input.themeId)
    if ((await hostUserId(tx, t.hostId)) !== input.hostUserId)
      throw new FlowError('forbidden', '이 테마의 호스트가 아니에요')
    if (t.status === '취소' || t.status === '여행 완료') throw new FlowError('closed', '이미 끝난 테마예요')
    await tx
      .update(s.themes)
      .set({ status: '취소', cancelReason: [input.reason, input.message].filter(Boolean).join(' · ') })
      .where(eq(s.themes.id, t.id))
    const apps = await tx
      .select({ userId: s.applications.userId })
      .from(s.applications)
      .where(and(eq(s.applications.themeId, t.id), inArray(s.applications.status, [...OPEN_APPS])))
    await notify(
      tx,
      apps.map((a) => a.userId),
      { title: '호스트가 테마를 취소했어요', body: t.title, href: `/themes/${t.id}/host-cancelled` },
    )
  })
}

/** 호스트가 최종 일정 확정 — 확인 중인 주요 변경이 있으면 안 된다 */
export async function confirmSchedule(db: AnyDb, input: { themeId: string; hostUserId: string }) {
  return db.transaction(async (tx) => {
    const t = await lockTheme(tx, input.themeId)
    if ((await hostUserId(tx, t.hostId)) !== input.hostUserId)
      throw new FlowError('forbidden', '이 테마의 호스트가 아니에요')
    const pending = await tx
      .select({ id: s.changes.id })
      .from(s.changes)
      .where(and(eq(s.changes.themeId, t.id), eq(s.changes.status, '변경 확인 중')))
    if (t.status !== '일정 조율 중' && t.status !== '모집 마감')
      throw new FlowError('status', '모집이 끝나고 일정을 조율하는 중에만 확정할 수 있어요')
    if (pending.length) throw new FlowError('pending', '참여자 확인을 기다리는 변경이 있어요')
    if ((await acceptedCount(tx, t.id)) < t.min) throw new FlowError('not-matched', '아직 성사되지 않았어요')
    await tx.update(s.themes).set({ status: '일정 확정' }).where(eq(s.themes.id, t.id))
    await notify(tx, await memberIds(tx, t.id), {
      title: '일정이 확정됐어요',
      body: t.title,
      href: `/trips/${t.id}`,
    })
  })
}

// ── 시간이 지나면 넘어가는 상태 ─────────────────────
/** 1분마다: 마감 → 조율 시작/자동 취소, 여행 날 지나면 완료 + 체크인 없는 사람 검토 중 */
export async function tick(db: AnyDb, now = new Date()) {
  const due = await db
    .select()
    .from(s.themes)
    .where(and(inArray(s.themes.status, ['모집 중', '모집 마감']), lt(s.themes.deadline, now)))
  for (const t of due) {
    await db.transaction(async (tx) => {
      // 마감까지 친구가 들어오지 않은 2인 신청은 혼자 신청으로 바꾼다(초대 기한)
      const solo = await tx
        .update(s.applications)
        .set({ party: 1 })
        .where(
          and(
            eq(s.applications.themeId, t.id),
            inArray(s.applications.status, [...OPEN_APPS]),
            sql`${s.applications.party} > 1`,
          ),
        )
        .returning({ userId: s.applications.userId })
      await notify(
        tx,
        solo.map((x) => x.userId),
        { title: '친구가 신청하지 않아 혼자 신청으로 바뀌었어요', body: t.title, href: `/themes/${t.id}` },
      )
      const n = await acceptedCount(tx, t.id)
      if (n >= t.min) {
        await tx.update(s.themes).set({ status: '일정 조율 중' }).where(eq(s.themes.id, t.id))
        const dropped = await tx
          .update(s.applications)
          .set({ status: '신청 취소', decidedAt: now })
          .where(and(eq(s.applications.themeId, t.id), eq(s.applications.status, '신청 대기')))
          .returning({ userId: s.applications.userId })
        await notify(
          tx,
          dropped.map((x) => x.userId),
          {
            title: '모집이 마감돼 신청이 닫혔어요',
            body: `${t.title} · 호스트가 마감 전에 확인하지 못했어요`,
            href: `/themes/${t.id}`,
          },
        )
      } else {
        await tx
          .update(s.themes)
          .set({ status: '취소', cancelReason: '최소 인원 미달' })
          .where(eq(s.themes.id, t.id))
        const apps = await tx
          .select({ userId: s.applications.userId })
          .from(s.applications)
          .where(and(eq(s.applications.themeId, t.id), inArray(s.applications.status, [...OPEN_APPS])))
        await notify(tx, [...apps.map((a) => a.userId), await hostUserId(tx, t.hostId)], {
          title: '최소 인원이 모이지 않아 취소됐어요',
          body: t.title,
          href: `/themes/${t.id}/cancelled`,
        })
      }
    })
  }
  // 여행 날 끝 시각이 지나면 완료
  const running = await db
    .select()
    .from(s.themes)
    .where(inArray(s.themes.status, ['일정 조율 중', '일정 확정']))
  for (const t of running) {
    const end = new Date(`${t.day}T${t.end}:00+09:00`)
    if (end > now) continue
    await db.transaction(async (tx) => {
      await tx.update(s.themes).set({ status: '여행 완료' }).where(eq(s.themes.id, t.id))
      const ids = await memberIds(tx, t.id)
      const checked = await tx
        .select({ userId: s.checkins.userId })
        .from(s.checkins)
        .where(eq(s.checkins.themeId, t.id))
      const done = new Set(checked.map((c) => c.userId))
      for (const userId of ids) {
        await tx
          .insert(s.attendance)
          .values({ themeId: t.id, userId, status: done.has(userId) ? '참여 확인' : '검토 중' })
          .onConflictDoNothing()
      }
      await notify(
        tx,
        ids.filter((u) => done.has(u)),
        {
          title: '여행은 어땠나요?',
          body: '함께한 사람들에게 평가를 남겨 주세요.',
          href: `/trips/${t.id}/review`,
        },
      )
      await notify(tx, [await hostUserId(tx, t.hostId)], {
        title: '여행이 끝났어요',
        body: `${t.title} · 체크인 ${done.size}/${ids.length}명 — 참여자 평가를 남겨 주세요`,
        href: `/host/themes/${t.id}/review`,
      })
    })
  }
  await reminders(db, now)
  return { closed: due.length }
}

// ── 체크인 ───────────────────────────────────────────
export async function checkin(
  db: AnyDb,
  input: {
    themeId: string
    userId: string
    method?: 'qr' | 'host'
    anyDay?: boolean
    now?: Date
    firstVisit?: boolean
  },
) {
  const now = input.now ?? new Date()
  return db.transaction(async (tx) => {
    const t = await lockTheme(tx, input.themeId)
    const ids = await memberIds(tx, t.id)
    if (!ids.includes(input.userId)) throw new FlowError('not-member', '이 테마의 참여자가 아니에요')
    if (t.status === '취소') throw new FlowError('closed', '취소된 테마예요')
    const todayKst = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(now)
    if (!input.anyDay && todayKst !== t.day)
      throw new FlowError('not-today', '여행 날에만 체크인할 수 있어요')
    const [row] = await tx
      .insert(s.checkins)
      .values({
        themeId: t.id,
        userId: input.userId,
        placeId: t.corePlaceId,
        method: input.method ?? 'qr',
        firstVisit: input.firstVisit,
        createdAt: now,
      })
      .onConflictDoNothing()
      .returning()
    await tx
      .insert(s.attendance)
      .values({ themeId: t.id, userId: input.userId, status: '참여 확인' })
      .onConflictDoUpdate({
        target: [s.attendance.themeId, s.attendance.userId],
        set: { status: '참여 확인', updatedAt: now },
      })
    // 같은 장소 몇 번째 방문인지(스탬프 방문 횟수)
    const visits = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(s.checkins)
      .where(and(eq(s.checkins.userId, input.userId), eq(s.checkins.placeId, t.corePlaceId)))
    return { created: !!row, placeId: t.corePlaceId, visits: Number(visits[0]?.n ?? 1) }
  })
}

/** 같은 사람에게 같은 알림(제목+주소)을 이미 보냈으면 건너뛴다 */
async function notifyOnce(db: Tx, userIds: string[], n: { title: string; body?: string; href: string }) {
  if (!userIds.length) return
  const sent = await db
    .select({ userId: s.notifications.userId })
    .from(s.notifications)
    .where(
      and(
        inArray(s.notifications.userId, userIds),
        eq(s.notifications.title, n.title),
        eq(s.notifications.href, n.href),
      ),
    )
  const had = new Set(sent.map((x) => x.userId))
  await notify(
    db,
    userIds.filter((u) => !had.has(u)),
    n,
  )
}

/** 여행 날 아침(08시 이후) 체크인 안내 · 완료 3일 뒤 평가 안 한 사람에게 한 번 더 */
async function reminders(db: AnyDb, now = new Date()) {
  const kstDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(now)
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', hour12: false }).format(now),
  )
  if (hour >= 8) {
    const todays = await db
      .select()
      .from(s.themes)
      .where(and(eq(s.themes.day, kstDay), inArray(s.themes.status, ['일정 조율 중', '일정 확정'])))
    for (const t of todays)
      await notifyOnce(db, await memberIds(db, t.id), {
        title: `오늘 ${t.start} ${t.title}`,
        body: '현장에서 호스트의 QR을 찍어 체크인해 주세요.',
        href: `/trips/${t.id}/checkin`,
      })
  }
  const d3 = new Date(now.getTime() - 3 * 86400000)
  const threeAgo = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(d3)
  const done = await db
    .select()
    .from(s.themes)
    .where(and(eq(s.themes.day, threeAgo), eq(s.themes.status, '여행 완료')))
  for (const t of done) {
    const reviewed = await db
      .select({ userId: s.peerReviews.fromUser })
      .from(s.peerReviews)
      .where(eq(s.peerReviews.themeId, t.id))
    const did = new Set(reviewed.map((r) => r.userId))
    const checked = await db
      .select({ userId: s.checkins.userId })
      .from(s.checkins)
      .where(eq(s.checkins.themeId, t.id))
    await notifyOnce(
      db,
      checked.map((c) => c.userId).filter((u) => !did.has(u)),
      { title: '평가 기간이 곧 끝나요', body: t.title, href: `/trips/${t.id}/review` },
    )
  }
}
