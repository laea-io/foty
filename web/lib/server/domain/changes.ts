// 일정 변경 — 참여자가 제안하고 호스트가 일정 버전을 정리한다(기획안 5.5, 6장).
// 주요 변경(날짜 · 집결 · 예산 · 핵심 장소 시간)은 참여자 전원 확인 뒤 반영된다.
import { and, eq, sql } from 'drizzle-orm'
import * as s from '@/lib/db/schema'
import { memberIds } from './flow'
import { notify, systemMessage } from './notify'
import { type AnyDb, FlowError } from './types'

export const MAJOR_KINDS = ['date', 'meet_time', 'meet_place', 'budget', 'core_time'] as const
export type ChangeKind = (typeof MAJOR_KINDS)[number] | 'stop'

async function themeAndHost(db: AnyDb, themeId: string) {
  const [row] = await db
    .select({ t: s.themes, hostUser: s.hosts.userId })
    .from(s.themes)
    .innerJoin(s.hosts, eq(s.hosts.id, s.themes.hostId))
    .where(eq(s.themes.id, themeId))
  if (!row) throw new FlowError('not-found', '테마를 찾을 수 없어요')
  return row
}

/** 그룹 사람(호스트 + 수락된 참여자) */
export async function groupIds(db: AnyDb, themeId: string) {
  const { hostUser } = await themeAndHost(db, themeId)
  return [hostUser, ...(await memberIds(db, themeId))]
}

export async function propose(
  db: AnyDb,
  input: {
    themeId: string
    userId: string
    kind: ChangeKind
    label: string
    from: string
    to: string
    source?: string
    payload?: Record<string, unknown>
  },
) {
  const { t, hostUser } = await themeAndHost(db, input.themeId)
  const group = [hostUser, ...(await memberIds(db, t.id))]
  if (!group.includes(input.userId)) throw new FlowError('not-member', '그룹 참여자만 제안할 수 있어요')
  if (input.kind === 'core_time' && input.userId !== hostUser)
    throw new FlowError('host-only', '핵심 장소와 그 시간은 호스트만 바꿀 수 있어요')
  if (input.kind === 'stop' && input.payload?.fixed) throw new FlowError('fixed', '핵심 장소는 고정이에요')
  const major = (MAJOR_KINDS as readonly string[]).includes(input.kind)
  return db.transaction(async (tx) => {
    const [c] = await tx
      .insert(s.changes)
      .values({
        themeId: t.id,
        proposerId: input.userId,
        kind: input.kind,
        label: input.label,
        fromText: input.from,
        toText: input.to,
        source: input.source ?? '직접',
        major,
        status: major ? '변경 확인 중' : '제안됨',
        payload: input.payload ?? {},
      })
      .returning()
    if (major) {
      // 제안한 사람은 확인한 것으로 센다. 확정됐던 일정은 다시 조율 중으로
      await tx.insert(s.changeConfirms).values({ changeId: c.id, userId: input.userId })
      if (t.status === '일정 확정')
        await tx.update(s.themes).set({ status: '일정 조율 중' }).where(eq(s.themes.id, t.id))
      await notify(
        tx,
        group.filter((id) => id !== input.userId),
        {
          title: `${input.label} 변경 확인이 필요해요`,
          body: `${input.from} → ${input.to}`,
          href: `/trips/${t.id}`,
        },
      )
    } else {
      await notify(tx, [hostUser], {
        title: '코스 제안이 들어왔어요',
        body: `${input.label}: ${input.to}`,
        href: `/host/themes/${t.id}/space`,
      })
    }
    return c
  })
}

