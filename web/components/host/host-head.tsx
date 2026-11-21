import { MobileTopBar } from '@/components/shell/mobile'
import { ButtonLink, Segmented } from '@/components/ui/primitives'

export type HostCounts = { recruiting: number; matched: number; past: number }

export const hostTabs = (n: HostCounts) => [
  { href: '/host', label: `모집 중 ${n.recruiting}` },
  { href: '/host?tab=matched', label: `성사 ${n.matched}` },
  { href: '/host/past', label: `지난 테마 ${n.past}` },
]

/** 호스트 내 테마 머리: 모바일은 로고 줄 + 세그먼트, 데스크톱은 제목 + 새 테마 등록 + 세그먼트 */
export function HostHeadMobile({ current, n }: { current: string; n: HostCounts }) {
  return (
    <>
      <MobileTopBar host />
      <div className="px-5 pt-1">
        <Segmented items={hostTabs(n)} current={current} />
      </div>
    </>
  )
}

export function HostHeadDesktop({ current, n }: { current: string; n: HostCounts }) {
  return (
    <>
      <div className="flex items-center gap-4">
        <h1 className="m-0 text-[30px] leading-[38px] font-extrabold tracking-[-0.05em]">내 테마</h1>
        <span className="grow" />
        <ButtonLink href="/host/new" size="sm" icon="plus">
          새 테마 등록
        </ButtonLink>
      </div>
      <div className="mt-5 max-w-[520px]">
        <Segmented items={hostTabs(n)} current={current} />
      </div>
    </>
  )
}
