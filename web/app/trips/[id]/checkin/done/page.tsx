import type { Metadata } from 'next'
import Link from 'next/link'
import { loadSpace, spaceParams } from '@/components/b/trips/load'
import { SimpleScreen } from '@/components/b/trips/simple'
import { ThemeMini } from '@/components/theme/cards'
import { Mascot } from '@/components/ui/mascot'
import { ButtonLink } from '@/components/ui/primitives'

type Props = { params: Promise<{ id: string }> }

export const generateStaticParams = spaceParams
export const metadata: Metadata = { title: '체크인 완료' }

export default async function CheckinDonePage({ params }: Props) {
  const { s, t } = loadSpace((await params).id)
  const core = t.stops.find((st) => st.fixed) ?? t.stops[0]
  return (
    <SimpleScreen
      title="현장 체크인"
      back={`/trips/${t.id}/checkin`}
      bottom={
        <div className="grow">
          <ButtonLink href={`/trips/${t.id}`} size="lg" block>
            그룹 공간으로
          </ButtonLink>
        </div>
      }
    >
      <div className="flex flex-col items-center pt-12 pb-7 text-center">
        <Mascot size={72} />
        <div className="mt-[22px] text-[24px] leading-8 font-extrabold tracking-[-0.04em]">
          참여가 확인되고
          <br />
          스탬프를 받았어요
        </div>
        <div className="mt-2 text-[14px] leading-[21px] text-sub">
          {t.date} {s.checkinAt} · {core.name}
        </div>
      </div>
      <ThemeMini t={t} />
      <div className="mt-4 flex items-center gap-3 rounded-[16px] px-4 py-3.5 shadow-[inset_0_0_0_1px_var(--color-line)]">
        <Mascot size={40} />
        <div className="grow">
          <div className="text-[14px] font-bold">{t.place} 스탬프</div>
          <div className="mt-px text-[12px] text-sub">{s.stampNote}</div>
        </div>
        <Link href="/my/stamps" className="text-[13px] font-semibold text-ink no-underline">
          스탬프북 ›
        </Link>
      </div>
      <div className="mt-4 text-[12px] leading-[18px] text-muted">
        여행이 끝나면 함께한 사람을 평가하고 후기를 남길 수 있어요. 방문 기록은 호스트의 방문 요약에 반영돼요.
      </div>
    </SimpleScreen>
  )
}
