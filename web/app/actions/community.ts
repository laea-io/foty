'use server'

// 코스 저장 · 커뮤니티 글 · 답변 서버 액션
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireViewer } from '@/lib/server/auth/session'
import { answer, saveCourse, writePost } from '@/lib/server/domain/community'
import { saveImage } from '@/lib/server/services/uploads'
import { act } from '@/lib/server/util/act'
import { type FormState, fail, num, str } from '@/lib/server/util/form'

// ── 코스 ─────────────────────────────────────────────
export async function saveCourseAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireViewer(`/course?place=${str(f, 'place')}`)
  const r = await act(() =>
    saveCourse(db, {
      userId: v.id,
      corePlaceId: str(f, 'place'),
      title: str(f, 'title'),
      stops: str(f, 'stops').split(',').filter(Boolean),
      fromPostId: str(f, 'post') || undefined,
    }),
  )
  if (!r.ok) return fail(r)
  revalidatePath('/course/saved')
  return { done: true }
}

// ── 커뮤니티 ─────────────────────────────────────────
export async function writePostAction(_: FormState, f: FormData): Promise<FormState> {
  const kind = z.enum(['여행 후기', '코스 공유', '질문']).catch('여행 후기').parse(str(f, 'kind'))
  const v = await requireViewer(kind === '질문' ? '/community/ask' : '/community/write')
  const photos: string[] = []
  try {
    for (const file of f.getAll('photos'))
      if (file instanceof File && file.size) photos.push(await saveImage(file))
  } catch (e) {
    return { error: (e as Error).message }
  }
  const r = await act(() =>
    writePost(db, {
      userId: v.id,
      kind,
      title: str(f, 'title') || (kind === '여행 후기' ? `${str(f, 'themeTitle')} 후기` : ''),
      body: str(f, 'body'),
      themeId: str(f, 'theme') || undefined,
      placeId: str(f, 'place') || undefined,
      photos: [
        ...str(f, 'keep')
          .split(',')
          .filter((x) => x.startsWith('/')),
        ...photos,
      ],
      transport: str(f, 'transport') || undefined,
      changedPlace: str(f, 'changed'),
      spentWon: num(f, 'spent', 0) || null,
      public: f.get('public') === 'on',
      allowCopy: f.get('copy') === 'on',
    }),
  )
  if (!r.ok) return fail(r)
  revalidatePath('/community')
  redirect(`/community/${r.data}`)
}

export async function answerAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireViewer(`/community/${str(f, 'post')}`)
  const r = await act(() => answer(db, { userId: v.id, postId: str(f, 'post'), body: str(f, 'body') }))
  if (!r.ok) return fail(r)
  revalidatePath(`/community/${str(f, 'post')}`)
  return { done: true }
}
