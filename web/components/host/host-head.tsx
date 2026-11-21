import { MobileTopBar } from '@/components/shell/mobile'
import { ButtonLink, Segmented } from '@/components/ui/primitives'
import { pastThemes } from '@/lib/demo/host'

export const hostTabs = [
  { href: '/host', label: '모집 중 1' },
  { href: '/host?tab=matched', label: '성사 1' },
  { href: '/host/past', label: `지난 테마 ${pastThemes.length}` },
]

/** 호스트 내 테마 머리: 모바일은 로고 줄 + 세그먼트, 데스크톱은 제목 + 새 테마 등록 + 세그먼트 */
export function HostHeadMobile({ current }: { current: string }) {
  return (
    <>
      <MobileTopBar host />
      <div className="px-5 pt-1">
        <Segmented items={hostTabs} current={current} />
      </div>
    </>
  )
}

export function HostHeadDesktop({ current }: { current: string }) {
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
        <Segmented items={hostTabs} current={current} />
      </div>
    </>
  )
}
