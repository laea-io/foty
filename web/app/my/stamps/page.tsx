import type { Metadata } from 'next'
import { StampGroup } from '@/components/a/stamps'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { DemoNote, Segmented } from '@/components/ui/primitives'
import { me } from '@/lib/demo/people'
import { regionCount, regionGroups, stampCount } from '@/lib/demo/stamps'

export const metadata: Metadata = { title: '스탬프북' }

const tabs = [
  { href: '/my/stamps', label: '권역' },
  { href: '/my/stamps/season', label: '계절 시리즈' },
]

function Body({ cols }: { cols: number }) {
  return (
    <>
      <div className="mt-2.5 flex items-end justify-between">
        <div>
          <div className="text-[13px] text-sub">{me.name} 님이 다녀온 남양주</div>
          <div className="mt-0.5 text-[28px] font-extrabold tracking-[-0.04em]">
            {stampCount}곳{' '}
            <span className="text-[15px] font-semibold tracking-normal text-sub">· 권역 {regionCount}곳</span>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <Segmented items={tabs} current="/my/stamps" />
      </div>
      {regionGroups.map((g) => (
        <StampGroup
          key={g.region.id}
          title={g.region.name}
          aside={`${g.got} / ${g.total}`}
          cells={g.cells}
          cols={cols}
        />
      ))}
      <div className="mt-4 text-[12px] leading-[18px] text-muted">
        스탬프는 핵심 장소에서 현장 체크인을 하면 받아요. 빈 칸을 누르면 그 권역에서 모집 중인 테마를 볼 수
        있어요. 내 기록을 모아 두는 곳이라 다른 사람과 비교하지 않아요. 권역 구분은 예시예요.
      </div>
    </>
  )
}

export default function StampbookPage() {
  return (
    <>
      <MobileFrame>
        <BackBar title="스탬프북" back="/my" />
        <div className="px-5">
          <Body cols={3} />
        </div>
        <DemoNote className="pb-10" />
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[880px]">
          <h1 className="m-0 text-[30px] leading-[38px] font-extrabold tracking-[-0.05em]">스탬프북</h1>
          <Body cols={6} />
        </div>
      </DesktopFrame>
    </>
  )
}
