// 비밀번호 해시(scrypt). server-only가 아니라 seed·시험에서도 쓴다.
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>
const PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }

/** scrypt$N$salt$hash */
export async function hashPassword(pw: string) {
  const salt = randomBytes(16)
  const h = await scrypt(pw, salt, 32, PARAMS)
  return `scrypt$${PARAMS.N}$${salt.toString('base64url')}$${h.toString('base64url')}`
}

export async function verifyPassword(pw: string, stored: string | null) {
  if (!stored?.startsWith('scrypt$')) return false
  const [, n, salt, hash] = stored.split('$')
  const h = await scrypt(pw, Buffer.from(salt, 'base64url'), 32, { ...PARAMS, N: Number(n) })
  const want = Buffer.from(hash, 'base64url')
  return want.length === h.length && timingSafeEqual(want, h)
}
