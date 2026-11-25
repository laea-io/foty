// 계정·마이·공통 — 읽기 모양과 쓰기 동작을 시연 세계에서 확인한다
import { and, eq, isNull } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import * as s from '@/lib/db/schema'
import {
  fileReport,
  markRead,
  privacyState,
  saveOnboarding,
  savePrivacy,
  setBlock,
  setSubscription,
} from '@/lib/server/domain/account'
import { decideHost, resolveReport } from '@/lib/server/domain/admin'
import { FlowError } from '@/lib/server/domain/types'
import { adminQueue } from '@/lib/server/queries/admin'
import { myPage, notificationsOf } from '@/lib/server/queries/my'
import { hostProfile, isSubscribed, userProfile } from '@/lib/server/queries/profiles'
import { blocksAndReports, reportTarget } from '@/lib/server/queries/safety'
import { searchAll } from '@/lib/server/queries/search'
import { regionThemes, seasonSeries, stampbook, stampPlace } from '@/lib/server/queries/stamps'
import { NOW, testDb } from '@/test/db'

let t: Awaited<ReturnType<typeof testDb>>
beforeEach(async () => {
  t = await testDb()
})

const user = async (id: string) => (await t.db.select().from(s.users).where(eq(s.users.id, id)))[0]

describe('reads', () => {
  it('my page: trips from 참여 확인, upcoming/applying, stamps', async () => {
    const me = await t.uid('kanghyun')
    const d = await myPage(t.db, me, NOW)
    expect(d.trips).toBe(4)
    expect(d.upcoming).toBe(2)
    expect(d.applying).toBe(2)
    expect(d.stampCount).toBe(3)
    expect(d.tags).toEqual([])
    expect(d.row.slice(0, 3).every((c) => c.got)).toBe(true)
  })

  it('stampbook: cells per region, visit counts, recruiting links', async () => {
    const me = await t.uid('kanghyun')
    const b = await stampbook(t.db, me, NOW)
    expect(b.stampCount).toBe(3)
    expect(b.regionCount).toBe(2)
    const paldang = b.groups.find((g) => g.region.id === 'paldang')
    const dum = paldang?.cells.find((c) => c.id === 'dumulmeori')
    expect(dum?.got).toBe(true)
    expect(dum?.caption).toBe('2회 · 11.15')
    // 물의정원: 두물머리 해 질 녘(모집 중) 코스에 있다
    const wg = paldang?.cells.find((c) => c.id === 'water-garden')
    expect(wg?.got).toBe(false)
    expect(wg?.caption).toBe('모집 중 1')
    expect(wg?.href).toBe('/my/stamps/region/paldang?place=water-garden')
    const detail = await stampPlace(t.db, me, 'dumulmeori')
    expect(detail?.visits).toBe(2)
    expect(detail?.records.map((r) => r.themeId)).toEqual([
      'dumulmeori-sunset-1108',
      'dumulmeori-morning-1011',
    ])
    expect(await stampPlace(t.db, me, 'gwangneung')).toBeNull()
    const seasons = await seasonSeries(t.db, me, NOW)
    expect(seasons[0].aside).toBe('2 / 4 · 11월 30일까지')
    expect(seasons[1].closed).toBe(true)
  })

  it('region page: only 모집 중 themes from today on', async () => {
    const r = await regionThemes(t.db, 'gwangneung', 'bongseonsa', undefined, NOW)
    expect(r?.list.map((x) => x.id)).toEqual(['bongseonsa-temple'])
    const empty = await regionThemes(t.db, 'dasan', 'silhak', undefined, NOW)
    expect(empty?.list).toEqual([])
    expect(await regionThemes(t.db, 'nowhere', undefined, undefined, NOW)).toBeNull()
  })

  it('search: themes by title/place, place and post counts', async () => {
    const r = await searchAll(t.db, '두물 머리', { now: NOW })
    expect(r.themes.map((x) => x.id)).toEqual(['sujongsa-tea', 'dumulmeori-sunset'])
    expect(r.courses).toBeGreaterThan(0)
    expect(r.reviews).toBe(1)
    expect((await searchAll(t.db, '없는장소', { now: NOW })).themes).toEqual([])
  })

  it('profiles: visible only through a matched theme; host tags and subscription', async () => {
    const me = await t.uid('kanghyun')
    const viewer = { id: me, role: 'user' }
    const yuna = await userProfile(t.db, 'yuna', viewer)
    expect(yuna?.allowed).toBe(true)
    if (yuna?.allowed) {
      expect(yuna.tags).toEqual([
        ['서로를 배려해요', 2],
        ['시간을 잘 지켜요', 1],
      ])
      expect(yuna.taste).toContain('산책')
    }
    // 수진은 함께한 테마가 없다
    expect((await userProfile(t.db, 'sujin', viewer))?.allowed).toBe(false)
    const harin = await hostProfile(t.db, 'harin', viewer, NOW)
    expect(harin?.subscribed).toBe(true)
    expect(harin?.tags[0]).toEqual(['시간을 잘 지켜요', 2])
    expect(harin?.list.map((x) => x.id)).toEqual(['gwangneung-morning'])
    // 확인 대기 호스트는 남에게 보이지 않는다
    expect(await hostProfile(t.db, 'unkil', viewer, NOW)).toBeNull()
  })

  it('report target from handle / theme', async () => {
    const p = await reportTarget(t.db, { user: 'minjae', theme: 'gwangneung-morning-1109' })
    expect(p?.person).toBe(true)
    expect(p?.line).toBe('광릉숲 전나무길 아침 산책 참여자')
    const th = await reportTarget(t.db, { theme: 'dasan-lunch' })
    expect(th?.line).toBe('다산 한정식 호스트의 테마')
    expect(await reportTarget(t.db, { user: 'nobody' })).toBeNull()
  })
})

