import 'server-only'
// 비밀번호 재설정 — 링크(30분, 한 번만). 메일이 준비되면 메일로, 아니면 운영팀이 링크를 만들어 전한다
import { and, eq, gt, isNull } from 'drizzle-orm'
import { db, schema as s } from '@/lib/db'
import { env } from '@/lib/env'
import { randomToken, sha256 } from '@/lib/server/auth/crypto'
import { hashPassword } from '@/lib/server/auth/password'
import { FlowError } from '@/lib/server/domain/types'
import { sendMail } from '@/lib/server/services/mail'

export async function resetLinkFor(userId: string) {
  const token = randomToken(24)
  await db.insert(s.passwordResets).values({
    userId,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  })
  return `${env.APP_URL}/login/reset?token=${token}`
}

/** 이메일로 찾기 — 가입한 메일인지 밖으로 알리지 않는다 */
export async function requestReset(email: string) {
  const e = email.trim().toLowerCase().slice(0, 120)
  if (!e.includes('@')) throw new FlowError('input', '이메일을 확인해 주세요')
  const [u] = await db.select().from(s.users).where(eq(s.users.email, e))
  if (!u || u.suspendedAt) return
  const link = await resetLinkFor(u.id)
  await sendMail({
    to: e,
    subject: '[foty] 비밀번호 다시 정하기',
    text: `아래 링크에서 새 비밀번호를 정해 주세요. 30분 동안 한 번만 쓸 수 있어요.\n\n${link}\n\n요청한 적이 없으면 이 메일은 무시해 주세요.`,
  })
}

export async function resetPassword(token: string, password: string) {
  if (password.length < 8) throw new FlowError('input', '비밀번호는 8자 이상이에요')
  const [r] = await db
    .select()
    .from(s.passwordResets)
    .where(
      and(
        eq(s.passwordResets.tokenHash, sha256(token)),
        isNull(s.passwordResets.usedAt),
        gt(s.passwordResets.expiresAt, new Date()),
      ),
    )
  if (!r) throw new FlowError('expired', '링크가 지났거나 이미 썼어요. 다시 요청해 주세요')
  await db
    .update(s.users)
    .set({ passwordHash: await hashPassword(password) })
    .where(eq(s.users.id, r.userId))
  await db.update(s.passwordResets).set({ usedAt: new Date() }).where(eq(s.passwordResets.id, r.id))
  await db.delete(s.sessions).where(eq(s.sessions.userId, r.userId))
}