/** 참여자 확인 — 전원 확인하면 반영 */
export async function confirmChange(db: AnyDb, input: { changeId: string; userId: string; note?: string }) {
  return db.transaction(async (tx) => {
    const [c] = await tx.select().from(s.changes).where(eq(s.changes.id, input.changeId)).for('update')
    if (!c) throw new FlowError('not-found', '변경을 찾을 수 없어요')
    if (c.status !== '변경 확인 중') throw new FlowError('decided', '이미 정리된 변경이에요')
    const group = await groupIds(tx, c.themeId)
    if (!group.includes(input.userId)) throw new FlowError('not-member', '그룹 참여자만 확인할 수 있어요')
    await tx
      .insert(s.changeConfirms)
      .values({ changeId: c.id, userId: input.userId, note: input.note })
      .onConflictDoNothing()
    const got = await tx
      .select({ userId: s.changeConfirms.userId })
      .from(s.changeConfirms)
      .where(eq(s.changeConfirms.changeId, c.id))
    const ok = new Set(got.map((g) => g.userId))
    if (group.every((id) => ok.has(id))) await applyChange(tx, c)
    return { confirmed: ok.size, total: group.length }
  })
}

/** 호스트의 반영·반려(작은 변경) */
export async function decideChange(
  db: AnyDb,
  input: { changeId: string; hostUserId: string; accept: boolean },
) {
  return db.transaction(async (tx) => {
    const [c] = await tx.select().from(s.changes).where(eq(s.changes.id, input.changeId)).for('update')
    if (!c) throw new FlowError('not-found', '변경을 찾을 수 없어요')
    const { hostUser } = await themeAndHost(tx, c.themeId)
    if (hostUser !== input.hostUserId) throw new FlowError('forbidden', '호스트만 정리할 수 있어요')
    if (c.status === '반영됨' || c.status === '반려됨')
      throw new FlowError('decided', '이미 정리된 변경이에요')
    if (!input.accept) {
      await tx
        .update(s.changes)
        .set({ status: '반려됨', decidedAt: new Date() })
        .where(eq(s.changes.id, c.id))
      if (c.proposerId && c.proposerId !== hostUser)
        await notify(tx, [c.proposerId], {
          title: '제안한 변경은 이번에 반영되지 않았어요',
          body: `${c.label}: ${c.toText}`,
          href: `/trips/${c.themeId}/history`,
        })
      return
    }
    if (c.major) throw new FlowError('needs-confirm', '주요 변경은 참여자 모두가 확인해야 반영돼요')
    await applyChange(tx, c)
  })
}

/** 반영: 일정 버전 +1, 변경 내용을 일정에 넣는다 */
async function applyChange(tx: AnyDb, c: typeof s.changes.$inferSelect) {
  const p = c.payload as {
    ord?: number
    placeId?: string
    time?: string
    day?: string
    meet?: string
    costWon?: number
  }
  if (c.kind === 'stop' && p.ord != null && p.placeId)
    await tx
      .update(s.themeStops)
      .set({ placeId: p.placeId })
      .where(and(eq(s.themeStops.themeId, c.themeId), eq(s.themeStops.ord, p.ord)))
  if (c.kind === 'meet_time' || c.kind === 'meet_place')
    await tx
      .update(s.themes)
      .set({ meetDetail: p.meet ?? c.toText })
      .where(eq(s.themes.id, c.themeId))
  if (c.kind === 'date' && p.day)
    await tx.update(s.themes).set({ day: p.day }).where(eq(s.themes.id, c.themeId))
  if (c.kind === 'budget' && p.costWon != null)
    await tx.update(s.themes).set({ costWon: p.costWon }).where(eq(s.themes.id, c.themeId))
  if (c.kind === 'core_time' && p.time)
    await tx
      .update(s.themeStops)
      .set({ time: p.time })
      .where(and(eq(s.themeStops.themeId, c.themeId), eq(s.themeStops.fixed, true)))
  await tx.update(s.changes).set({ status: '반영됨', decidedAt: new Date() }).where(eq(s.changes.id, c.id))
  await tx
    .update(s.themes)
    .set({ scheduleVersion: sql`${s.themes.scheduleVersion} + 1` })
    .where(eq(s.themes.id, c.themeId))
  await systemMessage(tx, c.themeId, `${c.label}이(가) ${c.fromText} → ${c.toText}(으)로 바뀌었어요`)
  // 모든 참여자에게: 일정이 바뀌었어요(채팅을 안 보고 있어도 알 수 있게)
  await notify(tx, await memberIds(tx, c.themeId), {
    title: `일정이 바뀌었어요 · ${c.label}`,
    body: `${c.fromText} → ${c.toText}`,
    href: `/trips/${c.themeId}`,
  })
}
