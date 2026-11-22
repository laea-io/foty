import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import * as s from '@/lib/db/schema'
import { apply, cancelApplication, confirmSchedule, decide } from '@/lib/server/domain/flow'
import { editTheme, setMeetDetail } from '@/lib/server/domain/host-edit'
import { NOW, testDb } from './db'

let t: Awaited<ReturnType<typeof testDb>>
beforeEach(async () => {
  t = await testDb()
})

const theme = async (id: string) => (await t.db.select().from(s.themes).where(eq(s.themes.id, id)))[0]
const notes = async (handle: string) =>
  t.db
    .select()
    .from(s.notifications)
    .where(eq(s.notifications.userId, await t.uid(handle)))

describe('2026-11-22 flow fixes', () => {
  it('schedule can be confirmed only after recruiting closed', async () => {
    // dasan-lunch: 모집 중 · 수락 2명(최소 3) → 한 명 더 받아 성사시키고 확정해 본다
    const host = await t.uid('dasan-owner')
    const a = await apply(t.db, { themeId: 'dasan-lunch', userId: await t.uid('minjae'), now: NOW })
    await decide(t.db, { applicationId: a.applicationId, hostUserId: host, accept: true })
    await expect(confirmSchedule(t.db, { themeId: 'dasan-lunch', hostUserId: host })).rejects.toThrow(
      /조율하는 중/,
    )
  })

  it('host hears about a new auto-accepted participant and a cancel', async () => {
    // bongseonsa-temple: 바로 수락하는 호스트(supgil), 아직 성사 전
    const before = (await notes('supgil-owner')).length
    // 수락 2명(최소 3): 한 명이 빠지고 다른 한 명이 들어온다 — 성사는 아직
    await cancelApplication(t.db, { themeId: 'bongseonsa-temple', userId: await t.uid('junho') })
    await apply(t.db, { themeId: 'bongseonsa-temple', userId: await t.uid('sujin'), now: NOW })
    const after = await notes('supgil-owner')
    const titles = after.slice(0).map((n) => n.title)
    expect(after.length - before).toBe(2)
    expect(titles).toContain('새 참여자가 함께해요')
    expect(titles).toContain('참여자 한 명이 신청을 취소했어요')
  })

  it('host edits copy and max; max cannot go below accepted', async () => {
    const host = await t.uid('dasan-owner')
    await editTheme(t.db, {
      userId: host,
      themeId: 'dasan-lunch',
      title: '새 제목',
      intro: '소개',
      include: '',
      exclude: '',
      max: 5,
      costWon: 20000,
    })
    expect((await theme('dasan-lunch')).title).toBe('새 제목')
    await expect(
      editTheme(t.db, {
        userId: host,
        themeId: 'dasan-lunch',
        title: 'x',
        intro: '',
        include: '',
        exclude: '',
        max: 1,
        costWon: 0,
      }),
    ).rejects.toThrow(/최대 인원/)
    await expect(
      editTheme(t.db, {
        userId: await t.uid('kanghyun'),
        themeId: 'dasan-lunch',
        title: 'x',
        intro: '',
        include: '',
        exclude: '',
        max: 6,
        costWon: 0,
      }),
    ).rejects.toThrow(/호스트/)
  })

  it('meeting detail only after matched, then members are told', async () => {
    const host = await t.uid('dasan-owner')
    await expect(
      setMeetDetail(t.db, { userId: host, themeId: 'dasan-lunch', text: '운길산역 1번 출구 10:20' }),
    ).rejects.toThrow(/성사/)
    const a = await apply(t.db, { themeId: 'dasan-lunch', userId: await t.uid('minjae'), now: NOW })
    await decide(t.db, { applicationId: a.applicationId, hostUserId: host, accept: true })
    await setMeetDetail(t.db, { userId: host, themeId: 'dasan-lunch', text: '운길산역 1번 출구 10:20' })
    expect((await theme('dasan-lunch')).meetDetail).toBe('운길산역 1번 출구 10:20')
    expect((await notes('yuna')).some((n) => n.title === '집결 장소가 정해졌어요')).toBe(true)
  })
})
