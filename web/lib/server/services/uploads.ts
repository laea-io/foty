import 'server-only'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { env } from '@/lib/env'
import { randomToken } from '@/lib/server/auth/crypto'

// 후기 사진 — 서버 폴더(UPLOAD_DIR, 도커 볼륨)에 저장하고 /api/files/<이름>으로 준다.
// 운영에서 버킷으로 옮길 때는 이 두 함수만 바꾼다.
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const MAX_BYTES = 8 * 1024 * 1024

/** 파일 앞부분으로 형식을 다시 확인(확장자·Content-Type만 믿지 않는다) */
function sniff(b: Buffer) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return 'image/png'
  if (b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP') return 'image/webp'
  return null
}

export async function saveImage(file: File) {
  if (file.size > MAX_BYTES) throw new Error('사진은 8MB까지 올릴 수 있어요')
  const buf = Buffer.from(await file.arrayBuffer())
  const type = sniff(buf)
  if (!type) throw new Error('JPG·PNG·WEBP 사진만 올릴 수 있어요')
  const name = `${randomToken(12)}.${TYPES[type]}`
  await mkdir(env.UPLOAD_DIR, { recursive: true })
  await writeFile(path.join(env.UPLOAD_DIR, name), buf)
  return `/api/files/${name}`
}

export async function readImage(name: string) {
  if (!/^[A-Za-z0-9_-]{16}\.(jpg|png|webp)$/.test(name)) return null
  try {
    const body = await readFile(path.join(env.UPLOAD_DIR, name))
    const ext = name.split('.').pop() as string
    return { body, type: Object.entries(TYPES).find(([, e]) => e === ext)?.[0] ?? 'application/octet-stream' }
  } catch {
    return null
  }
}
