import { and, eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import * as s from '@/lib/db/schema'
import * as Community from '@/lib/server/domain/community'
import * as Host from '@/lib/server/domain/host'
import { draftCourse, suggestPlaces } from '@/lib/server/domain/suggest'
import { loadTheme } from '@/lib/server/queries/theme-view'
import { NOW, testDb } from '@/test/db'

let t: Awaited<ReturnType<typeof testDb>>
beforeEach(async () => {
  t = await testDb()
})

describe('host join', () => {
  it('new host waits for the ops team; verified hosts cannot re-apply', async () => {
    const me = await t.uid('kanghyun')
    await Host.joinHost(t.db, { userId: me, kind: 'resident', name: '강현', area: '조안면' })
    const [h] = await t.db.select().from(s.hosts).where(eq(s.hosts.userId, me))
    expect(h.status).toBe('확인 대기')
    expect(h.confirmMode).toBe('manual')
    const admin = await t.uid('admin')
    const n = await t.db.select().from(s.notifications).where(eq(s.notifications.userId, admin))
    expect(n.some((x) => x.title.includes('호스트 확인'))).toBe(true)
    await expect(
      Host.joinHost(t.db, { userId: await t.uid('harin'), kind: 'resident', name: '하린', area: '진접읍' }),
    ).rejects.toMatchObject({
      code: 'done',
    })
  })

  it('business renaming triggers re-verification', async () => {
    const owner = await t.uid('dasan-owner')
    const r = await Host.editHost(t.db, {
      userId: owner,
      name: '다산 밥상',
      area: '조안면',
      intro: '',
      contact: '',
    })
    expect(r.reverify).toBe(true)
    const [h] = await t.db.select().from(s.hosts).where(eq(s.hosts.id, 'dasan'))
    expect(h.status).toBe('확인 대기')
  })
})

describe('publish theme', () => {
  const base = async () => {
    const draft = await draftCourse(t.db, { corePlaceId: 'dasan-hanjeongsik', start: '12:00' })
    return {
      userId: await t.uid('dasan-owner'),
      corePlaceId: 'dasan-hanjeongsik',
      title: '한정식 점심',
      intro: '',
      day: '2026-12-05',
      start: '12:00',
      min: 3,
      max: 6,
      costWon: 25000,
      stops: draft.map((d) => ({ placeId: d.placeId, time: d.time, stayMin: d.stayMin, next: d.next })),
    }
  }

  it('verified host publishes; core place is fixed; deadline is the day before 18:00', async () => {
    const id = await Host.publishTheme(t.db, await base(), NOW)
    const th = await loadTheme(t.db, id)
    expect(th?.status).toBe('모집 중')
    expect(th?.stops.find((x) => x.fixed)?.name).toBe('다산 한정식')
    expect(th?.deadlineAt.toISOString()).toBe(new Date('2026-12-04T18:00:00+09:00').toISOString())
    expect(th?.confirmMode).toBe('manual')
  })

  it('pending hosts cannot publish; past-deadline dates are refused', async () => {
    const pending = { ...(await base()), userId: await t.uid('unkil-owner') }
    await expect(Host.publishTheme(t.db, pending, NOW)).rejects.toMatchObject({ code: 'unverified' })
    await expect(
      Host.publishTheme(t.db, { ...(await base()), day: '2026-11-21' }, NOW),
    ).rejects.toMatchObject({
      code: 'too-soon',
    })
  })

  it('add date copies the course and shifts times', async () => {
    const id = await Host.addDate(
      t.db,
      {
        userId: await t.uid('dasan-owner'),
        themeId: 'dasan-lunch',
        day: '2026-12-12',
        start: '12:30',
        min: 3,
        max: 6,
      },
      NOW,
    )
    const th = await loadTheme(t.db, id)
    expect(th?.stops.map((x) => x.time)).toEqual(['11:20', '12:30', '14:20', '15:30'])
    expect(th?.end).toBe('16:20')
  })

  it('subscribers hear about a new theme', async () => {
    const me = await t.uid('kanghyun')
    await Host.publishTheme(
      t.db,
      {
        ...(await base()),
        userId: await t.uid('harin'),
        corePlaceId: 'gwangneung',
        stops: [{ placeId: 'gwangneung', time: '09:30', stayMin: 90 }],
      },
      NOW,
    )
    const n = await t.db.select().from(s.notifications).where(eq(s.notifications.userId, me))
    expect(n.some((x) => x.title === '하린 님이 새 테마를 열었어요')).toBe(true)
  })
})

describe('suggestions stay inside reviewed places', () => {
  it('cafe asks return cafes near the core place; unknown asks say so', async () => {
    const r = await suggestPlaces(t.db, { corePlaceId: 'gwangneung', ask: '점심 먹을 곳 찾아줘' })
    expect(r.understood).toBe(true)
    expect(r.places.every((p) => p.group === '맛집' && p.region === 'gwangneung')).toBe(true)
    const u = await suggestPlaces(t.db, { corePlaceId: 'gwangneung', ask: '일요일에 여는 곳' })
    expect(u.understood).toBe(false)
  })

  it('draft puts the core place at the given time with a meal or cafe', async () => {
    const d = await draftCourse(t.db, { corePlaceId: 'gwangneung', start: '09:30' })
    const core = d.find((x) => x.fixed)
    expect(core?.time).toBe('09:30')
    expect(d.some((x) => ['맛집', '카페'].includes(x.place.group))).toBe(true)
  })
})

describe('community', () => {
  it('trip reviews only from people who checked in', async () => {
    const me = await t.uid('kanghyun')
    await expect(
      Community.writePost(t.db, {
        userId: me,
        kind: '여행 후기',
        title: '좋았어요',
        body: '...',
        themeId: 'bongseonsa-temple-1115',
      }),
    ).rejects.toMatchObject({ code: 'no-visit' })
    const id = await Community.writePost(t.db, {
      userId: me,
      kind: '여행 후기',
      title: '수종사 좋았어요',
      body: '창가 자리',
      themeId: 'sujongsa-tea-1025',
    })
    const [p] = await t.db.select().from(s.posts).where(eq(s.posts.id, id))
    expect(p.placeId).toBe('sujongsa')
    expect(p.visitedOn).toBe('2026-11-01')
  })

  it('answers notify the asker; copy respects allowCopy', async () => {
    await Community.answer(t.db, {
      userId: await t.uid('jiho'),
      postId: 'unkilsan-question',
      body: '30분쯤 걸려요',
    })
    const n = await t.db
      .select()
      .from(s.notifications)
      .where(eq(s.notifications.userId, await t.uid('dohyun')))
    expect(n.some((x) => x.href === '/community/unkilsan-question')).toBe(true)
    await t.db.update(s.posts).set({ allowCopy: false }).where(eq(s.posts.id, 'dumulmeori-quiet'))
    await expect(
      Community.saveCourse(t.db, {
        userId: await t.uid('kanghyun'),
        corePlaceId: 'dumulmeori',
        title: 'x',
        stops: ['dumulmeori'],
        fromPostId: 'dumulmeori-quiet',
      }),
    ).rejects.toMatchObject({ code: 'no-copy' })
  })
})

describe('host review', () => {
  it('tags only for checked-in members; missing check-in follows the host', async () => {
    const host = await t.uid('harin')
    const junho = await t.uid('junho')
    const me = await t.uid('kanghyun')
    await Host.hostReview(t.db, {
      userId: host,
      themeId: 'gwangneung-morning-1109',
      tags: { [junho]: ['시간을 잘 지켜요', '점수 100점'], [me]: ['서로를 배려해요'] },
      attendance: { [me]: '참여 확인', [await t.uid('minjae')]: '불참 확인' },
    })
    const r = await t.db
      .select()
      .from(s.peerReviews)
      .where(and(eq(s.peerReviews.themeId, 'gwangneung-morning-1109'), eq(s.peerReviews.fromUser, host)))
    expect(r).toHaveLength(1)
    expect(r[0].tags).toEqual(['시간을 잘 지켜요'])
    const att = await t.db
      .select()
      .from(s.attendance)
      .where(eq(s.attendance.themeId, 'gwangneung-morning-1109'))
    expect(att.find((a) => a.userId === me)?.status).toBe('검토 중')
    expect(att.find((a) => a.userId === junho)?.status).toBe('참여 확인')
  })
})
