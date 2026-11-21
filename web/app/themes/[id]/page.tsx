import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { CancelButton } from '@/components/b/theme/cancel-button'
import { loadThemeCtx } from '@/components/b/theme/load'
import { type DetailState, StateDetail } from '@/components/b/theme/state-detail'
import { ThemeDetail } from '@/components/theme/detail'
import { ButtonLink } from '@/components/ui/primitives'
import {
  detailExtras,
  hostCard,
  hostThemes,
  meetFor,
  otherDates,
  subscribedToHost,
} from '@/lib/server/q/b-themes'
import { themeDetail } from '@/lib/server/q/themes'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await themeDetail((await params).id)
  return { title: d?.theme.title }
}

const strong = (s: string) => <span className="font-semibold text-ink">{s}</span>

/**
 * 테마 상세 — 실제 데이터로 화면을 고른다.
 * 비로그인 → 비로그인 화면 · 모집 마감(신청 안 한 사람) → 모집 마감 · 일정 확정/여행 완료(참여자·호스트) → 그 화면 ·
 * 신청자/참여자 → 내 상태 + 신청 취소/그룹 공간 · 호스트 → 호스트 화면으로.
 * ?view=guest|closed|confirmed|done 은 디자인 확인용으로 남겨 둔다.
 */
export default async function ThemePage({ params, searchParams }: Props) {
  const { theme: t, viewer, rel } = await loadThemeCtx(params)
  const raw = (await searchParams).view
  const view = Array.isArray(raw) ? raw[0] : raw
  const host = await hostCard(t.hostId, t.intro)
  const inGroup = rel.role === 'member' || rel.role === 'host'

  const stateFor = (): DetailState | null => {
    if (view === 'closed' || view === 'confirmed' || view === 'done') return view
    if (!viewer || view === 'guest') return null
    if (t.status === '여행 완료' && inGroup) return 'done'
    if (t.status === '일정 확정' && inGroup) return 'confirmed'
    if (t.status === '모집 마감' && rel.role === 'viewer') return 'closed'
    return null
  }
  const state = stateFor()
  if (state) {
    const [x, dates, hostList, subscribed] = await Promise.all([
      detailExtras(t.id, viewer?.id),
      state === 'closed' ? otherDates(t) : [],
      state === 'done' ? hostThemes(t) : [],
      subscribedToHost(viewer?.id, t.hostId),
    ])
    return (
      <StateDetail
        t={t}
        state={state}
        x={{
          hostName: t.hostName,
          hostId: t.hostId,
          dates,
          hostList,
          meet: meetFor(t),
          memberCount: t.current,
          allConfirmed: x.pending === 0,
          historyCount: x.historyCount,
          attended: x.attended,
          checkedIn: x.checkedIn,
          subscribed,
          loggedIn: !!viewer,
        }}
      />
    )
  }

  if (!viewer || view === 'guest') return <ThemeDetail t={t} host={host} guest />

  const a = rel.application
  let action: ReactNode
  let notice: ReactNode
  if (rel.role === 'host') {
    action = t.matched ? (
      <ButtonLink href={`/host/themes/${t.id}/space`} size="lg" block>
        그룹 공간 열기
      </ButtonLink>
    ) : (
      <ButtonLink href={`/host/themes/${t.id}/applicants`} size="lg" block>
        신청자 보기
      </ButtonLink>
    )
    notice = <>{strong('내가 연 테마예요')} · 신청과 일정은 호스트 화면에서 관리해요.</>
  } else if (rel.role === 'member' && t.matched) {
    action = (
      <ButtonLink href={`/trips/${t.id}`} size="lg" block>
        그룹 공간 열기
      </ButtonLink>
    )
    notice = <>{strong('참여 확정')} · 성사된 테마예요. 집결과 일정은 그룹 공간에서 정해요.</>
  } else if (rel.role === 'member' || rel.role === 'applicant') {
    action = <CancelButton themeId={t.id} />
    notice =
      rel.role === 'applicant' ? (
        <>{strong('신청 대기')} · 호스트가 확인하면 알려드려요. 성사 전에는 언제든 취소할 수 있어요.</>
      ) : (
        <>{strong('신청 수락')} · 최소 인원이 모이면 성사돼요. 성사 전에는 언제든 취소할 수 있어요.</>
      )
    if (a && a.party > 1)
      notice = (
        <>
          {notice} 친구와 함께 신청했어요 ·{' '}
          <Link href={`/themes/${t.id}/invite`} className="font-semibold text-ink">
            초대 링크
          </Link>
        </>
      )
  } else if (t.status === '취소' && a && a.status !== '신청 취소') {
    const auto = t.cancelReason === '최소 인원 미달'
    action = (
      <ButtonLink
        href={`/themes/${t.id}/${auto ? 'cancelled' : 'host-cancelled'}`}
        variant="outline"
        size="lg"
        block
      >
        취소된 테마예요 · 다른 날짜 보기
      </ButtonLink>
    )
  } else if (a?.status === '거절') {
    action = (
      <ButtonLink href={`/themes/${t.id}/rejected`} variant="soft" size="lg" block>
        이번에는 함께하지 못하게 됐어요
      </ButtonLink>
    )
  }
  return <ThemeDetail t={t} host={host} action={action} notice={notice} />
}
