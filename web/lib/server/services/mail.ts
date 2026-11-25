import 'server-only'
// 메일 보내기 — RESEND_API_KEY와 MAIL_FROM이 있으면 Resend로, 없으면 보내지 않고 false
import { env } from '@/lib/env'

export const mailReady = () => !!(env.RESEND_API_KEY && env.MAIL_FROM)

export async function sendMail(m: { to: string; subject: string; text: string }) {
  if (!mailReady()) return false
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.MAIL_FROM, to: [m.to], subject: m.subject, text: m.text }),
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) throw new Error(`resend ${r.status}`)
    return true
  } catch (e) {
    console.warn('[foty] 메일 실패:', e instanceof Error ? e.message : e)
    return false
  }
}
