// 게시한 뒤 호스트가 고칠 수 있는 것: 제목·소개·포함/불포함(글) · 최대 인원 · 예상 비용(성사 전) · 집결 상세(성사 뒤)
// 일정(날짜·핵심 시간)과 성사 뒤 예산은 주요 변경이라 그룹 공간의 변경 제안(propose)으로 간다.
import { and, eq } from 'drizzle-orm'
import * as s from '@/lib/db/schema'
import { acceptedCount, memberIds } from './flow'
import { notify, systemMessage } from './notify'
import { type AnyDb, FlowError } from './types'

async function ownTheme(db: AnyDb, themeId: string, userId: string) {
  const [row] = await db
    .select({ t: s.themes, hostUser: s.hosts.userId })
    .from(s.themes)
    .innerJoin(s.hosts, eq(s.hosts.id, s.themes.hostId))
    .where(eq(s.themes.id, themeId))
  if (!row) throw new FlowError('not-found', '테마를 찾을 수 없어요')
  if (row.hostUser !== userId) throw new FlowError('forbidden', '이 테마의 호스트가 아니에요')
  if (row.t.status === '취소' || row.t.status === '여행 완료')
    throw new FlowError('closed', '이미 끝난 테마예요')
  return row.t
}

export async function editTheme(
  db: AnyDb,
  input: {
    userId: string
    themeId: string
    title: string
    intro: string
    include: string
    exclude: string
    max: number
    costWon: number
  },
) {
  const t = await ownTheme(db, input.themeId, input.userId)
  const title = input.title.trim().slice(0, 40)
  if (!title) throw new FlowError('input', '제목을 적어 주세요')
  const accepted = await acceptedCount(db, t.id)
  if (input.max < Math.max(t.min, accepted) || input.max > 12)
    throw new FlowError('input', `최대 인원은 ${Math.max(t.min, accepted)}명 이상 12명 이하로 정해 주세요`)
  const matched = accepted >= t.min
  if (matched && input.costWon !== t.costWon)
    throw new FlowError('matched', '성사된 뒤 예산은 그룹 공간에서 변경 제안으로 바꿔 주세요')
  const reopen = t.status === '모집 마감' && input.max > accepted && t.deadline > new Date()
  await db
    .update(s.themes)
    .set({
      title,
      intro: input.intro.trim().slice(0, 200),
      include: input.include.trim().slice(0, 120),
      exclude: input.exclude.trim().slice(0, 120),
      max: input.max,
      costWon: Math.max(0, input.costWon),
      ...(reopen ? { status: '모집 중' as const } : {}),
      ...(t.status === '모집 중' && input.max <= accepted ? { status: '모집 마감' as const } : {}),
    })
    .where(eq(s.themes.id, t.id))
}

/** 집결 상세(성사 뒤 공개) — 호스트가 정하면 참여자에게 알리고 대화에 남긴다 */
export async function setMeetDetail(db: AnyDb, input: { userId: string; themeId: string; text: string }) {
  const t = await ownTheme(db, input.themeId, input.userId)
  const text = input.text.trim().slice(0, 120)
  if (!text) throw new FlowError('input', '모이는 곳과 시간을 적어 주세요')
  if ((await acceptedCount(db, t.id)) < t.min)
    throw new FlowError('not-matched', '성사된 뒤에 공개돼요. 성사되면 다시 정해 주세요')
  await db
    .update(s.themes)
    .set({ meetDetail: text })
    .where(and(eq(s.themes.id, t.id)))
  await systemMessage(db, t.id, `집결: ${text}`)
  await notify(db, await memberIds(db, t.id), {
    title: '집결 장소가 정해졌어요',
    body: text,
    href: `/trips/${t.id}`,
  })
}
