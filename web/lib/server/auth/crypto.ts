// 토큰·해시·서명(HMAC) 도구
import 'server-only'
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { env } from '@/lib/env'

export { hashPassword, verifyPassword } from '@/lib/server/auth/password'

export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url')
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

/** 서명(체크인 QR · 초대 링크) — 짧게 자른 HMAC */
export function sign(payload: string, len = 16) {
  return createHmac('sha256', env.AUTH_SECRET).update(payload).digest('base64url').slice(0, len)
}

export function verifySig(payload: string, sig: string, len = 16) {
  const want = Buffer.from(sign(payload, len))
  const got = Buffer.from(sig)
  return want.length === got.length && timingSafeEqual(want, got)
}