describe('writes', () => {
  it('onboarding merges prefs, saves origin/name/mbti and finishes', async () => {
    const me = await t.uid('kanghyun')
    await saveOnboarding(t.db, me, { prefs: { walk: '조금만', activities: ['카페'] } })
    await saveOnboarding(t.db, me, { name: '강현2', origin: '구리', adult: true })
    await saveOnboarding(t.db, me, { mbti: 'enfj', mbtiPublic: false, onboarded: true })
    const u = await user(me)
    expect(u.prefs).toEqual({
      activities: ['카페'],
      pace: '여유롭게',
      talk: '상황에 따라',
      plan: '유연하게 조정하기',
      walk: '조금만',
    })
    expect([u.name, u.origin, u.mbti, u.mbtiPublic, u.onboarded]).toEqual([
      '강현2',
      '구리',
      'ENFJ',
      false,
      true,
    ])
    await saveOnboarding(t.db, me, { mbti: '?' })
    expect((await user(me)).mbti).toBeNull()
    await expect(saveOnboarding(t.db, me, { adult: false })).rejects.toBeInstanceOf(FlowError)
    await expect(saveOnboarding(t.db, me, { name: '  ' })).rejects.toBeInstanceOf(FlowError)
  })

  it('privacy save: jsonb keys and mbtiPublic column', async () => {
    const me = await t.uid('kanghyun')
    await savePrivacy(t.db, me, 'tripsPublic', false)
    await savePrivacy(t.db, me, 'mbtiPublic', false)
    await savePrivacy(t.db, me, 'reviewsPublic', false)
    const st = privacyState(await user(me))
    expect(st).toEqual({
      photosPublic: false,
      mbtiPublic: false,
      profilePublic: true,
      tripsPublic: false,
      reviewsPublic: false,
    })
    // 동행 기록을 끄면 남이 보는 프로필에서 횟수·태그가 빠진다
    const yuna = await t.uid('yuna')
    const seen = await userProfile(t.db, 'kanghyun', { id: yuna, role: 'user' })
    expect(seen?.allowed && seen.showTrips).toBe(false)
    expect(seen?.allowed && seen.taste.includes('INFP')).toBe(false)
  })

  it('block and unblock', async () => {
    const me = await t.uid('kanghyun')
    const minjae = await t.uid('minjae')
    await setBlock(t.db, me, minjae, true)
    await setBlock(t.db, me, minjae, true) // 두 번 눌러도 한 줄
    let d = await blocksAndReports(t.db, me)
    expect(d.blocks.map((b) => b.handle)).toEqual(['minjae'])
    await setBlock(t.db, me, minjae, false)
    d = await blocksAndReports(t.db, me)
    expect(d.blocks).toEqual([])
    await expect(setBlock(t.db, me, me, true)).rejects.toBeInstanceOf(FlowError)
  })

  it('report insert (+ block, admin notified), reason must be listed', async () => {
    const me = await t.uid('kanghyun')
    const minjae = await t.uid('minjae')
    const admin = await t.uid('admin')
    const r = await fileReport(t.db, {
      reporterId: me,
      targetUserId: minjae,
      targetThemeId: 'gwangneung-morning-1109',
      reason: '약속 시간 불참',
      detail: ' 안 왔어요 ',
      block: true,
    })
    expect(r.status).toBe('검토 중')
    expect(r.detail).toBe('안 왔어요')
    const d = await blocksAndReports(t.db, me)
    expect(d.reports.map((x) => x.badge[1])).toEqual(['관리자 확인 중'])
    expect(d.blocks.map((b) => b.handle)).toEqual(['minjae'])
    const notes = await t.db.select().from(s.notifications).where(eq(s.notifications.userId, admin))
    expect(notes.some((n) => n.title === '새 신고가 들어왔어요')).toBe(true)
    await expect(fileReport(t.db, { reporterId: me, reason: '아무거나' })).rejects.toBeInstanceOf(FlowError)
    await expect(
      fileReport(t.db, { reporterId: me, targetUserId: me, reason: '기타' }),
    ).rejects.toBeInstanceOf(FlowError)
  })

  it('admin: verify / hold a host and notify the host user', async () => {
    const q = await adminQueue(t.db)
    expect(q.hosts.filter((h) => h.pending).map((h) => h.id)).toEqual(['sujin', 'unkil'])
    expect(q.openReports).toBe(1)
    await decideHost(t.db, 'unkil', true, NOW)
    await decideHost(t.db, 'sujin', false, NOW)
    const [unkil] = await t.db.select().from(s.hosts).where(eq(s.hosts.id, 'unkil'))
    const [sujin] = await t.db.select().from(s.hosts).where(eq(s.hosts.id, 'sujin'))
    expect([unkil.status, unkil.verifiedAt?.getTime()]).toEqual(['확인 완료', NOW.getTime()])
    expect([sujin.status, sujin.verifiedAt]).toEqual(['보류', null])
    const n = await notificationsOf(t.db, unkil.userId, NOW)
    expect(n[0].title).toBe('호스트 확인이 끝났어요')
    expect(n[0].unread).toBe(true)
    await expect(decideHost(t.db, 'unkil', false, NOW)).rejects.toBeInstanceOf(FlowError)
    // 보류에서 다시 확인 완료로
    await decideHost(t.db, 'sujin', true, NOW)
    expect((await adminQueue(t.db)).openHosts).toBe(0)
  })

  it('admin: no-show report with a theme marks attendance 불참 확인; reject leaves it', async () => {
    const me = await t.uid('kanghyun')
    const minjae = await t.uid('minjae')
    const theme = 'gwangneung-morning-1109'
    const r = await fileReport(t.db, {
      reporterId: me,
      targetUserId: minjae,
      targetThemeId: theme,
      reason: '약속 시간 불참',
    })
    const att = async () =>
      (
        await t.db
          .select()
          .from(s.attendance)
          .where(and(eq(s.attendance.themeId, theme), eq(s.attendance.userId, minjae)))
      )[0]?.status
    expect(await att()).toBe('검토 중')
    const other = await fileReport(t.db, {
      reporterId: me,
      targetUserId: minjae,
      targetThemeId: theme,
      reason: '약속 시간 불참',
    })
    await resolveReport(t.db, other.id, false, NOW)
    expect(await att()).toBe('검토 중')
    await resolveReport(t.db, r.id, true, NOW)
    expect(await att()).toBe('불참 확인')
    const [row] = await t.db.select().from(s.reports).where(eq(s.reports.id, r.id))
    expect(row.status).toBe('처리 완료')
    const mine = await notificationsOf(t.db, me, NOW)
    expect(mine.some((n) => n.body === '약속 시간 불참 · 처리 완료')).toBe(true)
    await expect(resolveReport(t.db, r.id, true, NOW)).rejects.toBeInstanceOf(FlowError)
  })

  it('notifications: newest first, mark all read', async () => {
    const me = await t.uid('kanghyun')
    const before = await notificationsOf(t.db, me, NOW)
    expect(before.map((n) => n.unread)).toEqual([true, true, false, false, false])
    await markRead(t.db, me, undefined, NOW)
    const left = await t.db
      .select()
      .from(s.notifications)
      .where(and(eq(s.notifications.userId, me), isNull(s.notifications.readAt)))
    expect(left).toEqual([])
  })

  it('subscriptions toggle (host / place)', async () => {
    const me = await t.uid('kanghyun')
    await setSubscription(t.db, me, 'host', 'harin', false)
    expect(await isSubscribed(t.db, me, 'host', 'harin')).toBe(false)
    await setSubscription(t.db, me, 'place', 'silhak', true)
    await setSubscription(t.db, me, 'place', 'silhak', true)
    expect(await isSubscribed(t.db, me, 'place', 'silhak')).toBe(true)
    await expect(setSubscription(t.db, me, 'weird', 'x', true)).rejects.toBeInstanceOf(FlowError)
  })
})
