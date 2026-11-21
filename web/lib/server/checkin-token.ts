import 'server-only'
import { env } from '@/lib/env'
import { sign, verifySig } from './crypto'

// 체크인 QR = 서명된 주소. 테마와 그 날짜에 묶여 있어 다른 테마·다른 날에는 쓸 수 없다.
// 휴대폰 카메라로 찍으면 /c/<토큰>이 열리고, 로그인한 참여자면 바로 체크인된다.

export function checkinToken(themeId: string, day: string) {
  return `${themeId}.${sign(`checkin|${themeId}|${day}`)}`
}

export function checkinUrl(themeId: string, day: string) {
  return `${env.APP_URL}/c/${checkinToken(themeId, day)}`
}

/** 토큰 → 테마 id(서명이 맞을 때만). 날짜는 체크인할 때 테마의 날짜로 다시 맞춰 본다 */
export function readCheckinToken(token: string, dayOf: (themeId: string) => string | undefined) {
  const i = token.lastIndexOf('.')
  if (i < 1) return null
  const themeId = token.slice(0, i)
  const day = dayOf(themeId)
  if (!day || !verifySig(`checkin|${themeId}|${day}`, token.slice(i + 1))) return null
  return themeId
}

/** 친구 초대 토큰(신청 id에 묶음) */
export const inviteSig = (applicationId: string) => sign(`invite|${applicationId}`, 12)
export const inviteOk = (applicationId: string, sig: string) => verifySig(`invite|${applicationId}`, sig, 12)
