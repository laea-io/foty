// 그룹 B 쓰기: 대화 · 테마 요청 · 친구 초대 · AI 대안 제안 · 평가 · 차단 · 참여 확인
import { and, eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import * as s from '@/lib/db/schema'
import {
  askHostCheckin,
  blockUser,
  joinInvite,
  makeSolo,
  proposeAiStop,
  reviewTargets,
  sendChat,
  setHostSubscription,
  submitPeerReviews,
  submitRequest,
  tellAttended,
} from '@/lib/server/b/writes'
import { apply } from '@/lib/server/domain/flow'
import { loadTheme } from '@/lib/server/domain/read'
import { FlowError } from '@/lib/server/domain/types'
import { NOW, testDb } from './db'

let t: Awaited<ReturnType<typeof testDb>>
beforeEach(async () => {
  t = await testDb()
})

const app = async (themeId: string, handle: string) =>
  (
    await t.db
      .select()
      .from(s.applications)
      .where(and(eq(s.applications.themeId, themeId), eq(s.applications.userId, await t.uid(handle))))
  )[0]

describe('chat', () => {
  it('members and the host can send; others are refused', async () => {
    const g = 'gwangneung-morning'
    const row = await sendChat(t.db, { themeId: g, userId: await t.uid('kanghyun'), body: '  안녕하세요  ' })
    expect(row.body).toBe('안녕하세요')
    await sendChat(t.db, { themeId: g, userId: await t.uid('harin'), body: '호스트예요' })
    await expect(
      sendChat(t.db, { themeId: g, userId: await t.uid('minjae'), body: '끼어들기' }),
    ).rejects.toThrow('그룹 참여자만')
    await expect(
      sendChat(t.db, { themeId: g, userId: await t.uid('kanghyun'), body: '   ' }),
    ).rejects.toThrow(FlowError)
    const msgs = await t.db.select().from(s.messages).where(eq(s.messages.themeId, g))
    expect(msgs.length).toBe(6)
  })

  it('a pending applicant (not accepted) cannot read or write the group chat', async () => {
    await expect(
      sendChat(t.db, { themeId: 'dasan-lunch', userId: await t.uid('kanghyun'), body: '안녕' }),
    ).rejects.toThrow('그룹 참여자만')
  })
})

describe('theme request', () => {
  it('stores the request with its tags and day', async () => {
    const me = await t.uid('kanghyun')
    const r = await submitRequest(t.db, {
      userId: me,
      body: '',
      when: '이번 주말',
      tags: ['카페', '카페', '사진'],
    })
    expect(r.body).toBe('카페·사진 테마')
    expect(r.tags).toEqual(['카페', '사진'])
    expect(r.when).toBe('이번 주말')
    await expect(submitRequest(t.db, { userId: me, when: '다음 주말', tags: [] })).rejects.toThrow(FlowError)
  })
})

describe('friend invite', () => {
  it('the friend applies on their own; the reserved seat moves to them (no double count)', async () => {
    // 봉선사(자동 수락) 2/5 → 강현이 친구와 함께(2명) 신청 → 4/5
    const me = await t.uid('kanghyun')
    const mine = await apply(t.db, { themeId: 'bongseonsa-temple', userId: me, party: 2, now: NOW })
    expect((await loadTheme(t.db, 'bongseonsa-temple'))?.current).toBe(4)
    const r = await joinInvite(t.db, {
      themeId: 'bongseonsa-temple',
      inviterApplicationId: mine.applicationId,
      userId: await t.uid('yuna'),
      now: NOW,
    })
    expect(r.status).toBe('수락')
    expect((await loadTheme(t.db, 'bongseonsa-temple'))?.current).toBe(4)
    expect((await app('bongseonsa-temple', 'kanghyun')).party).toBe(1)
    const friend = await app('bongseonsa-temple', 'yuna')
    expect(friend.party).toBe(1)
    expect(friend.inviteToken).toBe(mine.applicationId)
  })

  it('refuses the inviter themself, a wrong theme, and a cancelled invitation', async () => {
    const me = await t.uid('kanghyun')
    const mine = await apply(t.db, { themeId: 'bongseonsa-temple', userId: me, party: 2, now: NOW })
    const base = { inviterApplicationId: mine.applicationId, now: NOW }
    await expect(joinInvite(t.db, { ...base, themeId: 'bongseonsa-temple', userId: me })).rejects.toThrow(
      '내가 보낸',
    )
    await expect(
      joinInvite(t.db, { ...base, themeId: 'dasan-lunch', userId: await t.uid('jiho') }),
    ).rejects.toThrow('초대 링크')
    await t.db
      .update(s.applications)
      .set({ status: '신청 취소' })
      .where(eq(s.applications.id, mine.applicationId))
    await expect(
      joinInvite(t.db, { ...base, themeId: 'bongseonsa-temple', userId: await t.uid('jiho') }),
    ).rejects.toThrow('취소')
    // 실패하면 아무것도 바뀌지 않는다
    expect(await app('bongseonsa-temple', 'jiho')).toBeUndefined()
  })

  it('switching to solo frees the friend seat', async () => {
    const me = await t.uid('kanghyun')
    await apply(t.db, { themeId: 'bongseonsa-temple', userId: me, party: 2, now: NOW })
    await makeSolo(t.db, { themeId: 'bongseonsa-temple', userId: me })
    expect((await loadTheme(t.db, 'bongseonsa-temple'))?.current).toBe(3)
  })
})

describe('AI suggestion → course proposal', () => {
  it('replaces the non-fixed stop of the same kind and lands in the change history', async () => {
    // 광릉숲: 0 광릉숲(고정) · 1 봉선사(문화) · 2 숲길 밥상(맛집) → 두부 전문점(맛집)은 2번을 바꾼다
    const c = await proposeAiStop(t.db, {
      themeId: 'gwangneung-morning',
      userId: await t.uid('kanghyun'),
      placeId: 'temple-food',
    })
    expect(c.status).toBe('제안됨')
    expect(c.source).toBe('AI 대안')
    expect(c.label).toBe('세 번째 장소')
    expect(c.fromText).toBe('숲길 밥상')
    expect(c.payload).toEqual({ ord: 2, placeId: 'temple-food' })
  })

  it('falls back to the last non-fixed stop; outsiders cannot propose', async () => {
    const c = await proposeAiStop(t.db, {
      themeId: 'gwangneung-morning',
      userId: await t.uid('yuna'),
      placeId: 'riverside-cafe',
    })
    expect(c.payload).toEqual({ ord: 2, placeId: 'riverside-cafe' })
    await expect(
      proposeAiStop(t.db, {
        themeId: 'gwangneung-morning',
        userId: await t.uid('minjae'),
        placeId: 'tofu-house',
      }),
    ).rejects.toThrow(FlowError)
    await expect(
      proposeAiStop(t.db, {
        themeId: 'gwangneung-morning',
        userId: await t.uid('yuna'),
        placeId: 'bongseonsa',
      }),
    ).rejects.toThrow('이미 코스에')
  })
})

describe('peer review', () => {
  // dasan-lunch-1114: 여행 완료(11-21), 강현·유나·준호·민재 모두 체크인
  it('co-members who checked in, behavior tags only, after the trip', async () => {
    const me = await t.uid('kanghyun')
    const yuna = await t.uid('yuna')
    const { targets } = await reviewTargets(t.db, 'dasan-lunch-1114', me)
    expect(targets).toContain(await t.uid('dasan-owner'))
    expect(targets).toContain(yuna)
    expect(targets).not.toContain(me)
    const r = await submitPeerReviews(t.db, {
      themeId: 'dasan-lunch-1114',
      fromUser: me,
      reviews: [{ toUser: yuna, tags: ['시간을 잘 지켜요'] }],
      firstVisit: false,
      now: NOW,
    })
    expect(r.saved).toBe(1)
    // 다시 내면 덮어쓴다
    await submitPeerReviews(t.db, {
      themeId: 'dasan-lunch-1114',
      fromUser: me,
      reviews: [{ toUser: yuna, tags: ['서로를 배려해요', '시간을 잘 지켜요'] }],
      now: NOW,
    })
    const rows = await t.db
      .select()
      .from(s.peerReviews)
      .where(and(eq(s.peerReviews.themeId, 'dasan-lunch-1114'), eq(s.peerReviews.fromUser, me)))
    expect(rows).toHaveLength(1)
    expect(rows[0].tags).toEqual(['서로를 배려해요', '시간을 잘 지켜요'])
    await expect(
      submitPeerReviews(t.db, {
        themeId: 'dasan-lunch-1114',
        fromUser: me,
        reviews: [{ toUser: yuna, tags: ['10점 만점'] }],
        now: NOW,
      }),
    ).rejects.toThrow('정해진 태그')
  })

  it('refused before completion, for non-attendees, for outsiders, and after the window', async () => {
    const me = await t.uid('kanghyun')
    await expect(
      submitPeerReviews(t.db, {
        themeId: 'gwangneung-morning',
        fromUser: me,
        reviews: [{ toUser: await t.uid('yuna'), tags: ['서로를 배려해요'] }],
        now: NOW,
      }),
    ).rejects.toThrow('여행이 끝난 뒤')
    // gwangneung-morning-1109: 강현은 체크인 기록 없음(검토 중)
    await expect(
      submitPeerReviews(t.db, {
        themeId: 'gwangneung-morning-1109',
        fromUser: me,
        reviews: [{ toUser: await t.uid('junho'), tags: ['서로를 배려해요'] }],
        now: NOW,
      }),
    ).rejects.toThrow('함께 다녀온')
    // 체크인하지 않은 민재는 평가 대상이 아니다
    await expect(
      submitPeerReviews(t.db, {
        themeId: 'gwangneung-morning-1109',
        fromUser: await t.uid('junho'),
        reviews: [{ toUser: await t.uid('minjae'), tags: ['서로를 배려해요'] }],
        now: NOW,
      }),
    ).rejects.toThrow('함께 다녀온 사람만')
    await expect(
      submitPeerReviews(t.db, {
        themeId: 'dasan-lunch-1114',
        fromUser: await t.uid('dohyun'),
        reviews: [{ toUser: await t.uid('yuna'), tags: ['서로를 배려해요'] }],
        now: NOW,
      }),
    ).rejects.toThrow('함께 다녀온')
    await expect(
      submitPeerReviews(t.db, {
        themeId: 'dasan-lunch-1114',
        fromUser: me,
        reviews: [{ toUser: await t.uid('yuna'), tags: ['서로를 배려해요'] }],
        now: new Date('2026-12-05T12:00:00+09:00'),
      }),
    ).rejects.toThrow('평가 기간')
  })
})

describe('small writes', () => {
  it('block, attendance note, check-in help, host subscription', async () => {
    const me = await t.uid('kanghyun')
    await blockUser(t.db, { userId: me, blockedId: await t.uid('minjae') })
    await blockUser(t.db, { userId: me, blockedId: await t.uid('minjae') })
    expect(await t.db.select().from(s.blocks).where(eq(s.blocks.userId, me))).toHaveLength(1)
    await expect(blockUser(t.db, { userId: me, blockedId: me })).rejects.toThrow(FlowError)

    await tellAttended(t.db, { themeId: 'gwangneung-morning-1109', userId: me })
    const [att] = await t.db
      .select()
      .from(s.attendance)
      .where(and(eq(s.attendance.themeId, 'gwangneung-morning-1109'), eq(s.attendance.userId, me)))
    expect(att.note).toBe('참여했다고 알렸어요')
    await expect(tellAttended(t.db, { themeId: 'dasan-lunch-1114', userId: me })).rejects.toThrow(FlowError)

    await askHostCheckin(t.db, { themeId: 'gwangneung-morning', userId: me })
    const harinNotes = await t.db
      .select()
      .from(s.notifications)
      .where(eq(s.notifications.userId, await t.uid('harin')))
    expect(harinNotes.some((n) => n.title.includes('체크인'))).toBe(true)
    await expect(
      askHostCheckin(t.db, { themeId: 'gwangneung-morning', userId: await t.uid('minjae') }),
    ).rejects.toThrow(FlowError)

    await setHostSubscription(t.db, { userId: me, hostId: 'jiho', on: true })
    await setHostSubscription(t.db, { userId: me, hostId: 'jiho', on: true })
    expect(await t.db.select().from(s.subscriptions).where(eq(s.subscriptions.userId, me))).toHaveLength(2)
    await setHostSubscription(t.db, { userId: me, hostId: 'jiho', on: false })
    expect(await t.db.select().from(s.subscriptions).where(eq(s.subscriptions.userId, me))).toHaveLength(1)
  })
})
