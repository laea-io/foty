import type { ReactNode } from 'react'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { DemoNote } from '@/components/ui/primitives'

/**
 * 공간의 하위 화면 틀(AI 모름 · 체크인 완료 · 변경 이력 · 평가).
 * 모바일: 뒤로 막대 + 본문 + 하단 버튼 줄 / 데스크톱: 가운데 600px, 위에 작은 제목, 버튼은 본문 아래.
 */
export function SimpleScreen({
  title,
  back,
  children,
  bottom,
  desktopBottom,
}: {
  title: string
  back: string
  children: ReactNode
  bottom?: ReactNode
  /** 데스크톱 버튼 줄(없으면 bottom을 그대로) */
  desktopBottom?: ReactNode
}) {
  const wideBottom = desktopBottom ?? bottom
  return (
    <>
      <MobileFrame bottom={!!bottom}>
        <BackBar title={title} back={back} />
        <div className="px-5">{children}</div>
        <DemoNote />
        {!bottom && <div className="h-10" />}
        {bottom && <BottomBar>{bottom}</BottomBar>}
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[600px]">
          <div className="mb-2 text-[14px] text-sub">{title}</div>
          {children}
          {wideBottom && <div className="mt-8 flex items-center gap-2.5">{wideBottom}</div>}
        </div>
      </DesktopFrame>
    </>
  )
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <>
      <h1 className="mt-4 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">{children}</h1>
      {sub && <div className="mt-1.5 text-[13px] leading-5 text-sub">{sub}</div>}
    </>
  )
}
