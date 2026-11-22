'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { act } from '@/lib/server/act'
import { requireHost } from '@/lib/server/auth'
import { editTheme, setMeetDetail } from '@/lib/server/domain/host-edit'
import type { FormState } from './c'

const str = (f: FormData, k: string) => String(f.get(k) ?? '')
const num = (f: FormData, k: string, d = 0) => {
  const n = Number(String(f.get(k) ?? '').replace(/[^\d]/g, ''))
  return Number.isFinite(n) && String(f.get(k) ?? '').trim() !== '' ? n : d
}

export async function editThemeAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireHost()
  const themeId = str(f, 'theme')
  const r = await act(() =>
    editTheme(db, {
      userId: v.id,
      themeId,
      title: str(f, 'title'),
      intro: str(f, 'intro'),
      include: str(f, 'include'),
      exclude: str(f, 'exclude'),
      max: num(f, 'max', 6),
      costWon: num(f, 'cost', 0),
    }),
  )
  if (!r.ok) return { error: r.error }
  revalidatePath(`/themes/${themeId}`)
  revalidatePath('/host')
  redirect(`/themes/${themeId}`)
}

export async function meetDetailAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireHost()
  const themeId = str(f, 'theme')
  const r = await act(() => setMeetDetail(db, { userId: v.id, themeId, text: str(f, 'meet') }))
  if (!r.ok) return { error: r.error }
  revalidatePath(`/host/themes/${themeId}/space`)
  revalidatePath(`/trips/${themeId}`)
  return { done: true }
}
