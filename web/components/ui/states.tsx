import type { ReactNode } from 'react'
import { DesktopFrame, MobileFrame, MobileTopBar } from '@/components/shell/mobile'
import { Icon } from '@/components/ui/icon'
import { Mascot } from '@/components/ui/mascot'
import { DemoNote } from '@/components/ui/primitives'

/** 오류 화면 본문(경고 동그라미 + 제목 + 설명 + 버튼 두 개) */
export function ErrorBody({
  title,
  body,
  actions,
  mascot,
}: {
  title: string
  body: ReactNode
  actions: ReactNode
  /** 경고 아이콘 대신 회색 마스코트(찾을 수 없음) */
  mascot?: boolean
}) {
  return (
    <>
      <div className="flex flex-col items-center pt-24 text-center">
        {mascot ? (
          <Mascot size={64} tone="gray" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-face">
            <Icon name="alert" size={28} weight={1.7} />
          </span>
        )}
        <div className="mt-[22px] text-[20px] font-extrabold tracking-[-0.03em]">{title}</div>
        <div className="mt-2 text-[14px] leading-[21px] text-sub">{body}</div>
      </div>
      <div className="mt-7 flex flex-col gap-2">{actions}</div>
    </>
  )
}

/** 상태 화면 틀: 모바일은 BackBar 자리(top), 데스크톱은 가운데 600px + 작은 제목 */
export function StateFrame({
  top,
  eyebrow,
  children,
}: {
  top: ReactNode
  eyebrow?: string
  children: ReactNode
}) {
  return (
    <>
      <MobileFrame>
        {top}
        <div className="px-5">{children}</div>
        <DemoNote className="pb-10" />
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[600px]">
          {eyebrow && <div className="mb-2 text-[14px] text-sub">{eyebrow}</div>}
          {children}
        </div>
      </DesktopFrame>
    </>
  )
}

const bone = 'block rounded-[8px] bg-face motion-safe:animate-pulse'

function Finding({ size }: { size: number }) {
  return (
    <div className="flex items-center gap-2 text-sub" style={{ fontSize: size }}>
      <Mascot size={22} />갈 수 있는 테마를 찾고 있어요
    </div>
  )
}

/** 불러오는 중(홈 모양 뼈대) — 모바일·데스크톱 */
export function LoadingSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <MobileFrame tabbar>
        <MobileTopBar />
        <div className="px-5">
          <div className="mt-2">
            <Finding size={13} />
          </div>
          <div className="mt-3.5">
            <span className={`${bone} h-[132px] w-full rounded-[20px]`} />
          </div>
          <div className="mt-2.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3.5 py-3.5">
                <span className={`${bone} h-[88px] w-[88px] flex-none rounded-[12px]`} />
                <div className="flex grow flex-col gap-[9px] pt-1">
                  <span className={`${bone} h-3.5 w-[40%]`} />
                  <span className={`${bone} h-4 w-[85%]`} />
                  <span className={`${bone} h-3 w-[65%]`} />
                  <span className={`${bone} h-2.5 w-[45%]`} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <DemoNote />
      </MobileFrame>
      <DesktopFrame>
        <span className={`${bone} h-[260px] w-full rounded-[20px]`} />
        <div className="mt-11 flex gap-12">
          <aside className="w-[260px] flex-none">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="border-t border-line py-[18px]">
                <span className={`${bone} h-3.5 w-[40%]`} />
                <div className="mt-3 flex gap-1.5">
                  <span className={`${bone} h-[38px] w-[70px] rounded-[19px]`} />
                  <span className={`${bone} h-[38px] w-[84px] rounded-[19px]`} />
                  <span className={`${bone} h-[38px] w-[60px] rounded-[19px]`} />
                </div>
              </div>
            ))}
          </aside>
          <div className="flex-1">
            <Finding size={14} />
            <div className="mt-6 grid grid-cols-3 gap-x-6 gap-y-10">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i}>
                  <span className={`${bone} h-[210px] w-full rounded-[20px]`} />
                  <div className="mt-4 flex flex-col gap-2.5">
                    <span className={`${bone} h-3.5 w-[35%]`} />
                    <span className={`${bone} h-[18px] w-[80%]`} />
                    <span className={`${bone} h-3 w-[60%]`} />
                    <span className={`${bone} h-1.5 w-full`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DesktopFrame>
    </div>
  )
}
