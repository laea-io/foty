'use server'

// 운영팀 서버 액션 — 호스트·신고·정지·숨김·테마 취소·참여 확인
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/server/auth/session'
import {
  adminCancelTheme,
  decideAttendance,
  decideHost,
  resolveReport,
  setCommentHidden,
  setHostSuspended,
  setPostHidden,
  setUserSuspended,
} from '@/lib/server/domain/admin'
import { act } from '@/lib/server/util/act'
import { type FormState, text } from '@/lib/server/util/form'

// ── 운영팀 ───────────────────────────────────────────
export async function adminHostAction(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin()
  const ok = form.get('ok') === '1'
  const reason = text(form, 'reason')
  if (!ok && !reason) return { error: '보류 사유를 적어 주세요. 호스트에게 그대로 전해져요' }
  const r = await act(() => decideHost(db, text(form, 'hostId'), ok, new Date(), reason))
  if (!r.ok) return { error: r.error }
  revalidatePath('/admin')
}

export async function adminReportAction(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin()
  const r = await act(() => resolveReport(db, text(form, 'reportId'), form.get('done') === '1'))
  if (!r.ok) return { error: r.error }
  revalidatePath('/admin')
}

/** 호스트 권한 정지(on=1) / 해제(on=0) */
export async function adminHostSuspendAction(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin()
  const on = form.get('on') === '1'
  const r = await act(() => setHostSuspended(db, text(form, 'hostId'), on, text(form, 'reason')))
  if (!r.ok) return { error: r.error }
  revalidatePath('/admin')
}

/** 사용자 정지(on=1: 세션 끝내고 로그인 막기) / 해제(on=0) */
export async function adminUserSuspendAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireAdmin()
  const userId = text(form, 'userId')
  if (!z.string().uuid().safeParse(userId).success) return { error: '사용자를 찾을 수 없어요' }
  if (userId === me.id) return { error: '나를 정지할 수는 없어요' }
  const r = await act(() => setUserSuspended(db, userId, form.get('on') === '1'))
  if (!r.ok) return { error: r.error }
  revalidatePath('/admin')
}

/** 글(kind=post) · 댓글(kind=comment) 숨기기(on=1) / 다시 보이기(on=0) */
export async function adminHideAction(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin()
  const id = text(form, 'id')
  const on = form.get('on') === '1'
  const kind = text(form, 'kind')
  if (kind === 'comment' && !z.string().uuid().safeParse(id).success)
    return { error: '댓글을 찾을 수 없어요' }
  const r = await act(() => (kind === 'comment' ? setCommentHidden(db, id, on) : setPostHidden(db, id, on)))
  if (!r.ok) return { error: r.error }
  revalidatePath('/admin')
  revalidatePath('/community')
}

/** 운영팀 테마 취소(사유 필수, 참여자·신청자·호스트에게 알림) */
export async function adminCancelThemeAction(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin()
  const themeId = text(form, 'themeId')
  const r = await act(() => adminCancelTheme(db, themeId, text(form, 'reason')))
  if (!r.ok) return { error: r.error }
  revalidatePath('/admin')
  revalidatePath(`/themes/${themeId}`)
}

/** 참여 기록 검토 중 → 참여 확인(ok=1) / 불참 확인(ok=0) */
export async function adminAttendanceAction(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin()
  const userId = text(form, 'userId')
  if (!z.string().uuid().safeParse(userId).success) return { error: '사용자를 찾을 수 없어요' }
  const r = await act(() =>
    decideAttendance(db, { themeId: text(form, 'themeId'), userId, attended: form.get('ok') === '1' }),
  )
  if (!r.ok) return { error: r.error }
  revalidatePath('/admin')
}
