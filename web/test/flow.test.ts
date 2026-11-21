import { and, eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import * as s from '@/lib/db/schema'
import { confirmChange, decideChange, propose } from '@/lib/server/domain/changes'
import {
  acceptedCount,
  apply,
  cancelApplication,
  checkin,
  confirmSchedule,
  decide,
  hostCancel,
  tick,
} from '@/lib/server/domain/flow'
import { loadTheme, relation } from '@/lib/server/domain/read'
import { FlowError } from '@/lib/server/domain/types'
import { NOW, testDb } from './db'

let t: Awaited<ReturnType<typeof testDb>>
beforeEach(async () => {
  t = await testDb()
})

const appStatus = async (themeId: string, userId: string) =>
  (
    await t.db
      .select()
      .from(s.applications)
      .where(and(eq(s.applications.themeId, themeId), eq(s.applications.userId, userId)))
  )[0]?.status

describe('seed', () => {
  it('builds the demo weekend after the next Friday deadline', async () => {
    expect(t.seeded.skipped).toBe(false)
    if (!t.seeded.skipped) expect(t.seeded.saturday).toBe('2026-11-28')
    const th = await loadTheme(t.db, 'dasan-lunch', ['산책'])
    expect(th?.current).toBe(2)
    expect(th?.pending).toBe(1)
    expect(th?.route).toBe('여유당 → 다산 한정식 → 두물머리 → 카페')
    expect(th?.date).toBe('11.28 (토)')
    expect(th?.deadline).toBe('11.27 (금) 18:00')
    expect(th?.reason).toBe('날짜가 맞고, 산책을 좋아해요')
    expect(th?.stops[3].checked).toBeNull()
  })
})

describe('apply', () => {
  it('auto-confirm host: accepts at once and announces the match', async () => {
    const me = await t.uid('dohyun')
    const r = await apply(t.db, { themeId: 'bongseonsa-temple', userId: me, now: NOW })
    expect(r.status).toBe('수락')
    expect(await acceptedCount(t.db, 'bongseonsa-temple')).toBe(3)
    const notes = await t.db.select().from(s.notifications).where(eq(s.notifications.userId, me))
    expect(notes.some((n) => n.title.includes('성사'))).toBe(true)
  })

  it('manual host: waits for the host, then the host accepts and the theme matches', async () => {
    const me = await t.uid('kanghyun')
    const host = await t.uid('dasan-owner')
    const [a] = await t.db
      .select()
      .from(s.applications)
      .where(and(eq(s.applications.themeId, 'dasan-lunch'), eq(s.applications.userId, me)))
    expect(a.status).toBe('신청 대기')
    await decide(t.db, { applicationId: a.id, hostUserId: host, accept: true })
    const th = await loadTheme(t.db, 'dasan-lunch')
    expect(th?.matched).toBe(true)
    expect((await relation(t.db, 'dasan-lunch', me)).role).toBe('member')
  })

  it('never overfills: party of two does not fit in one seat', async () => {
    // 봉선사 2/5 → 3명 더 들어가면 5/5
    await apply(t.db, { themeId: 'bongseonsa-temple', userId: await t.uid('yuna'), party: 2, now: NOW })
    await apply(t.db, { themeId: 'bongseonsa-temple', userId: await t.uid('dohyun'), now: NOW })
    const th = await loadTheme(t.db, 'bongseonsa-temple')
    expect(th?.current).toBe(5)
    expect(th?.status).toBe('모집 마감')
    await expect(
      apply(t.db, { themeId: 'bongseonsa-temple', userId: await t.uid('kanghyun'), now: NOW }),
    ).rejects.toThrow(FlowError)
  })

  it('refuses duplicates, the host themself, and closed themes', async () => {
    const me = await t.uid('kanghyun')
    await expect(apply(t.db, { themeId: 'dasan-lunch', userId: me, now: NOW })).rejects.toMatchObject({
      code: 'duplicate',
    })
    await expect(
      apply(t.db, { themeId: 'dasan-lunch', userId: await t.uid('dasan-owner'), now: NOW }),
    ).rejects.toMatchObject({
      code: 'self',
    })
    await expect(apply(t.db, { themeId: 'sujongsa-tea', userId: me, now: NOW })).rejects.toMatchObject({
      code: 'closed',
    })
  })

  it('cancel before the match is fine; after the match it is refused', async () => {
    const me = await t.uid('kanghyun')
    await cancelApplication(t.db, { themeId: 'dumulmeori-sunset', userId: me })
    expect(await appStatus('dumulmeori-sunset', me)).toBe('신청 취소')
    // 다시 신청할 수 있다
    await apply(t.db, { themeId: 'dumulmeori-sunset', userId: me, now: NOW })
    expect(await appStatus('dumulmeori-sunset', me)).toBe('신청 대기')
    await expect(
      cancelApplication(t.db, { themeId: 'gwangneung-morning', userId: me }),
    ).rejects.toMatchObject({ code: 'matched' })
  })

  it('rejected applicant hears no reason and cannot re-apply', async () => {
    const me = await t.uid('kanghyun')
    const [a] = await t.db
      .select()
      .from(s.applications)
      .where(and(eq(s.applications.themeId, 'dumulmeori-sunset'), eq(s.applications.userId, me)))
    await decide(t.db, { applicationId: a.id, hostUserId: await t.uid('seoyeon'), accept: false })
    const [n] = await t.db
      .select()
      .from(s.notifications)
      .where(eq(s.notifications.href, '/themes/dumulmeori-sunset/rejected'))
    expect(n.body).toBe('두물머리 해 질 녘 사진 산책')
    await expect(apply(t.db, { themeId: 'dumulmeori-sunset', userId: me, now: NOW })).rejects.toMatchObject({
      code: 'rejected',
    })
  })

  it('only the host decides', async () => {
    const [a] = await t.db
      .select()
      .from(s.applications)
      .where(eq(s.applications.status, '신청 대기'))
      .limit(1)
    await expect(
      decide(t.db, { applicationId: a.id, hostUserId: await t.uid('yuna'), accept: true }),
    ).rejects.toMatchObject({
      code: 'forbidden',
    })
  })
})

describe('time passes', () => {
  it('deadline: matched themes start coordinating, others auto-cancel', async () => {
    const after = new Date('2026-11-27T18:30:00+09:00')
    await tick(t.db, after)
    expect((await loadTheme(t.db, 'dasan-lunch'))?.status).toBe('취소') // 2/3
    expect((await loadTheme(t.db, 'sujongsa-tea'))?.status).toBe('일정 조율 중') // 4/4
    // 대기 중이던 신청은 정리된다
    expect(await appStatus('dasan-lunch', await t.uid('kanghyun'))).toBe('신청 대기') // 취소된 테마는 그대로 두고 알림만
    const n = await t.db
      .select()
      .from(s.notifications)
      .where(eq(s.notifications.href, '/themes/dasan-lunch/cancelled'))
    expect(n.length).toBeGreaterThan(0)
  })

  it('after the trip: completed, missing check-ins go to review', async () => {
    const me = await t.uid('kanghyun')
    await checkin(t.db, {
      themeId: 'gwangneung-morning',
      userId: me,
      now: new Date('2026-11-29T09:35:00+09:00'),
    })
    await tick(t.db, new Date('2026-11-29T15:00:00+09:00'))
    expect((await loadTheme(t.db, 'gwangneung-morning'))?.status).toBe('여행 완료')
    const att = await t.db.select().from(s.attendance).where(eq(s.attendance.themeId, 'gwangneung-morning'))
    expect(att.find((a) => a.userId === me)?.status).toBe('참여 확인')
    expect(att.filter((a) => a.status === '검토 중').length).toBe(3)
  })
})

describe('check-in', () => {
  it('only members, only on the day (unless demo), counts visits per place', async () => {
    const me = await t.uid('kanghyun')
    await expect(
      checkin(t.db, { themeId: 'gwangneung-morning', userId: me, now: NOW }),
    ).rejects.toMatchObject({ code: 'not-today' })
    await expect(
      checkin(t.db, { themeId: 'gwangneung-morning', userId: await t.uid('minjae'), now: NOW, anyDay: true }),
    ).rejects.toMatchObject({
      code: 'not-member',
    })
    const r = await checkin(t.db, { themeId: 'gwangneung-morning', userId: me, now: NOW, anyDay: true })
    expect(r.placeId).toBe('gwangneung')
    expect(r.visits).toBe(1)
    const again = await checkin(t.db, { themeId: 'gwangneung-morning', userId: me, now: NOW, anyDay: true })
    expect(again.created).toBe(false)
  })
})

describe('schedule changes', () => {
  it('major change applies only after everyone confirms', async () => {
    const [c] = await t.db.select().from(s.changes).where(eq(s.changes.status, '변경 확인 중'))
    let r = await confirmChange(t.db, { changeId: c.id, userId: await t.uid('dohyun') })
    expect(r).toEqual({ confirmed: 4, total: 5 })
    r = await confirmChange(t.db, { changeId: c.id, userId: await t.uid('kanghyun') })
    const [after] = await t.db.select().from(s.changes).where(eq(s.changes.id, c.id))
    expect(after.status).toBe('반영됨')
    const th = await loadTheme(t.db, 'gwangneung-morning')
    expect(th?.meetDetail).toBe('08:20 · 상봉역 1번 출구')
    expect(th?.scheduleVersion).toBe(4)
    // 이제 확정할 수 있다
    await confirmSchedule(t.db, { themeId: 'gwangneung-morning', hostUserId: await t.uid('harin') })
    expect((await loadTheme(t.db, 'gwangneung-morning'))?.status).toBe('일정 확정')
  })

  it('cannot confirm the schedule while a major change is pending', async () => {
    await expect(
      confirmSchedule(t.db, { themeId: 'gwangneung-morning', hostUserId: await t.uid('harin') }),
    ).rejects.toMatchObject({
      code: 'pending',
    })
  })

  it('minor stop change: host applies it and the course updates', async () => {
    const [c] = await t.db.select().from(s.changes).where(eq(s.changes.status, '제안됨'))
    await decideChange(t.db, { changeId: c.id, hostUserId: await t.uid('harin'), accept: true })
    const th = await loadTheme(t.db, 'gwangneung-morning')
    expect(th?.stops[2].name).toBe('두부 전문점')
  })

  it('only the host may move the core place time; fixed stops cannot be swapped', async () => {
    const me = await t.uid('kanghyun')
    await expect(
      propose(t.db, {
        themeId: 'gwangneung-morning',
        userId: me,
        kind: 'core_time',
        label: '핵심 장소 시간',
        from: '09:30',
        to: '10:00',
      }),
    ).rejects.toMatchObject({ code: 'host-only' })
    const c = await propose(t.db, {
      themeId: 'gwangneung-morning',
      userId: me,
      kind: 'stop',
      label: '두 번째 장소',
      from: '봉선사',
      to: '실학박물관',
      payload: { ord: 1, placeId: 'silhak' },
    })
    expect(c.status).toBe('제안됨')
  })

  it('a new major change reopens a confirmed schedule', async () => {
    await t.db.update(s.themes).set({ status: '일정 확정' }).where(eq(s.themes.id, 'byeollae-drip'))
    await propose(t.db, {
      themeId: 'byeollae-drip',
      userId: await t.uid('yuna'),
      kind: 'meet_time',
      label: '집결 시간',
      from: '13:20',
      to: '13:00',
    })
    expect((await loadTheme(t.db, 'byeollae-drip'))?.status).toBe('일정 조율 중')
  })
})

describe('host cancel', () => {
  it('cancels and tells everyone who applied', async () => {
    await hostCancel(t.db, {
      themeId: 'dasan-lunch',
      hostUserId: await t.uid('dasan-owner'),
      reason: '가게 사정',
    })
    expect((await loadTheme(t.db, 'dasan-lunch'))?.status).toBe('취소')
    const n = await t.db
      .select()
      .from(s.notifications)
      .where(eq(s.notifications.href, '/themes/dasan-lunch/host-cancelled'))
    expect(n.length).toBe(3)
  })
})
