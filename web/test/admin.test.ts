// 운영팀(정지 · 숨김 · 테마 취소)과 계정(비밀번호 · 탈퇴) 쓰기
import { and, eq, gte, inArray } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import * as s from '@/lib/db/schema'
import {
  adminCancelTheme,
  changePassword,
  decideHost,
  deleteAccount,
  setHostSuspended,
  setPostHidden,
  setUserSuspended,
} from '@/lib/server/a-ops'
import { FlowError } from '@/lib/server/domain/types'
import { verifyPassword } from '@/lib/server/password'
import { adminQueue, adminUsers } from '@/lib/server/q/a'
import { today } from '@/lib/server/time'
import { NOW, testDb } from './db'

let t: Awaited<ReturnType<typeof testDb>>
beforeEach(async () => {
  t = await testDb()
})

const user = async (id: string) => (await t.db.select().from(s.users).where(eq(s.users.id, id)))[0]
const session = (userId: string) =>
  t.db.insert(s.sessions).values({ id: `t-${userId}`, userId, expiresAt: new Date(NOW.getTime() + 86400000) })
const sessionsOf = async (userId: string) =>
  (await t.db.select().from(s.sessions).where(eq(s.sessions.userId, userId))).length

describe('admin', () => {
  it('suspends a user: ends sessions, sets suspendedAt; admin cannot be suspended; unsuspend clears', async () => {
    const yuna = await t.uid('yuna')
    await session(yuna)
    await setUserSuspended(t.db, yuna, true, NOW)
    expect((await user(yuna)).suspendedAt?.getTime()).toBe(NOW.getTime())
    expect(await sessionsOf(yuna)).toBe(0)
    expect((await adminUsers(t.db, 'yuna')).find((u) => u.id === yuna)?.suspended).toBe(true)
    await setUserSuspended(t.db, yuna, false, NOW)
    expect((await user(yuna)).suspendedAt).toBeNull()
    await expect(setUserSuspended(t.db, await t.uid('admin'), true)).rejects.toBeInstanceOf(FlowError)
  })

  it('hold reason goes to the host; suspend / unsuspend a verified host', async () => {
    await decideHost(t.db, 'sujin', false, NOW, '사업자 등록증 사진이 흐려요')
    const [n] = await t.db
      .select()
      .from(s.notifications)
      .where(eq(s.notifications.userId, await t.uid('sujin')))
    expect(n.body).toContain('사업자 등록증 사진이 흐려요')
    const q = await adminQueue(t.db)
    const row = q.hosts.find((h) => h.id === 'sujin')
    expect(row?.submitted).toMatch(/월 .*일/)
    await setHostSuspended(t.db, 'dasan', true, '신고 확인')
    expect((await t.db.select().from(s.hosts).where(eq(s.hosts.id, 'dasan')))[0].status).toBe('정지')
    await expect(setHostSuspended(t.db, 'dasan', true)).rejects.toBeInstanceOf(FlowError)
    await setHostSuspended(t.db, 'dasan', false)
    expect((await t.db.select().from(s.hosts).where(eq(s.hosts.id, 'dasan')))[0].status).toBe('확인 완료')
  })

  it('hides a post', async () => {
    const [p] = await t.db.select().from(s.posts).limit(1)
    await setPostHidden(t.db, p.id, true, NOW)
    expect((await t.db.select().from(s.posts).where(eq(s.posts.id, p.id)))[0].hiddenAt).not.toBeNull()
    await expect(setPostHidden(t.db, 'nope', true)).rejects.toBeInstanceOf(FlowError)
  })

  it('cancels a theme as admin with a reason', async () => {
    await expect(adminCancelTheme(t.db, 'dasan-lunch', ' ')).rejects.toBeInstanceOf(FlowError)
    await adminCancelTheme(t.db, 'dasan-lunch', '장소 안전 점검')
    const [th] = await t.db.select().from(s.themes).where(eq(s.themes.id, 'dasan-lunch'))
    expect(th.status).toBe('취소')
    expect(th.cancelReason).toContain('장소 안전 점검')
  })
})

describe('account', () => {
  it('changes password only with the current one; min 8', async () => {
    const me = await t.uid('kanghyun')
    await expect(changePassword(t.db, me, 'wrong', 'new-password-1')).rejects.toBeInstanceOf(FlowError)
    await expect(changePassword(t.db, me, 'foty-demo', 'short')).rejects.toBeInstanceOf(FlowError)
    await changePassword(t.db, me, 'foty-demo', 'new-password-1')
    expect(await verifyPassword('new-password-1', (await user(me)).passwordHash)).toBe(true)
  })

  it('kakao-only user can set a password without the current one', async () => {
    const me = await t.uid('yuna')
    await t.db.update(s.users).set({ passwordHash: null, kakaoId: 'k1' }).where(eq(s.users.id, me))
    await changePassword(t.db, me, '', 'kakao-pass-1')
    expect(await verifyPassword('kakao-pass-1', (await user(me)).passwordHash)).toBe(true)
  })

  it('deletes an account: anonymize, end sessions, cancel future applications', async () => {
    const me = await t.uid('kanghyun')
    await session(me)
    await deleteAccount(t.db, me, NOW)
    const u = await user(me)
    expect([u.name, u.email, u.kakaoId, u.passwordHash]).toEqual(['탈퇴한 사용자', null, null, null])
    expect(u.handle.startsWith('deleted-')).toBe(true)
    expect(u.suspendedAt).not.toBeNull()
    expect(await sessionsOf(me)).toBe(0)
    const open = await t.db
      .select({ id: s.applications.id })
      .from(s.applications)
      .innerJoin(s.themes, eq(s.themes.id, s.applications.themeId))
      .where(
        and(
          eq(s.applications.userId, me),
          inArray(s.applications.status, ['신청 대기', '수락']),
          inArray(s.themes.status, ['모집 중', '모집 마감', '일정 조율 중', '일정 확정']),
          gte(s.themes.day, today(NOW)),
        ),
      )
    expect(open.length).toBe(0)
    await expect(deleteAccount(t.db, me, NOW)).rejects.toBeInstanceOf(FlowError)
  })
})
